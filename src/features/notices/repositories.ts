/** Academic-context shape adapted from Nidhish-Balasubramanya/RPA-Driven-Academic-Mail-Manager app/models.py. Copyright (c) 2025 Nidhish, MIT. */
import type { NoticeActionLink, NoticeDraft, NoticeHistoryEntry, NoticeSource, StudentAcademicContext } from './models';
import { getSupabase, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

const KEYS = {
  sources: 'studybuddy.notices.sources.v1', notices: 'studybuddy.notices.versions.v1',
  history: 'studybuddy.notices.history.v1', links: 'studybuddy.notices.links.v1', context: 'studybuddy.notices.student-context.v1',
};
const memory = new Map<string, string>();
const memoryFiles = new Map<string, Blob>();
const storage = () => typeof localStorage === 'undefined' ? { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } : localStorage;
const read = <T>(key: string): T[] => { try { return JSON.parse(storage().getItem(key) ?? '[]') as T[]; } catch { return []; } };
const write = <T>(key: string, values: T[]) => storage().setItem(key, JSON.stringify(values));

export interface NoticeSourceRepository {
  list(): Promise<NoticeSource[]>;
  get(id: string): Promise<NoticeSource | null>;
  findByHash(hash: string): Promise<NoticeSource | null>;
  save(source: NoticeSource, file: Blob): Promise<void>;
  update(source: NoticeSource): Promise<void>;
  getFile(id: string): Promise<Blob | null>;
  delete(id: string): Promise<void>;
}
export interface NoticeRepository { list(): Promise<NoticeDraft[]>; get(id: string): Promise<NoticeDraft | null>; findBySource(sourceId: string): Promise<NoticeDraft | null>; saveVersion(notice: NoticeDraft): Promise<void>; deleteBySource(sourceId: string): Promise<void>; }
export interface NoticeHistoryRepository { list(noticeId?: string): Promise<NoticeHistoryEntry[]>; save(entry: NoticeHistoryEntry): Promise<void>; deleteByNotice(noticeId: string): Promise<void>; }
export interface NoticeActionLinkRepository { list(noticeId?: string): Promise<NoticeActionLink[]>; save(link: NoticeActionLink): Promise<void>; deleteByNotice(noticeId: string): Promise<void>; }
export interface StudentAcademicContextRepository { get(): Promise<StudentAcademicContext>; save(context: StudentAcademicContext): Promise<void>; }

const DB_NAME = 'studybuddy-notice-files';
const STORE_NAME = 'sources';
const openDatabase = () => new Promise<IDBDatabase | null>((resolve, reject) => {
  if (typeof indexedDB === 'undefined') { resolve(null); return; }
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const requestResult = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });

export class LocalNoticeSourceRepository implements NoticeSourceRepository {
  async list() { return read<NoticeSource>(KEYS.sources).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async get(id: string) { return read<NoticeSource>(KEYS.sources).find((source) => source.id === id) ?? null; }
  async findByHash(hash: string) { return read<NoticeSource>(KEYS.sources).find((source) => source.fileHash === hash) ?? null; }
  async save(source: NoticeSource, file: Blob) {
    const values = read<NoticeSource>(KEYS.sources); values.push(source); write(KEYS.sources, values);
    const database = await openDatabase();
    if (!database) { memoryFiles.set(source.id, file); return; }
    const transaction = database.transaction(STORE_NAME, 'readwrite'); transaction.objectStore(STORE_NAME).put(file, source.id);
    await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
  }
  async update(source: NoticeSource) { const values = read<NoticeSource>(KEYS.sources); const index = values.findIndex((item) => item.id === source.id); if (index >= 0) values[index] = source; else values.push(source); write(KEYS.sources, values); }
  async getFile(id: string) {
    const database = await openDatabase();
    if (!database) return memoryFiles.get(id) ?? null;
    return (await requestResult(database.transaction(STORE_NAME).objectStore(STORE_NAME).get(id)) as Blob | undefined) ?? null;
  }
  async delete(id: string) {
    write(KEYS.sources, read<NoticeSource>(KEYS.sources).filter((source) => source.id !== id)); memoryFiles.delete(id);
    const database = await openDatabase(); if (!database) return;
    const transaction = database.transaction(STORE_NAME, 'readwrite'); transaction.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
  }
}

export class LocalNoticeRepository implements NoticeRepository {
  async list() {
    const latest = new Map<string, NoticeDraft>();
    for (const notice of read<NoticeDraft>(KEYS.notices)) if (!latest.has(notice.id) || latest.get(notice.id)!.version < notice.version) latest.set(notice.id, notice);
    return [...latest.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async get(id: string) { return (await this.list()).find((notice) => notice.id === id) ?? null; }
  async findBySource(sourceId: string) { return (await this.list()).find((notice) => notice.sourceId === sourceId) ?? null; }
  async saveVersion(notice: NoticeDraft) { const values = read<NoticeDraft>(KEYS.notices).filter((item) => item.id !== notice.id || item.version !== notice.version); values.push(notice); write(KEYS.notices, values); }
  async deleteBySource(sourceId: string) { write(KEYS.notices, read<NoticeDraft>(KEYS.notices).filter((item) => item.sourceId !== sourceId)); }
}

export class LocalNoticeHistoryRepository implements NoticeHistoryRepository {
  async list(noticeId?: string) { return read<NoticeHistoryEntry>(KEYS.history).filter((entry) => !noticeId || entry.noticeId === noticeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async save(entry: NoticeHistoryEntry) { const values = read<NoticeHistoryEntry>(KEYS.history); values.push(entry); write(KEYS.history, values); }
  async deleteByNotice(noticeId: string) { write(KEYS.history, read<NoticeHistoryEntry>(KEYS.history).filter((entry) => entry.noticeId !== noticeId)); }
}

export class LocalNoticeActionLinkRepository implements NoticeActionLinkRepository {
  async list(noticeId?: string) { return read<NoticeActionLink>(KEYS.links).filter((link) => !noticeId || link.noticeId === noticeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async save(link: NoticeActionLink) { const values = read<NoticeActionLink>(KEYS.links); values.push(link); write(KEYS.links, values); }
  async deleteByNotice(noticeId: string) { write(KEYS.links, read<NoticeActionLink>(KEYS.links).filter((link) => link.noticeId !== noticeId)); }
}

const emptyContext = (): StudentAcademicContext => ({ course: '', branch: '', year: '', semester: '', division: '', academicStatus: '', atktStatus: '' });
export class LocalStudentAcademicContextRepository implements StudentAcademicContextRepository {
  async get() { try { return { ...emptyContext(), ...JSON.parse(storage().getItem(KEYS.context) ?? '{}') as StudentAcademicContext }; } catch { return emptyContext(); } }
  async save(context: StudentAcademicContext) { storage().setItem(KEYS.context, JSON.stringify(context)); }
}

const sourceFromRow = (row: any): NoticeSource => ({
  id: row.id, sourceType: row.source_type, fileName: row.file_name, mimeType: row.mime_type,
  fileHash: row.file_hash, pageCount: row.page_count ?? undefined, createdAt: row.created_at, extractedAt: row.extracted_at ?? undefined,
});
const noticeFromRow = (row: any): NoticeDraft => {
  const fields = row.fields ?? {};
  return {
    id: row.id, sourceId: row.source_id, rawText: row.raw_text ?? '', detectedDeadlines: row.detected_deadlines ?? [],
    originalExtraction: row.original_extraction ?? {}, status: row.status, version: row.version,
    createdAt: row.created_at, updatedAt: row.updated_at, ...fields,
  } as NoticeDraft;
};
const historyFromRow = (row: any): NoticeHistoryEntry => ({
  id: row.id, noticeId: row.notice_id, version: row.version, action: row.action, summary: row.summary, createdAt: row.created_at,
});
const linkFromRow = (row: any): NoticeActionLink => ({
  id: row.id, noticeId: row.notice_id, type: row.type, targetId: row.target_id, details: row.details ?? undefined, createdAt: row.created_at,
});
const contextFromRow = (row: any): StudentAcademicContext => ({
  course: row.course, branch: row.branch, year: row.year, semester: row.semester,
  division: row.division, academicStatus: row.academic_status, atktStatus: row.atkt_status,
});

export class SupabaseNoticeSourceRepository implements NoticeSourceRepository {
  async list() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('notice_sources').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(sourceFromRow);
  }
  async get(id: string) { return (await this.list()).find((source) => source.id === id) ?? null; }
  async findByHash(hash: string) { return (await this.list()).find((source) => source.fileHash === hash) ?? null; }
  async save(source: NoticeSource, file: Blob) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const path = `${user.id}/notices/${source.id}/${source.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from('student-documents').upload(path, file, { contentType: source.mimeType, upsert: false });
    if (uploadError) throw uploadError;
    const { error } = await supabase.from('notice_sources').insert({
      id: source.id, user_id: user.id, source_type: source.sourceType, file_name: source.fileName,
      mime_type: source.mimeType, file_hash: source.fileHash, storage_path: path,
      page_count: source.pageCount ?? null, extracted_at: source.extractedAt ?? null,
    });
    if (error) {
      await supabase.storage.from('student-documents').remove([path]);
      throw error;
    }
  }
  async update(source: NoticeSource) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('notice_sources').update({
      page_count: source.pageCount ?? null, extracted_at: source.extractedAt ?? null,
    }).eq('id', source.id);
    if (error) throw error;
  }
  async getFile(id: string) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data: source, error } = await supabase.from('notice_sources').select('storage_path').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!source) return null;
    const { data, error: downloadError } = await supabase.storage.from('student-documents').download(source.storage_path);
    if (downloadError) throw downloadError;
    return data;
  }
  async delete(id: string) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data: source, error } = await supabase.from('notice_sources').select('storage_path').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (source) {
      const { error: removeError } = await supabase.storage.from('student-documents').remove([source.storage_path]);
      if (removeError) throw removeError;
    }
    const { error: deleteError } = await supabase.from('notice_sources').delete().eq('id', id);
    if (deleteError) throw deleteError;
  }
}

export class SupabaseNoticeRepository implements NoticeRepository {
  async list() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('notices').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(noticeFromRow);
  }
  async get(id: string) { return (await this.list()).find((notice) => notice.id === id) ?? null; }
  async findBySource(sourceId: string) { return (await this.list()).find((notice) => notice.sourceId === sourceId) ?? null; }
  async saveVersion(notice: NoticeDraft) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { title, deadline, instructions, eligibility, requiredDocuments, category, applicableCourses, applicableBranches, applicableYears, applicableSemesters, applicableDivisions, originalExtraction, ...record } = notice;
    const { error } = await supabase.from('notices').upsert({
      id: record.id, user_id: user.id, source_id: record.sourceId, title: title.value ?? 'Untitled notice',
      body: record.rawText, raw_text: record.rawText, detected_deadlines: record.detectedDeadlines,
      fields: { title, deadline, instructions, eligibility, requiredDocuments, category, applicableCourses, applicableBranches, applicableYears, applicableSemesters, applicableDivisions },
      original_extraction: originalExtraction, status: record.status, version: record.version,
      priority: category.value === 'ATKT' ? 'important' : 'normal',
    });
    if (error) throw error;
  }
  async deleteBySource(sourceId: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('notices').delete().eq('source_id', sourceId);
    if (error) throw error;
  }
}

export class SupabaseNoticeHistoryRepository implements NoticeHistoryRepository {
  async list(noticeId?: string) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    let query = supabase.from('notice_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (noticeId) query = query.eq('notice_id', noticeId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(historyFromRow);
  }
  async save(entry: NoticeHistoryEntry) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { error } = await supabase.from('notice_history').upsert({
      id: entry.id, user_id: user.id, notice_id: entry.noticeId, version: entry.version,
      action: entry.action, summary: entry.summary, created_at: entry.createdAt,
    });
    if (error) throw error;
  }
  async deleteByNotice(noticeId: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('notice_history').delete().eq('notice_id', noticeId);
    if (error) throw error;
  }
}

export class SupabaseNoticeActionLinkRepository implements NoticeActionLinkRepository {
  async list(noticeId?: string) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    let query = supabase.from('notice_action_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (noticeId) query = query.eq('notice_id', noticeId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(linkFromRow);
  }
  async save(link: NoticeActionLink) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { error } = await supabase.from('notice_action_links').upsert({
      id: link.id, user_id: user.id, notice_id: link.noticeId, type: link.type,
      target_id: link.targetId, details: link.details ?? null, created_at: link.createdAt,
    }, { onConflict: 'user_id,notice_id,type' });
    if (error) throw error;
  }
  async deleteByNotice(noticeId: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('notice_action_links').delete().eq('notice_id', noticeId);
    if (error) throw error;
  }
}

export class SupabaseStudentAcademicContextRepository implements StudentAcademicContextRepository {
  async get() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('student_academic_contexts').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data ? contextFromRow(data) : emptyContext();
  }
  async save(context: StudentAcademicContext) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { error } = await supabase.from('student_academic_contexts').upsert({
      user_id: user.id, course: context.course, branch: context.branch, year: context.year,
      semester: context.semester, division: context.division, academic_status: context.academicStatus,
      atkt_status: context.atktStatus,
    });
    if (error) throw error;
  }
}
