/**
 * IndexedDB repository shape adapted from MK-QuizFlow src/lib/storage.ts
 * (Copyright (c) 2026 Kazi Musharraf, MIT License). Rewritten to use the
 * browser API directly and to store CampusFlow document chunks.
 */
import type { Note } from '../academics/models';
import type {
  DocumentChunk, GeneratedStudyMaterial, QuizAttempt, QuizSchedule,
  StudyAiAnswer, StudyDocument, StudyQuiz,
} from './models';
import { getSupabase, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

const KEYS = {
  documents: 'studybuddy.study-ai.documents.v1',
  conversations: 'studybuddy.study-ai.conversations.v1',
  materials: 'studybuddy.study-ai.materials.v1',
  quizzes: 'studybuddy.study-ai.quizzes.v1',
  attempts: 'studybuddy.study-ai.attempts.v1',
  schedules: 'studybuddy.study-ai.schedules.v1',
} as const;

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; } catch { return []; }
}

function write<T>(key: string, values: T[]): void {
  localStorage.setItem(key, JSON.stringify(values));
}

export function getStudyAiHistory() {
  return { answers: read<StudyAiAnswer>(KEYS.conversations), materials: read<GeneratedStudyMaterial>(KEYS.materials), quizzes: read<StudyQuiz>(KEYS.quizzes), attempts: read<QuizAttempt>(KEYS.attempts) };
}

export function clearStudyAiHistory() {
  if (typeof localStorage === 'undefined') return;
  for (const key of [KEYS.conversations, KEYS.materials, KEYS.quizzes, KEYS.attempts, KEYS.schedules]) localStorage.removeItem(key);
}

function upsert<T extends { id: string }>(key: string, value: T): void {
  const values = read<T>(key);
  const index = values.findIndex((item) => item.id === value.id);
  if (index < 0) values.push(value); else values[index] = value;
  write(key, values);
}

export interface AcademicDocumentRepository {
  list(subjectId?: string): Promise<StudyDocument[]>;
  getSourceNote(documentId: string): Promise<Note | null>;
  setExtractionStatus(documentId: string, status: StudyDocument['extractionStatus']): Promise<void>;
}

export interface StudyAiDocumentIndexRepository {
  replace(documentId: string, chunks: DocumentChunk[]): Promise<void>;
  list(documentIds: string[]): Promise<DocumentChunk[]>;
  get(chunkId: string): Promise<DocumentChunk | null>;
}

export interface StudyAiConversationRepository { list(): Promise<StudyAiAnswer[]>; save(answer: StudyAiAnswer): Promise<void>; }
export interface GeneratedStudyMaterialRepository { list(documentId?: string): Promise<GeneratedStudyMaterial[]>; save(material: GeneratedStudyMaterial): Promise<void>; }
export interface StudyQuizRepository { list(documentId?: string): Promise<StudyQuiz[]>; get(id: string): Promise<StudyQuiz | null>; save(quiz: StudyQuiz): Promise<void>; }
export interface QuizAttemptRepository { list(quizId?: string): Promise<QuizAttempt[]>; save(attempt: QuizAttempt): Promise<void>; }
export interface QuizScheduleRepository { list(): Promise<QuizSchedule[]>; save(schedule: QuizSchedule): Promise<void>; }

export class LocalAcademicDocumentAdapter implements AcademicDocumentRepository {
  async list(subjectId?: string): Promise<StudyDocument[]> {
    const { academicsService } = await import('../academics/service.ts');
    const [notes, statuses] = await Promise.all([academicsService.getNotes(), Promise.resolve(read<StudyDocument>(KEYS.documents))]);
    return notes.filter((note) => !subjectId || note.subjectId === subjectId).map((note) => {
      const stored = statuses.find((item) => item.id === note.id);
      const version = Math.max(1, Math.floor(new Date(note.updatedAt).getTime() / 1000));
      return {
        id: note.id,
        subjectId: note.subjectId,
        sourceNoteId: note.id,
        name: note.noteType === 'file' ? note.fileName ?? note.title : note.title,
        mimeType: note.noteType === 'text' ? 'text/markdown' : note.fileType ?? 'application/octet-stream',
        version,
        extractionStatus: stored?.version === version ? stored.extractionStatus : 'pending',
        createdAt: note.createdAt,
      };
    });
  }

  async getSourceNote(documentId: string): Promise<Note | null> {
    const { academicsService } = await import('../academics/service.ts');
    return (await academicsService.getNotes()).find((note) => note.id === documentId) ?? null;
  }

  async setExtractionStatus(documentId: string, extractionStatus: StudyDocument['extractionStatus']): Promise<void> {
    const document = (await this.list()).find((item) => item.id === documentId);
    if (document) upsert(KEYS.documents, { ...document, extractionStatus });
  }
}

export class SupabaseAcademicDocumentAdapter implements AcademicDocumentRepository {
  async list(subjectId?: string): Promise<StudyDocument[]> {
    const [{ academicsService }, supabase, user] = await Promise.all([
      import('../academics/service.ts'), getSupabase(), requireSupabaseUser(),
    ]);
    const [notes, response, academicNotes] = await Promise.all([
      academicsService.getNotes(),
      supabase.from('ai_history').select('*').eq('user_id', user.id).eq('kind', 'document_status'),
      supabase.from('academic_notes').select('*'),
    ]);
    if (response.error) throw response.error;
    if (academicNotes.error) throw academicNotes.error;
    const statuses = new Map((response.data ?? []).map((row) => [row.document_id as string, row.payload as { version?: number; extractionStatus?: StudyDocument['extractionStatus'] }]));
    const subjects = new Map((await academicsService.getSubjects()).map((subject) => [subject.code, subject.id]));
    const teacherNotes: Note[] = (academicNotes.data ?? []).map((row: any) => ({
      id: row.id, subjectId: subjects.get(row.subject_code) ?? '', title: row.title, noteType: 'file', textContent: '',
      fileName: row.file_name, fileType: row.mime_type, fileSize: row.file_size, filePath: `academic-notes/${row.storage_path}`,
      isPinned: false, createdAt: row.created_at, updatedAt: row.updated_at,
    }));
    return [...notes, ...teacherNotes].filter((note) => (!subjectId || note.subjectId === subjectId) && Boolean(note.subjectId)).map((note) => {
      const version = Math.max(1, Math.floor(new Date(note.updatedAt).getTime() / 1000));
      const stored = statuses.get(note.id);
      return {
        id: note.id, subjectId: note.subjectId, sourceNoteId: note.id,
        name: note.noteType === 'file' ? note.fileName ?? note.title : note.title,
        mimeType: note.noteType === 'text' ? 'text/markdown' : note.fileType ?? 'application/octet-stream',
        version, extractionStatus: stored?.version === version ? stored.extractionStatus ?? 'pending' : 'pending',
        createdAt: note.createdAt,
      };
    });
  }
  async getSourceNote(documentId: string) {
    const document = (await this.list()).find((item) => item.id === documentId);
    if (!document) return null;
    const { academicsService } = await import('../academics/service.ts');
    const own = (await academicsService.getNotes()).find((note) => note.id === documentId);
    if (own) return own;
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('academic_notes').select('*').eq('id', documentId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { id: data.id, subjectId: document.subjectId, title: data.title, noteType: 'file' as const, textContent: '', fileName: data.file_name, fileType: data.mime_type, fileSize: data.file_size, filePath: `academic-notes/${data.storage_path}`, isPinned: false, createdAt: data.created_at, updatedAt: data.updated_at };
  }
  async setExtractionStatus(documentId: string, extractionStatus: StudyDocument['extractionStatus']) {
    const document = (await this.list()).find((item) => item.id === documentId);
    if (!document) return;
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { error } = await supabase.from('ai_history').upsert({
      id: document.id, user_id: user.id, kind: 'document_status', subject_id: document.subjectId,
      document_id: document.id, payload: { version: document.version, extractionStatus },
    });
    if (error) throw error;
  }
}

const DB_NAME = 'studybuddy-study-ai';
const DB_VERSION = 1;
const STORE_NAME = 'chunks';
let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is unavailable.'));
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'id' }).createIndex('documentId', 'documentId');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB.'));
  });
  return databasePromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

export class LocalStudyAiDocumentIndexRepository implements StudyAiDocumentIndexRepository {
  async replace(documentId: string, chunks: DocumentChunk[]): Promise<void> {
    const database = await openDatabase();
    const existing = await this.list([documentId]);
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    // ponytail: O(n) replacement is fine for local notes; use a documentId cursor if libraries become large.
    for (const chunk of existing) store.delete(chunk.id);
    for (const chunk of chunks) store.put(chunk);
    await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
  }

  async list(documentIds: string[]): Promise<DocumentChunk[]> {
    const database = await openDatabase();
    const chunks = await requestResult(database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll()) as DocumentChunk[];
    const allowed = new Set(documentIds);
    return chunks.filter((chunk) => allowed.has(chunk.documentId)).sort((a, b) => a.order - b.order);
  }

  async get(chunkId: string): Promise<DocumentChunk | null> {
    const database = await openDatabase();
    return (await requestResult(database.transaction(STORE_NAME).objectStore(STORE_NAME).get(chunkId)) as DocumentChunk | undefined) ?? null;
  }
}

export class LocalStudyAiConversationRepository implements StudyAiConversationRepository {
  async list() { return read<StudyAiAnswer>(KEYS.conversations).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async save(answer: StudyAiAnswer) { upsert(KEYS.conversations, answer); }
}

export class LocalGeneratedStudyMaterialRepository implements GeneratedStudyMaterialRepository {
  async list(documentId?: string) { return read<GeneratedStudyMaterial>(KEYS.materials).filter((item) => !documentId || item.documentId === documentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async save(material: GeneratedStudyMaterial) { upsert(KEYS.materials, material); }
}

export class LocalStudyQuizRepository implements StudyQuizRepository {
  async list(documentId?: string) { return read<StudyQuiz>(KEYS.quizzes).filter((item) => !documentId || item.documentId === documentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async get(id: string) { return read<StudyQuiz>(KEYS.quizzes).find((item) => item.id === id) ?? null; }
  async save(quiz: StudyQuiz) { upsert(KEYS.quizzes, quiz); }
}

export class LocalQuizAttemptRepository implements QuizAttemptRepository {
  async list(quizId?: string) { return read<QuizAttempt>(KEYS.attempts).filter((item) => !quizId || item.quizId === quizId).sort((a, b) => b.completedAt.localeCompare(a.completedAt)); }
  async save(attempt: QuizAttempt) { upsert(KEYS.attempts, attempt); }
}

export class LocalQuizScheduleRepository implements QuizScheduleRepository {
  async list() { return read<QuizSchedule>(KEYS.schedules); }
  async save(schedule: QuizSchedule) { upsert(KEYS.schedules, schedule); }
}

const chunksFromRows = (rows: any[]): DocumentChunk[] => rows.map((row) => ({
  id: row.id, documentId: row.document_id, text: row.content, pageNumber: row.page_number ?? undefined,
  sectionTitle: row.section_title ?? undefined, order: row.chunk_order,
}));

export class SupabaseStudyAiDocumentIndexRepository implements StudyAiDocumentIndexRepository {
  async replace(documentId: string, chunks: DocumentChunk[]) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { error: deleteError } = await supabase.from('ai_document_chunks').delete().eq('user_id', user.id).eq('document_id', documentId);
    if (deleteError) throw deleteError;
    if (chunks.length === 0) return;
    const { error } = await supabase.from('ai_document_chunks').insert(chunks.map((chunk) => ({
      id: chunk.id, user_id: user.id, document_id: chunk.documentId, content: chunk.text,
      page_number: chunk.pageNumber ?? null, section_title: chunk.sectionTitle ?? null, chunk_order: chunk.order,
    })));
    if (error) throw error;
  }
  async list(documentIds: string[]) {
    if (documentIds.length === 0) return [];
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('ai_document_chunks').select('*').eq('user_id', user.id).in('document_id', documentIds).order('chunk_order');
    if (error) throw error;
    return chunksFromRows(data ?? []);
  }
  async get(chunkId: string) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('ai_document_chunks').select('*').eq('user_id', user.id).eq('id', chunkId).maybeSingle();
    if (error) throw error;
    return data ? chunksFromRows([data])[0] : null;
  }
}

abstract class SupabaseAiHistoryRepository {
  protected async listHistory<T>(kind: string, documentId?: string): Promise<T[]> {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    let query = supabase.from('ai_history').select('*').eq('user_id', user.id).eq('kind', kind).order('created_at', { ascending: false });
    if (documentId) query = query.eq('document_id', documentId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ({ ...row.payload, id: row.id, createdAt: row.created_at, updatedAt: row.updated_at })) as T[];
  }
  protected async saveHistory(kind: string, value: { id: string; subjectId?: string; documentId?: string; createdAt?: string }): Promise<void> {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { id, subjectId, documentId, createdAt, ...payload } = value;
    const { error } = await supabase.from('ai_history').upsert({
      id, user_id: user.id, kind, subject_id: subjectId ?? null, document_id: documentId ?? null,
      payload, created_at: createdAt ?? new Date().toISOString(),
    });
    if (error) throw error;
  }
}

export class SupabaseStudyAiConversationRepository extends SupabaseAiHistoryRepository implements StudyAiConversationRepository {
  async list(): Promise<StudyAiAnswer[]> { return this.listHistory<StudyAiAnswer>('answer'); }
  async save(answer: StudyAiAnswer): Promise<void> { await this.saveHistory('answer', answer); }
}
export class SupabaseGeneratedStudyMaterialRepository extends SupabaseAiHistoryRepository implements GeneratedStudyMaterialRepository {
  async list(documentId?: string): Promise<GeneratedStudyMaterial[]> { return this.listHistory<GeneratedStudyMaterial>('material', documentId); }
  async save(material: GeneratedStudyMaterial): Promise<void> { await this.saveHistory('material', material); }
}
export class SupabaseStudyQuizRepository extends SupabaseAiHistoryRepository implements StudyQuizRepository {
  async list(documentId?: string): Promise<StudyQuiz[]> { return this.listHistory<StudyQuiz>('quiz', documentId); }
  async get(id: string): Promise<StudyQuiz | null> { return (await this.list()).find((quiz: StudyQuiz) => quiz.id === id) ?? null; }
  async save(quiz: StudyQuiz): Promise<void> { await this.saveHistory('quiz', quiz); }
}
export class SupabaseQuizAttemptRepository extends SupabaseAiHistoryRepository implements QuizAttemptRepository {
  async list(quizId?: string): Promise<QuizAttempt[]> {
    const attempts = await this.listHistory<QuizAttempt & { quizId: string }>('attempt');
    return attempts.filter((attempt: QuizAttempt & { quizId: string }) => !quizId || attempt.quizId === quizId);
  }
  async save(attempt: QuizAttempt): Promise<void> { await this.saveHistory('attempt', attempt); }
}
export class SupabaseQuizScheduleRepository extends SupabaseAiHistoryRepository implements QuizScheduleRepository {
  async list(): Promise<QuizSchedule[]> { return this.listHistory<QuizSchedule>('schedule'); }
  async save(schedule: QuizSchedule): Promise<void> { await this.saveHistory('schedule', schedule); }
}
