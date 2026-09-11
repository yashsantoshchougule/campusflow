import type { AttendanceRecord, AttendanceRecordInput } from './models';
import { getSupabase, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

const STORAGE_KEY = 'studybuddy.attendance.v1';

function load(): AttendanceRecord[] {
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as AttendanceRecord[];
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function save(records: AttendanceRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export interface AttendanceRepository {
  getRecords(studentId: string): Promise<AttendanceRecord[]>;
  createRecord(input: AttendanceRecordInput): Promise<AttendanceRecord>;
  updateRecord(id: string, input: Partial<Pick<AttendanceRecord, 'date' | 'status' | 'timetableEntryId'>>): Promise<AttendanceRecord>;
  deleteRecord(id: string): Promise<void>;
}

export const localStorageAttendanceRepository: AttendanceRepository = {
  async getRecords(studentId) { return load().filter((record) => record.studentId === studentId); },
  async createRecord(input) {
    const records = load(); const now = new Date().toISOString();
    const record = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    records.push(record); save(records); return record;
  },
  async updateRecord(id, input) {
    const records = load(); const index = records.findIndex((record) => record.id === id);
    if (index < 0) throw new Error('Attendance record not found.');
    const record = { ...records[index], ...input, id, updatedAt: new Date().toISOString() } as AttendanceRecord;
    records[index] = record; save(records); return record;
  },
  async deleteRecord(id) { save(load().filter((record) => record.id !== id)); },
};

type AttendanceRow = {
  id: string; user_id: string; subject_id: string; timetable_entry_id?: string | null; class_date: string;
  date?: string; status: AttendanceRecord['status']; created_at: string; updated_at: string;
};

const fromRow = (row: AttendanceRow): AttendanceRecord => ({
  id: row.id, studentId: row.user_id, subjectId: row.subject_id,
  timetableEntryId: row.timetable_entry_id ?? null, date: row.class_date || row.date || '', status: row.status,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

export const supabaseAttendanceRepository: AttendanceRepository = {
  async getRecords() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('attendance_records').select('*').eq('user_id', user.id).order('class_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromRow);
  },
  async createRecord(input) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('attendance_records').insert({
      user_id: user.id, subject_id: input.subjectId, class_date: input.date, date: input.date,
      status: input.status, source_type: 'student', verification_status: 'pending', recorded_by: user.id,
    }).select().single();
    if (error) throw error;
    return fromRow(data);
  },
  async updateRecord(id, input) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('attendance_records').update({
      ...(input.date !== undefined ? { class_date: input.date, date: input.date } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Attendance record not found.');
    return fromRow(data);
  },
  async deleteRecord(id) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { error } = await supabase.from('attendance_records').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
  },
};
