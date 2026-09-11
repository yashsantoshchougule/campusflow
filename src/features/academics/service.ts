import { hasSupabaseConfiguration } from '../../lib/supabaseRepository.ts';
import { mockAcademicRepository, SupabaseAcademicRepository } from './repository.ts';
import { mockStorageAdapter, supabaseStorageAdapter } from './storage.ts';
import type { FileMetadata } from './models';

export const academicsService = hasSupabaseConfiguration() ? new SupabaseAcademicRepository() : mockAcademicRepository;

const academicStorage = hasSupabaseConfiguration() ? supabaseStorageAdapter : mockStorageAdapter;
export const uploadNoteFile = (file: File): Promise<FileMetadata> => academicStorage.uploadFile(file);
export const getNoteFileUrl = (path: string): Promise<string | null> => academicStorage.getFileUrl(path);
export const deleteNoteFile = (path: string): Promise<void> => academicStorage.deleteFile(path);
export const sendNoteToStudyAI = async (noteId: string) => ({ success: true, path: `/study-ai?noteId=${encodeURIComponent(noteId)}` });
