import { getSupabase, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

export type PortalRole = 'student' | 'teacher' | 'admin';
export type AcademicNote = { id: string; subjectCode: string; title: string; description: string; course: string; department: string; semester: number; status: 'draft' | 'published'; fileName: string; updatedAt: string };
export type TeacherSubject = { id: string; subjectCode: string; course: string; department: string; semester: number | null };
export type NoteInput = Omit<AcademicNote, 'id' | 'fileName' | 'updatedAt'>;

const noteFromRow = (row: any): AcademicNote => ({ id: row.id, subjectCode: row.subject_code, title: row.title, description: row.description, course: row.target_course, department: row.target_department, semester: row.target_semester, status: row.status, fileName: row.file_name, updatedAt: row.updated_at });

export class PortalService {
  async role(): Promise<PortalRole> {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
    if (error) throw error;
    return data.role;
  }
  async teacherSubjects(): Promise<TeacherSubject[]> {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('teacher_subjects').select('*').eq('teacher_id', user.id).order('subject_code');
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ id: row.id, subjectCode: row.subject_code, course: row.course ?? '', department: row.department ?? '', semester: row.semester }));
  }
  async notes(): Promise<AcademicNote[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('academic_notes').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(noteFromRow);
  }
  async saveNote(input: NoteInput, file?: File, id?: string): Promise<void> {
    if (!input.subjectCode || !input.title.trim() || !input.course.trim() || !input.department.trim() || !Number.isInteger(input.semester)) throw new Error('Subject, title, course, department, and semester are required.');
    if (file && (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 50 * 1024 * 1024)) throw new Error('Use a PDF, DOCX, JPG, PNG, or WebP file up to 50 MB.');
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    let existing: { storage_path: string; file_name: string; mime_type: string; file_size: number } | null = null;
    if (id) {
      const { data, error } = await supabase.from('academic_notes').select('storage_path, file_name, mime_type, file_size').eq('id', id).single();
      if (error) throw error;
      if (!data) throw new Error('Academic note not found.');
      existing = data;
    }
    const storagePath = file ? `${user.id}/${id ?? crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}` : existing!.storage_path;
    if (file) {
      const { error } = await supabase.storage.from('academic-notes').upload(storagePath, file, { contentType: file.type, upsert: false });
      if (error) throw error;
    }
    const row = { teacher_id: user.id, subject_code: input.subjectCode, title: input.title.trim(), description: input.description.trim(), target_course: input.course.trim(), target_department: input.department.trim(), target_semester: input.semester, status: input.status, storage_bucket: 'academic-notes', storage_path: storagePath, file_name: file?.name ?? existing!.file_name, mime_type: file?.type ?? existing!.mime_type, file_size: file?.size ?? existing!.file_size, ...(input.status === 'published' ? { published_at: new Date().toISOString() } : {}) };
    const { error } = id ? await supabase.from('academic_notes').update(row).eq('id', id) : await supabase.from('academic_notes').insert(row);
    if (error) { if (file) await supabase.storage.from('academic-notes').remove([storagePath]); throw error; }
    if (file && existing && existing.storage_path !== storagePath) await supabase.storage.from('academic-notes').remove([existing.storage_path]);
  }
  async deleteOwnNote(id: string): Promise<void> {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('academic_notes').select('storage_path').eq('id', id).single();
    if (error) throw error;
    const { error: deleteError } = await supabase.from('academic_notes').delete().eq('id', id);
    if (deleteError) throw deleteError;
    const { error: storageError } = await supabase.storage.from('academic-notes').remove([data.storage_path]);
    if (storageError) throw storageError;
  }
  private async admin(action: string, values: Record<string, unknown>) {
    const supabase = await getSupabase();
    const { data, error } = await supabase.functions.invoke('campusflow-admin', { body: { action, ...values } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }
  inviteTeacher(email: string) { return this.admin('invite_teacher', { email }); }
  assignTeacherSubject(teacherId: string, subjectCode: string, course: string, department: string, semester: number) { return this.admin('assign_teacher_subject', { teacherId, subjectCode, course, department, semester }); }
  removeAcademicNote(id: string) { return this.admin('delete_academic_note', { noteId: id }); }
}

export const portalService = new PortalService();
