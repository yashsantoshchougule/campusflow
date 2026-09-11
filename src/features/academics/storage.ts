import type { FileMetadata } from './models';
import { validateNoteFile } from './validations.ts';
import { getSupabase, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

export interface StorageAdapter {
  uploadFile(file: File): Promise<FileMetadata>;
  getFile(path: string): Promise<Blob | null>;
  getFileUrl(path: string): Promise<string | null>;
  deleteFile(path: string): Promise<void>;
}

const urls = new Map<string, string>();
const DB_NAME = 'studybuddy-academic-files';
const STORE_NAME = 'files';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open file storage.'));
  });
}

async function fileRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('File storage request failed.'));
  });
}

export const mockStorageAdapter: StorageAdapter = {
  async uploadFile(file) {
    const error = validateNoteFile(file);
    if (error) throw new Error(error);
    const filePath = crypto.randomUUID();
    await fileRequest('readwrite', (store) => store.put(file, filePath));
    urls.set(filePath, URL.createObjectURL(file));
    return { fileName: file.name, fileType: file.type, fileSize: file.size, filePath };
  },
  async getFile(path) { return await fileRequest('readonly', (store) => store.get(path)) as Blob | null; },
  async getFileUrl(path) {
    const current = urls.get(path);
    if (current) return current;
    const file = await this.getFile(path);
    if (!file) return null;
    const url = URL.createObjectURL(file);
    urls.set(path, url);
    return url;
  },
  async deleteFile(path) {
    const url = urls.get(path);
    if (url) URL.revokeObjectURL(url);
    urls.delete(path);
    await fileRequest('readwrite', (store) => store.delete(path));
  },
};

const remotePath = (value: string) => {
  const [bucket, ...parts] = value.split('/');
  if (!['student-documents', 'academic-notes'].includes(bucket) || parts.length === 0) throw new Error('Invalid CampusFlow document path.');
  return { bucket, path: parts.join('/') };
};

export const supabaseStorageAdapter: StorageAdapter = {
  async uploadFile(file) {
    const error = validateNoteFile(file);
    if (error) throw new Error(error);
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from('student-documents').upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    return { fileName: file.name, fileType: file.type, fileSize: file.size, filePath: `student-documents/${path}` };
  },
  async getFile(value) {
    const { bucket, path } = remotePath(value);
    const supabase = await getSupabase();
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) throw error;
    return data;
  },
  async getFileUrl(value) {
    const { bucket, path } = remotePath(value);
    const supabase = await getSupabase();
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  },
  async deleteFile(value) {
    const { bucket, path } = remotePath(value);
    const supabase = await getSupabase();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },
};
