import { academicsService } from '../academics/service';
import type { Subject, SubjectInput, TimetableEntry } from '../academics/models';
import {
  attendanceAfterAttending, attendanceAfterMissing, forecastAttendance, getAggregateStats,
  getAttendanceDecision, getAttendancePercentage, getAttendanceRecommendation, getAttendanceStatus, getRecoveryClasses,
  getRequiredClasses, getSafeBunks, simulateDateRange, summarizeAttendance,
} from './engine';
import type { AttendanceDashboard, AttendanceMark, AttendanceRecord, AttendanceSubjectContext } from './models';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';
import { localStorageAttendanceRepository, supabaseAttendanceRepository } from './repository';

export const LOCAL_STUDENT_ID = 'local-student';
const attendanceRepository = hasSupabaseConfiguration() ? supabaseAttendanceRepository : localStorageAttendanceRepository;
const resolvedStudentId = async () => hasSupabaseConfiguration() ? (await requireSupabaseUser()).id : LOCAL_STUDENT_ID;
const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const toContext = (subject: Subject): AttendanceSubjectContext => ({
  subjectId: subject.id,
  name: subject.name,
  code: subject.code,
  colour: subject.colour,
  threshold: subject.attendanceTarget,
});

const attendanceWeekday = (value: number) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][value] ?? 'Monday';
type EnrolledSubjectRow = { subject: { id: string; name: string; code?: string; minimum_attendance_percentage?: number; created_at: string; updated_at: string } | null };
type TimetableRow = { id: string; subject_id?: string; day_of_week?: number | string; day?: string; start_time: string; end_time: string; faculty_name?: string; classroom?: string; location?: string; online_link?: string; lecture_type?: string; entry_type?: string; created_at: string; updated_at: string };

async function attendanceSubjects(): Promise<Subject[]> {
  if (!hasSupabaseConfiguration()) return academicsService.getSubjects();
  const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
  const { data, error } = await supabase.from('student_subjects').select('subject:subjects(id, name, code, minimum_attendance_percentage, created_at, updated_at)').eq('user_id', user.id).eq('enrolment_status', 'active');
  if (error) throw error;
  return ((data ?? []) as unknown as EnrolledSubjectRow[]).flatMap((row) => {
    const subject = row.subject;
    if (!subject) return [];
    return [{ id: subject.id, name: subject.name, code: subject.code ?? '', facultyName: '', credits: 0, difficulty: 'Medium', strengthLevel: 'Average', attendanceTarget: Number(subject.minimum_attendance_percentage ?? 75), colour: '#2563EB', createdAt: subject.created_at, updatedAt: subject.updated_at } as Subject];
  });
}

async function attendanceTimetable(): Promise<TimetableEntry[]> {
  if (!hasSupabaseConfiguration()) return academicsService.getTimetableEntries();
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('timetable_entries').select('*').order('start_time');
  if (error) throw error;
  return ((data ?? []) as unknown as TimetableRow[]).flatMap((row) => {
    if (!row.subject_id) return [];
    return [{ id: row.id, subjectId: row.subject_id, dayOfWeek: typeof row.day_of_week === 'number' ? attendanceWeekday(row.day_of_week) : row.day ?? row.day_of_week, startTime: String(row.start_time).slice(0, 5), endTime: String(row.end_time).slice(0, 5), facultyName: row.faculty_name ?? '', classroom: row.classroom ?? row.location ?? '', onlineLink: row.online_link ?? '', lectureType: row.lecture_type ?? row.entry_type ?? '', createdAt: row.created_at, updatedAt: row.updated_at } as TimetableEntry];
  });
}

const toSubjectInput = (subject: Subject, attendanceTarget: number): SubjectInput => ({
  name: subject.name, code: subject.code, facultyName: subject.facultyName, credits: subject.credits,
  difficulty: subject.difficulty, strengthLevel: subject.strengthLevel, attendanceTarget, colour: subject.colour,
});

async function getDashboard(): Promise<AttendanceDashboard> {
  const ownerId = await resolvedStudentId();
  const [subjects, timetable, records] = await Promise.all([
    attendanceSubjects(), attendanceTimetable(), attendanceRepository.getRecords(ownerId),
  ]);
  const summaries = summarizeAttendance(subjects.map(toContext), records);
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const date = todayKey();
  const todayLectures = timetable.filter((entry) => entry.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((entry) => ({
    id: entry.id, subjectId: entry.subjectId, dayOfWeek: entry.dayOfWeek, startTime: entry.startTime, endTime: entry.endTime,
    subjectName: subjects.find((subject) => subject.id === entry.subjectId)?.name ?? 'Unknown subject',
    attendanceStatus: records.find((record) => record.timetableEntryId === entry.id && record.date === date)?.status ?? null,
  }));
  return { subjects: summaries, records: [...records].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), todayLectures, stats: getAggregateStats(summaries) };
}

async function markAttendance(subjectId: string, status: AttendanceMark, timetableEntryId: string | null = null, date = todayKey()): Promise<AttendanceRecord> {
  if (!subjectId) throw new Error('Subject is required.');
  const ownerId = await resolvedStudentId();
  const records = await attendanceRepository.getRecords(ownerId);
  const existing = records.find((record) => record.subjectId === subjectId && record.date === date && (!timetableEntryId || !record.timetableEntryId || record.timetableEntryId === timetableEntryId));
  if (existing) return attendanceRepository.updateRecord(existing.id, { status });
  return attendanceRepository.createRecord({ studentId: ownerId, subjectId, timetableEntryId, date, status });
}

async function setAttendanceTarget(subjectId: string, threshold: number) {
  if (!Number.isFinite(threshold) || threshold < 1 || threshold > 100) throw new Error('Attendance target must be between 1 and 100.');
  const subject = (await attendanceSubjects()).find((item) => item.id === subjectId);
  if (!subject) throw new Error('Subject not found.');
  if (hasSupabaseConfiguration()) throw new Error('Attendance targets are set by your enrolled course subjects.');
  return academicsService.updateSubject(subjectId, toSubjectInput(subject, threshold));
}

async function projectDateRange(from: string, to: string, assumption: 'present' | 'absent') {
  const dashboard = await getDashboard();
  const timetable = await attendanceTimetable();
  return simulateDateRange(dashboard.subjects, timetable, dashboard.records, from, to, assumption);
}

export const attendanceService = {
  getDashboard,
  markAttendance,
  updateRecord: attendanceRepository.updateRecord,
  deleteRecord: attendanceRepository.deleteRecord,
  setAttendanceTarget,
  projectDateRange,
  forecastAttendance,
  getAttendanceDecision,
  getAttendanceRecommendation,
};

export {
  attendanceAfterAttending, attendanceAfterMissing, forecastAttendance, getAggregateStats,
  getAttendanceDecision, getAttendancePercentage, getAttendanceRecommendation, getAttendanceStatus, getRecoveryClasses,
  getRequiredClasses, getSafeBunks, simulateDateRange, summarizeAttendance,
};
export type { AttendanceDashboard, AttendanceMark, AttendanceRecord } from './models';
