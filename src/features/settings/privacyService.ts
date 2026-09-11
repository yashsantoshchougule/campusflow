/** Typed destructive confirmation adapted from ResuMate frontend/src/pages/Settings.jsx (README-declared MIT). */
import type { UploadedDocument } from './models';
import { CAMPUSFLOW_OWNED_KEYS, storage } from './repository.ts';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

export const DELETE_DATA_PHRASE = 'DELETE MY DATA';

export interface DocumentOwners { deleteNote(id: string): Promise<void>; deleteNoticeSource(id: string): Promise<void> }
const owners: DocumentOwners = {
  async deleteNote(id) { const { academicsService, deleteNoteFile } = await import('../academics/service.ts'); const note = (await academicsService.getNotes()).find((item) => item.id === id); if (!note) throw new Error('Note document not found.'); if (note.filePath) await deleteNoteFile(note.filePath); await academicsService.deleteNote(id); },
  async deleteNoticeSource(id) { const { noticeService } = await import('../notices/service.ts'); await noticeService.deleteSource(id); },
};

export class PrivacyService {
  async listDocuments(): Promise<UploadedDocument[]> {
    const [{ academicsService }, { noticeService }] = await Promise.all([import('../academics/service.ts'), import('../notices/service.ts')]);
    const [notes, dashboard] = await Promise.all([academicsService.getNotes(), noticeService.dashboard()]);
    return [
      ...notes.filter((note) => note.noteType === 'file').map((note) => ({ id: `note:${note.id}`, sourceId: note.id, fileId: note.filePath ?? undefined, fileName: note.fileName ?? note.title, sourceModule: 'Notes' as const, uploadedAt: note.createdAt, updatedAt: note.updatedAt })),
      ...dashboard.sources.map((source) => ({ id: `notice:${source.id}`, sourceId: source.id, fileId: source.id, fileName: source.fileName, sourceModule: 'Notice Intelligence' as const, uploadedAt: source.createdAt, updatedAt: source.extractedAt ?? source.createdAt })),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async deleteDocument(document: UploadedDocument, confirmed: boolean, documentOwners: DocumentOwners = owners) {
    if (!confirmed) throw new Error('Document deletion must be confirmed.');
    if (document.sourceModule === 'Notes') await documentOwners.deleteNote(document.sourceId); else await documentOwners.deleteNoticeSource(document.sourceId);
  }
  async deleteAiHistory(confirmed: boolean, clear?: () => void) {
    if (!confirmed) throw new Error('AI history deletion must be confirmed.');
    if (hasSupabaseConfiguration()) {
      const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
      const [history, chunks] = await Promise.all([
        supabase.from('ai_history').delete().eq('user_id', user.id), supabase.from('ai_document_chunks').delete().eq('user_id', user.id),
      ]);
      if (history.error) throw history.error;
      if (chunks.error) throw chunks.error;
      return;
    }
    if (clear) clear(); else (await import('../studyAi/repositories.ts')).clearStudyAiHistory();
  }
  async deleteLocalDemoData(phrase: string, target: Pick<Storage, 'removeItem'> = storage()) {
    if (phrase !== DELETE_DATA_PHRASE) throw new Error(`Type ${DELETE_DATA_PHRASE} exactly.`);
    for (const key of CAMPUSFLOW_OWNED_KEYS) target.removeItem(key);
    if (typeof indexedDB !== 'undefined') for (const name of ['studybuddy-academic-files', 'studybuddy-notice-files', 'studybuddy-study-ai', 'campusflow-profile-files']) indexedDB.deleteDatabase(name);
  }
}

export const privacyService = new PrivacyService();
