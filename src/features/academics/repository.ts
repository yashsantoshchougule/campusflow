import type {
  AcademicData, Assignment, AssignmentInput, Examination, ExaminationInput, Note, NoteInput,
  Subject, SubjectInput, TimetableEntry, TimetableEntryInput,
} from './models';
import { getSupabase, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

const STORAGE_KEY = 'studybuddy.academics.v1';
const emptyData = (): AcademicData => ({ subjects: [], assignments: [], timetableEntries: [], examinations: [], notes: [] });

function load(): AcademicData {
  try {
    return { ...emptyData(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as AcademicData };
  } catch {
    return emptyData();
  }
}

function save(data: AcademicData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createRecord<T extends object>(input: T): T & { id: string; createdAt: string; updatedAt: string } {
  const now = new Date().toISOString();
  return { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

function updateRecord<T extends { id: string; updatedAt: string }>(records: T[], id: string, input: Partial<T>): T {
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) throw new Error('Record not found.');
  const updated = { ...records[index], ...input, id, updatedAt: new Date().toISOString() } as T;
  records[index] = updated;
  return updated;
}

export interface AcademicRepository {
  getSubjects(): Promise<Subject[]>;
  createSubject(input: SubjectInput): Promise<Subject>;
  updateSubject(id: string, input: SubjectInput): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;
  getAssignments(): Promise<Assignment[]>;
  createAssignment(input: AssignmentInput): Promise<Assignment>;
  updateAssignment(id: string, input: AssignmentInput): Promise<Assignment>;
  completeAssignment(id: string): Promise<Assignment>;
  getTimetableEntries(): Promise<TimetableEntry[]>;
  createTimetableEntry(input: TimetableEntryInput): Promise<TimetableEntry>;
  updateTimetableEntry(id: string, input: TimetableEntryInput): Promise<TimetableEntry>;
  deleteTimetableEntry(id: string): Promise<void>;
  getExaminations(): Promise<Examination[]>;
  createExamination(input: ExaminationInput): Promise<Examination>;
  updateExamination(id: string, input: ExaminationInput): Promise<Examination>;
  getNotes(): Promise<Note[]>;
  createNote(input: NoteInput): Promise<Note>;
  updateNote(id: string, input: Partial<NoteInput>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
}

export const mockAcademicRepository: AcademicRepository = {
  async getSubjects() { return load().subjects; },
  async createSubject(input) { const data = load(); const item = createRecord(input); data.subjects.push(item); save(data); return item; },
  async updateSubject(id, input) { const data = load(); const item = updateRecord(data.subjects, id, input); save(data); return item; },
  async deleteSubject(id) { const data = load(); data.subjects = data.subjects.filter((item) => item.id !== id); save(data); },
  async getAssignments() { return load().assignments; },
  async createAssignment(input) { const data = load(); const item = createRecord({ ...input, completedAt: null }); data.assignments.push(item); save(data); return item; },
  async updateAssignment(id, input) { const data = load(); const item = updateRecord(data.assignments, id, input); save(data); return item; },
  async completeAssignment(id) { const data = load(); const item = updateRecord(data.assignments, id, { completedAt: new Date().toISOString() }); save(data); return item; },
  async getTimetableEntries() { return load().timetableEntries; },
  async createTimetableEntry(input) { const data = load(); const item = createRecord(input); data.timetableEntries.push(item); save(data); return item; },
  async updateTimetableEntry(id, input) { const data = load(); const item = updateRecord(data.timetableEntries, id, input); save(data); return item; },
  async deleteTimetableEntry(id) { const data = load(); data.timetableEntries = data.timetableEntries.filter((item) => item.id !== id); save(data); },
  async getExaminations() { return load().examinations; },
  async createExamination(input) { const data = load(); const item = createRecord(input); data.examinations.push(item); save(data); return item; },
  async updateExamination(id, input) { const data = load(); const item = updateRecord(data.examinations, id, input); save(data); return item; },
  async getNotes() { return load().notes; },
  async createNote(input) { const data = load(); const item = createRecord(input); data.notes.push(item); save(data); return item; },
  async updateNote(id, input) { const data = load(); const item = updateRecord<Note>(data.notes, id, input); save(data); return item; },
  async deleteNote(id) { const data = load(); data.notes = data.notes.filter((item) => item.id !== id); save(data); },
};

export const subjectFromRow = (row: any): Subject => ({
  id: row.id, name: row.name, code: row.code ?? '', facultyName: row.faculty_name ?? '',
  credits: Number(row.credits ?? 0), difficulty: row.difficulty ?? 'Medium',
  strengthLevel: row.strength_level ?? 'Average', attendanceTarget: Number(row.attendance_target ?? row.minimum_attendance_percentage ?? 75),
  colour: row.colour ?? '#2563EB', createdAt: row.created_at, updatedAt: row.updated_at,
});
const subjectRow = (input: SubjectInput, userId: string) => ({
  user_id: userId, name: input.name, code: input.code, faculty_name: input.facultyName, credits: input.credits,
  difficulty: input.difficulty, strength_level: input.strengthLevel, attendance_target: input.attendanceTarget, colour: input.colour,
});
const assignmentFromRow = (row: any): Assignment => ({
  id: row.id, subjectId: row.subject_id, title: row.title, description: row.description ?? '',
  deadline: row.deadline, estimatedMinutes: Number(row.estimated_minutes ?? 30), difficulty: row.difficulty ?? 'Medium',
  priority: row.priority_label ?? 'Medium', attachment: row.attachment ?? undefined, completedAt: row.completed_at ?? null,
  createdAt: row.created_at, updatedAt: row.updated_at,
});
const assignmentRow = (input: AssignmentInput, userId: string) => ({
  user_id: userId, subject_id: input.subjectId, title: input.title, description: input.description,
  deadline: input.deadline, estimated_minutes: input.estimatedMinutes, difficulty: input.difficulty,
  priority_label: input.priority, attachment: input.attachment ?? null,
});
const timetableFromRow = (row: any): TimetableEntry => ({
  id: row.id, subjectId: row.subject_id, dayOfWeek: row.day_of_week, startTime: row.start_time, endTime: row.end_time,
  facultyName: row.faculty_name ?? '', classroom: row.classroom ?? '', onlineLink: row.online_link ?? '',
  lectureType: row.lecture_type ?? '', createdAt: row.created_at, updatedAt: row.updated_at,
});
const timetableRow = (input: TimetableEntryInput, userId: string) => ({
  user_id: userId, subject_id: input.subjectId, day_of_week: input.dayOfWeek, start_time: input.startTime,
  end_time: input.endTime, faculty_name: input.facultyName, classroom: input.classroom,
  online_link: input.onlineLink, lecture_type: input.lectureType,
});
const examinationFromRow = (row: any): Examination => ({
  id: row.id, subjectId: row.subject_id, name: row.name, examinationType: row.examination_type ?? '',
  examDate: row.exam_date, topics: row.topics ?? '', room: row.room ?? '',
  preparationProgress: Number(row.preparation_progress ?? 0), studyPlanId: row.study_plan_id ?? null,
  createdAt: row.created_at, updatedAt: row.updated_at,
});
const examinationRow = (input: ExaminationInput, userId: string) => ({
  user_id: userId, subject_id: input.subjectId, name: input.name, examination_type: input.examinationType,
  exam_date: input.examDate, topics: input.topics, room: input.room,
  preparation_progress: input.preparationProgress, study_plan_id: input.studyPlanId,
});
const noteFromRow = (row: any): Note => ({
  id: row.id, subjectId: row.subject_id, title: row.title, noteType: row.note_type,
  textContent: row.text_content ?? '', fileName: row.file_name ?? null, fileType: row.file_type ?? null,
  fileSize: row.file_size ?? null, filePath: row.file_path ?? null, isPinned: Boolean(row.is_pinned),
  createdAt: row.created_at, updatedAt: row.updated_at,
});
const noteRow = (input: NoteInput, userId: string) => ({
  user_id: userId, subject_id: input.subjectId, title: input.title, note_type: input.noteType,
  text_content: input.textContent, file_name: input.fileName, file_type: input.fileType,
  file_size: input.fileSize, file_path: input.filePath, is_pinned: input.isPinned,
});
const notePartialRow = (input: Partial<NoteInput>) => ({
  ...(input.subjectId !== undefined ? { subject_id: input.subjectId } : {}),
  ...(input.title !== undefined ? { title: input.title } : {}),
  ...(input.noteType !== undefined ? { note_type: input.noteType } : {}),
  ...(input.textContent !== undefined ? { text_content: input.textContent } : {}),
  ...(input.fileName !== undefined ? { file_name: input.fileName } : {}),
  ...(input.fileType !== undefined ? { file_type: input.fileType } : {}),
  ...(input.fileSize !== undefined ? { file_size: input.fileSize } : {}),
  ...(input.filePath !== undefined ? { file_path: input.filePath } : {}),
  ...(input.isPinned !== undefined ? { is_pinned: input.isPinned } : {}),
});

export class SupabaseAcademicRepository implements AcademicRepository {
  private async list<T>(table: string, map: (row: any) => T) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id).order('created_at');
    if (error) throw error;
    return (data ?? []).map(map);
  }

  private async create<T>(table: string, row: Record<string, unknown>, map: (value: any) => T) {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (error) throw error;
    return map(data);
  }

  private async update<T>(table: string, id: string, row: Record<string, unknown>, map: (value: any) => T) {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from(table).update(row).eq('id', id).select().single();
    if (error) throw error;
    return map(data);
  }

  private async remove(table: string, id: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }

  async getSubjects(): Promise<Subject[]> {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('student_subjects').select('subject:subjects(*)').eq('user_id', user.id).eq('enrolment_status', 'active').order('created_at');
    if (error) throw error;
    return (data ?? []).flatMap((row: any) => row.subject ? [subjectFromRow(row.subject)] : []);
  }
  async createSubject(input: SubjectInput): Promise<Subject> { const user = await requireSupabaseUser(); return this.create('subjects', subjectRow(input, user.id), subjectFromRow); }
  async updateSubject(id: string, input: SubjectInput): Promise<Subject> { const user = await requireSupabaseUser(); return this.update('subjects', id, subjectRow(input, user.id), subjectFromRow); }
  async deleteSubject(id: string): Promise<void> { await this.remove('subjects', id); }
  async getAssignments(): Promise<Assignment[]> { return this.list('assignments', assignmentFromRow); }
  async createAssignment(input: AssignmentInput): Promise<Assignment> { const user = await requireSupabaseUser(); return this.create('assignments', { ...assignmentRow(input, user.id), completed_at: null }, assignmentFromRow); }
  async updateAssignment(id: string, input: AssignmentInput): Promise<Assignment> { const user = await requireSupabaseUser(); return this.update('assignments', id, assignmentRow(input, user.id), assignmentFromRow); }
  async completeAssignment(id: string): Promise<Assignment> { return this.update('assignments', id, { completed_at: new Date().toISOString() }, assignmentFromRow); }
  async getTimetableEntries(): Promise<TimetableEntry[]> { return this.list('timetable_entries', timetableFromRow); }
  async createTimetableEntry(input: TimetableEntryInput): Promise<TimetableEntry> { const user = await requireSupabaseUser(); return this.create('timetable_entries', timetableRow(input, user.id), timetableFromRow); }
  async updateTimetableEntry(id: string, input: TimetableEntryInput): Promise<TimetableEntry> { const user = await requireSupabaseUser(); return this.update('timetable_entries', id, timetableRow(input, user.id), timetableFromRow); }
  async deleteTimetableEntry(id: string): Promise<void> { await this.remove('timetable_entries', id); }
  async getExaminations(): Promise<Examination[]> { return this.list('examinations', examinationFromRow); }
  async createExamination(input: ExaminationInput): Promise<Examination> { const user = await requireSupabaseUser(); return this.create('examinations', examinationRow(input, user.id), examinationFromRow); }
  async updateExamination(id: string, input: ExaminationInput): Promise<Examination> { const user = await requireSupabaseUser(); return this.update('examinations', id, examinationRow(input, user.id), examinationFromRow); }
  async getNotes(): Promise<Note[]> { return this.list('notes', noteFromRow); }
  async createNote(input: NoteInput): Promise<Note> { const user = await requireSupabaseUser(); return this.create('notes', noteRow(input, user.id), noteFromRow); }
  async updateNote(id: string, input: Partial<NoteInput>): Promise<Note> { return this.update('notes', id, notePartialRow(input), noteFromRow); }
  async deleteNote(id: string): Promise<void> { await this.remove('notes', id); }
}
