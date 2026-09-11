import { mockAcademicRepository } from '../academics/repository';
import { mockStorageAdapter } from '../academics/storage';
import { localStorageAttendanceRepository } from '../attendance/repository';
import { LocalCalendarRepository } from '../calendar/repository';
import {
  LocalNoticeActionLinkRepository, LocalNoticeHistoryRepository, LocalNoticeRepository,
  LocalNoticeSourceRepository, LocalStudentAcademicContextRepository,
} from '../notices/repositories';
import { LocalNotificationRepository } from '../notifications/repository';
import { LocalProfileRepository } from '../profile/repository';
import { getStudyAiHistory } from '../studyAi/repositories';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';
import { readStorage } from './repository';

export interface LocalImportPreview { alreadyImported: boolean; total: number; counts: Array<{ label: string; count: number }>; }

const local = async () => {
  const academics = await Promise.all([
    mockAcademicRepository.getSubjects(), mockAcademicRepository.getAssignments(), mockAcademicRepository.getTimetableEntries(),
    mockAcademicRepository.getExaminations(), mockAcademicRepository.getNotes(),
  ]);
  const notices = new LocalNoticeRepository();
  return {
    profile: await new LocalProfileRepository().getProfile(), preferences: await new LocalProfileRepository().getStudyPreferences(),
    settings: readStorage('campusflow_settings', null), notificationPreferences: await new LocalNotificationRepository().getPreferences(),
    notifications: await new LocalNotificationRepository().getStates(), reminders: await new LocalCalendarRepository().getReminders(),
    calendarPreferences: await new LocalCalendarRepository().getPreferences(), attendance: await localStorageAttendanceRepository.getRecords('local-student'),
    subjects: academics[0], assignments: academics[1], timetable: academics[2], examinations: academics[3], notes: academics[4],
    sources: await new LocalNoticeSourceRepository().list(), notices: await notices.list(),
    histories: await new LocalNoticeHistoryRepository().list(), links: await new LocalNoticeActionLinkRepository().list(),
    context: await new LocalStudentAcademicContextRepository().get(), ai: getStudyAiHistory(),
    studyPlans: readStorage<any[]>('campusflow_study_plans', []), studySessions: readStorage<any[]>('campusflow_study_sessions', []),
    atkt: readStorage<any[]>('campusflow_atkt_applications', []),
  };
};

export class LocalDataImportService {
  async preview(): Promise<LocalImportPreview> {
    if (!hasSupabaseConfiguration()) return { alreadyImported: false, total: 0, counts: [] };
    const [supabase, user, values] = await Promise.all([getSupabase(), requireSupabaseUser(), local()]);
    const { data, error } = await supabase.from('local_data_imports').select('user_id').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    const counts = [
      ['Subjects', values.subjects.length], ['Assignments', values.assignments.length], ['Timetable lectures', values.timetable.length],
      ['Examinations', values.examinations.length], ['Attendance records', values.attendance.length], ['Notes', values.notes.length],
      ['Reminders', values.reminders.length], ['Notices', values.notices.length], ['Study plans', values.studyPlans.length],
      ['Study sessions', values.studySessions.length], ['ATKT applications', values.atkt.length],
      ['AI history', Object.values(values.ai).reduce((total, entries) => total + entries.length, 0)],
    ].map(([label, count]) => ({ label: String(label), count: Number(count) })).filter((item) => item.count > 0);
    return { alreadyImported: Boolean(data), total: counts.reduce((total, item) => total + item.count, 0), counts };
  }

  async import(confirmed: boolean): Promise<void> {
    if (!confirmed) throw new Error('Confirm the data preview before importing.');
    const [supabase, user, values] = await Promise.all([getSupabase(), requireSupabaseUser(), local()]);
    const { data: imported, error: importedError } = await supabase.from('local_data_imports').select('user_id').eq('user_id', user.id).maybeSingle();
    if (importedError) throw importedError;
    if (imported) throw new Error('This browser data was already imported.');
    const upload = async (folder: string, id: string, file: Blob, name: string) => {
      const path = `${user.id}/${folder}/${id}/${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error } = await supabase.storage.from('student-documents').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: true });
      if (error) throw error;
      return `student-documents/${path}`;
    };
    const academicNotes = await Promise.all(values.notes.map(async (note) => {
      const file = note.noteType === 'file' && note.filePath ? await mockStorageAdapter.getFile(note.filePath) : null;
      return { note, path: file ? await upload('notes', note.id, file, note.fileName ?? note.title) : null };
    }));
    const sources = new LocalNoticeSourceRepository();
    const importedSources = await Promise.all(values.sources.map(async (source) => {
      const file = await sources.getFile(source.id);
      if (!file) throw new Error(`The local notice file “${source.fileName}” is unavailable; re-upload it before importing.`);
      return { source, path: await upload('notices', source.id, file, source.fileName) };
    }));
    const write = async (table: string, rows: Record<string, unknown>[], onConflict?: string) => {
      if (!rows.length) return;
      const { error } = await supabase.from(table).upsert(rows, onConflict ? { onConflict } : undefined);
      if (error) throw error;
    };
    await write('profiles', [{ id: user.id, full_name: values.profile.fullName, student_id: values.profile.studentId, college_name: values.profile.college, course: values.profile.course, department: values.profile.department, semester: Number(values.profile.semester) || null, preferred_language: values.profile.preferredLanguage }]);
    await write('study_preferences', [{ user_id: user.id, preferred_study_start: values.preferences.preferredStudyStartTime ?? null, preferred_study_end: values.preferences.preferredStudyEndTime ?? null, session_duration_minutes: values.preferences.averageSessionMinutes, strong_subjects: values.preferences.strongSubjectIds, weak_subjects: values.preferences.weakSubjectIds, break_duration_minutes: values.preferences.breakPreferenceMinutes, attendance_target_percent: values.preferences.attendanceTargetPercent }]);
    const localSettings = values.settings as { theme?: string; language?: string; allowStudyAiUploadedMaterials?: boolean; confirmBeforeDataSave?: boolean; privacyUpdatedAt?: string } | null;
    await write('user_settings', [{ user_id: user.id, theme: localSettings?.theme ?? 'system', language: localSettings?.language ?? 'English', allow_study_ai_uploaded_materials: localSettings?.allowStudyAiUploadedMaterials ?? true, confirm_before_data_save: localSettings?.confirmBeforeDataSave ?? true, privacy_source: 'student', privacy_updated_at: localSettings?.privacyUpdatedAt ?? new Date().toISOString(), calendar_preferences: values.calendarPreferences }]);
    await write('notification_preferences', [{ user_id: user.id, enabled: values.notificationPreferences.enabled, assignment_reminder_hours: values.notificationPreferences.assignmentReminderHours, exam_reminder_days: values.notificationPreferences.examReminderDays, lecture_reminder_minutes: values.notificationPreferences.lectureReminderMinutes, attendance_alerts: values.notificationPreferences.attendanceAlerts, notice_alerts: values.notificationPreferences.noticeAlerts, atkt_alerts: values.notificationPreferences.atktAlerts }]);
    await write('notification_states', values.notifications.map((item) => ({ user_id: user.id, stable_source_key: item.stableSourceKey, status: item.status, read_at: item.readAt ?? null, dismissed_at: item.dismissedAt ?? null })), 'user_id,stable_source_key');
    await write('subjects', values.subjects.map((item) => ({ id: item.id, user_id: user.id, name: item.name, code: item.code, faculty_name: item.facultyName, credits: item.credits, difficulty: item.difficulty, strength_level: item.strengthLevel, attendance_target: item.attendanceTarget, colour: item.colour })));
    await write('assignments', values.assignments.map((item) => ({ id: item.id, user_id: user.id, subject_id: item.subjectId, title: item.title, description: item.description, deadline: item.deadline, estimated_minutes: item.estimatedMinutes, difficulty: item.difficulty, priority_label: item.priority, attachment: item.attachment ?? null, completed_at: item.completedAt ?? null })));
    await write('timetable_entries', values.timetable.map((item) => ({ id: item.id, user_id: user.id, subject_id: item.subjectId, day_of_week: item.dayOfWeek, start_time: item.startTime, end_time: item.endTime, faculty_name: item.facultyName, classroom: item.classroom, online_link: item.onlineLink, lecture_type: item.lectureType })));
    await write('examinations', values.examinations.map((item) => ({ id: item.id, user_id: user.id, subject_id: item.subjectId, name: item.name, examination_type: item.examinationType, exam_date: item.examDate, topics: item.topics, room: item.room, preparation_progress: item.preparationProgress, study_plan_id: item.studyPlanId ?? null })));
    await write('notes', academicNotes.map(({ note, path }) => ({ id: note.id, user_id: user.id, subject_id: note.subjectId, title: note.title, note_type: note.noteType, text_content: note.textContent, file_name: note.fileName, file_type: note.fileType, file_size: note.fileSize, file_path: path, is_pinned: note.isPinned })));
    await write('attendance_records', values.attendance.map((item) => ({ id: item.id, user_id: user.id, subject_id: item.subjectId, timetable_entry_id: item.timetableEntryId ?? null, date: item.date, status: item.status })));
    await write('reminders', values.reminders.map((item) => ({ id: item.id, user_id: user.id, title: item.title, description: item.description ?? null, reminder_at: item.reminderAt, subject_id: item.subjectId ?? null, linked_entity_type: item.linkedEntityType ?? null, linked_entity_id: item.linkedEntityId ?? null, status: item.status, completed_at: item.completedAt ?? null })));
    await write('study_plans', values.studyPlans.map((item) => ({ id: item.id, user_id: user.id, title: item.name, starts_at: item.startDate, ends_at: item.endDate, status: item.status })));
    await write('study_sessions', values.studySessions.map((item) => ({ id: item.id, user_id: user.id, study_plan_id: item.planId, subject_id: item.subjectId, assignment_id: item.assignmentId ?? null, examination_id: item.examinationId ?? null, title: item.title, start_at: item.startAt, end_at: item.endAt, duration_minutes: item.durationMinutes, difficulty: item.difficulty, priority: item.priority, status: item.status, locked: item.locked, reason: item.reason, replaces_session_id: item.replacesSessionId ?? null, invalid: item.invalid ?? false, invalid_reason: item.invalidReason ?? null })));
    await write('notice_sources', importedSources.map(({ source, path }) => ({ id: source.id, user_id: user.id, source_type: source.sourceType, file_name: source.fileName, mime_type: source.mimeType, file_hash: source.fileHash, storage_path: path, page_count: source.pageCount ?? null, extracted_at: source.extractedAt ?? null })));
    await write('notices', values.notices.map((notice: any) => ({ id: notice.id, user_id: user.id, source_id: notice.sourceId, title: notice.title?.value ?? 'Untitled notice', body: notice.rawText, raw_text: notice.rawText, detected_deadlines: notice.detectedDeadlines, fields: { title: notice.title, deadline: notice.deadline, instructions: notice.instructions, eligibility: notice.eligibility, requiredDocuments: notice.requiredDocuments, category: notice.category, applicableCourses: notice.applicableCourses, applicableBranches: notice.applicableBranches, applicableYears: notice.applicableYears, applicableSemesters: notice.applicableSemesters, applicableDivisions: notice.applicableDivisions }, original_extraction: notice.originalExtraction, status: notice.status, version: notice.version, priority: notice.category?.value === 'ATKT' ? 'important' : 'normal' })));
    await write('notice_history', values.histories.map((item) => ({ id: item.id, user_id: user.id, notice_id: item.noticeId, version: item.version, action: item.action, summary: item.summary, created_at: item.createdAt })));
    await write('notice_action_links', values.links.map((item) => ({ id: item.id, user_id: user.id, notice_id: item.noticeId, type: item.type, target_id: item.targetId, details: item.details ?? null, created_at: item.createdAt })));
    await write('student_academic_contexts', [{ user_id: user.id, course: values.context.course, branch: values.context.branch, year: values.context.year, semester: values.context.semester, division: values.context.division, academic_status: values.context.academicStatus, atkt_status: values.context.atktStatus }]);
    await write('atkt_applications', values.atkt.map((item) => ({ id: item.id, user_id: user.id, notice_id: item.noticeId ?? null, title: item.title ?? 'ATKT application', status: item.status, correction_message: item.correctionMessage ?? null })));
    const ai = Object.entries(values.ai).flatMap(([kind, entries]) => entries.map((entry: any) => ({ id: entry.id, user_id: user.id, kind: kind === 'answers' ? 'answer' : kind === 'materials' ? 'material' : kind === 'quizzes' ? 'quiz' : 'attempt', subject_id: entry.subjectId ?? null, document_id: entry.documentId ?? null, payload: entry, created_at: entry.createdAt ?? new Date().toISOString() })));
    await write('ai_history', ai);
    const { error } = await supabase.from('local_data_imports').insert({ user_id: user.id });
    if (error) throw error;
  }
}

export const localDataImportService = new LocalDataImportService();
