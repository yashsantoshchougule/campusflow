import api, { getTodos, updateTodo } from './api';
import { completeAssignment } from './assignmentService.ts';
import { academicsService } from '../features/academics/service.ts';
import { attendanceService } from '../features/attendance/service.ts';
import { noticeService } from '../features/notices/service.ts';
import { defaultProfile, profileRepository } from '../features/profile/repository.ts';
import { buildDashboardSummary } from '../features/dashboard/summary.ts';
import type { AttendanceDashboard } from '../features/attendance/models.ts';
import type { AttendanceQuickUpdate, DashboardSummary, DashboardTask } from '../types/dashboard';

const emptyAttendance = (): AttendanceDashboard => ({ subjects: [], records: [], todayLectures: [], stats: { totalClasses: 0, totalPresent: 0, overallPercentage: 0, atRiskCount: 0, safeCount: 0 } });
const safely = async <T>(label: string, request: Promise<T>, fallback: T) => {
  try { return await request; }
  catch (error) { console.warn(`Dashboard ${label} widget could not load.`, error); return fallback; }
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const [profile, subjects, assignments, timetable, examinations, attendance, notices, todos] = await Promise.all([
    safely('profile', profileRepository.getProfile(), defaultProfile()),
    safely('subjects', academicsService.getSubjects(), []),
    safely('assignments', academicsService.getAssignments(), []),
    safely('timetable', academicsService.getTimetableEntries(), []),
    safely('examinations', academicsService.getExaminations(), []),
    safely('attendance', attendanceService.getDashboard(), emptyAttendance()),
    safely('notices', noticeService.dashboard().then((result) => result.notices), []),
    safely('todos', getTodos().then((result) => result.data), []),
  ]);
  return buildDashboardSummary({ profile, subjects, assignments, timetable, examinations, attendance, notices, todos });
};
export const askDashboardQuestion = (question: string) => api.post('/api/assistant/dashboard-question', { question }).then(({ data }) => data);
export const quickAttendanceUpdate = async (input: AttendanceQuickUpdate) => {
  const name = input.subject.trim().toLowerCase();
  const subject = (await academicsService.getSubjects()).find((item) => item.name.toLowerCase() === name || item.code.toLowerCase() === name);
  if (!subject) throw new Error('Choose an existing subject from Attendance.');
  return attendanceService.markAttendance(subject.id, input.status, null, input.date);
};

export const completeDashboardAction = async (action: DashboardTask) => {
  if (action.type === 'study_task') return updateTodo(action.targetId, { completed: true });
  if (action.type === 'assignment') return completeAssignment(action.targetId);
  if (action.type === 'attendance' && action.subject) return quickAttendanceUpdate({ subject: action.subject, date: new Date().toLocaleDateString('en-CA'), status: 'present' });
  throw new Error('Open the linked page to complete this action.');
};
