import { readStorage } from './repository.ts';
import type { ExportOptions } from './models';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

export const EXPORTED_SECTIONS = ['Profile', 'Study preferences', 'Subjects', 'Assignments', 'Attendance', 'Examinations', 'Timetable', 'Study plans', 'Study sessions', 'Reminders', 'Notification states', 'Confirmed notices', 'ATKT applications'] as const;

const stripSecrets = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripSecrets);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !/(password|token|secret|service.?role|api.?key)/i.test(key)).map(([key, child]) => [key, stripSecrets(child)]));
  return value;
};

export interface ExportData {
  profile: unknown; studyPreferences: unknown; subjects: unknown[]; assignments: unknown[]; attendance: unknown[]; examinations: unknown[]; timetable: unknown[];
  studyPlans: unknown[]; studySessions: unknown[]; reminders: unknown[]; notificationStates: unknown[]; confirmedNotices: unknown[]; atktApplications: unknown[]; aiHistory?: unknown;
}

export function buildStudentExport(data: ExportData, options: ExportOptions, exportedAt = new Date().toISOString()) {
  const payload = { format: 'campusflow-student-export', version: 1, exportedAt, ...data };
  if (!options.includeAiHistory) delete payload.aiHistory;
  return stripSecrets(payload) as Record<string, unknown>;
}

export class ExportService {
  async prepare(options: ExportOptions) {
    const [{ academicsService }, { attendanceService }, { calendarRepository }, { notificationRepository }, { profileRepository }, { noticeService }] = await Promise.all([
      import('../academics/service.ts'), import('../attendance/service.ts'), import('../calendar/repository.ts'), import('../notifications/repository.ts'), import('../profile/repository.ts'), import('../notices/service.ts'),
    ]);
    const [profile, studyPreferences, subjects, assignments, dashboard, examinations, timetable, reminders, notificationStates, notices] = await Promise.all([
      profileRepository.getProfile(), profileRepository.getStudyPreferences(), academicsService.getSubjects(), academicsService.getAssignments(),
      attendanceService.getDashboard(), academicsService.getExaminations(), academicsService.getTimetableEntries(),
      calendarRepository.getReminders(), notificationRepository.getStates(), noticeService.dashboard(),
    ]);
    let studyPlans = readStorage<unknown[]>('campusflow_study_plans', []); let studySessions = readStorage<unknown[]>('campusflow_study_sessions', []); let atktApplications = readStorage<unknown[]>('campusflow_atkt_applications', []); let aiHistory: unknown;
    if (hasSupabaseConfiguration()) {
      const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
      const [plans, sessions, atkt, ai] = await Promise.all([
        supabase.from('study_plans').select('*').eq('user_id', user.id), supabase.from('study_sessions').select('*').eq('user_id', user.id), supabase.from('atkt_applications').select('*').eq('user_id', user.id),
        options.includeAiHistory ? supabase.from('ai_history').select('*').eq('user_id', user.id) : Promise.resolve({ data: null, error: null }),
      ]);
      if (plans.error) throw plans.error; if (sessions.error) throw sessions.error; if (atkt.error) throw atkt.error; if (ai.error) throw ai.error;
      studyPlans = plans.data ?? []; studySessions = sessions.data ?? []; atktApplications = atkt.data ?? []; aiHistory = ai.data ?? [];
    } else if (options.includeAiHistory) aiHistory = (await import('../studyAi/repositories.ts')).getStudyAiHistory();
    return buildStudentExport({ profile, studyPreferences, subjects, assignments, attendance: dashboard.records, examinations, timetable,
      studyPlans, studySessions, reminders, notificationStates, confirmedNotices: notices.notices.filter((notice) => notice.status === 'confirmed'), atktApplications,
      ...(options.includeAiHistory ? { aiHistory } : {}),
    }, options);
  }

  download(payload: Record<string, unknown>) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `campusflow-export-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
