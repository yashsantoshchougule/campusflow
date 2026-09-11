import type { Assignment, Examination, Subject, TimetableEntry } from '../academics/models.ts';
import type { AttendanceDashboard } from '../attendance/models.ts';
import type { NoticeDraft } from '../notices/models.ts';
import type { StudentProfile } from '../profile/models.ts';
import type { Todo } from '../../types/index.ts';
import type { DashboardSummary, DashboardTask, PriorityLevel } from '../../types/dashboard.ts';
import { getAttendanceDecision } from '../attendance/engine.ts';

export interface DashboardSourceData {
  profile: StudentProfile;
  subjects: Subject[];
  assignments: Assignment[];
  timetable: TimetableEntry[];
  examinations: Examination[];
  attendance: AttendanceDashboard;
  notices: NoticeDraft[];
  todos: Todo[];
}

const time = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const clockMinutes = (value: string) => {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
};

const taskView = (
  id: string,
  title: string,
  type: 'assignment' | 'study_task',
  deadline: string | null | undefined,
  subject: string | undefined,
  completed: boolean,
  now: Date,
): DashboardTask => {
  const due = time(deadline);
  const overdue = !completed && due !== null && due < now.getTime();
  const dueSoon = !completed && due !== null && due >= now.getTime() && due <= now.getTime() + 72 * 60 * 60 * 1000;
  const score = completed ? 0 : overdue ? 100 : dueSoon ? 70 : 40;
  const level: PriorityLevel = score >= 90 ? 'critical' : score >= 70 ? 'high' : score ? 'medium' : 'low';
  const reason = completed ? 'Completed' : overdue ? 'Overdue' : dueSoon ? 'Due soon' : 'Pending';
  return { id, targetId: id, type, title, subject, deadline: deadline ?? undefined, score, level, reason, reasons: [reason], targetRoute: type === 'assignment' ? '/academics' : '/todos' };
};

const versionOf = (value: string) => {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `v1-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const buildDashboardSummary = (source: DashboardSourceData, now = new Date()): DashboardSummary => {
  const subjects = new Map(source.subjects.map((subject) => [subject.id, subject]));
  const assignmentTasks = source.assignments.map((item) => taskView(item.id, item.title, 'assignment', item.deadline, subjects.get(item.subjectId)?.name, Boolean(item.completedAt), now));
  const todoTasks = source.todos.map((item) => taskView(item.id, item.title, 'study_task', item.due_date, undefined, item.completed, now));
  const pendingAssignments = assignmentTasks.filter((item) => item.reason !== 'Completed');
  const overdueAssignments = pendingAssignments.filter((item) => item.reason === 'Overdue');
  const dueSoonAssignments = pendingAssignments.filter((item) => item.reason === 'Due soon');
  const attendanceSubjects = source.attendance.subjects.map((item) => ({
    id: item.subjectId, subject: item.name, presentClasses: item.presentClasses, totalClasses: item.totalClasses,
    percentage: item.percentage, threshold: item.threshold, safeBunks: item.safeBunks,
    requiredClasses: item.recoveryClasses ?? 0, status: item.status,
    afterAttending: item.afterAttending, afterMissing: item.afterMissing,
  }));
  const subjectWarnings = attendanceSubjects.filter((item) => item.status !== 'safe');
  const attendanceTasks: DashboardTask[] = subjectWarnings.map((item) => ({
    id: `attendance-${item.id}`, targetId: item.id, type: 'attendance', title: `Recover ${item.subject} attendance`, subject: item.subject,
    score: item.status === 'danger' ? 95 : 75, level: item.status === 'danger' ? 'critical' : 'high',
    reason: `${item.percentage}% attendance is below the ${item.threshold}% target`, reasons: [`${item.percentage}% attendance is below the ${item.threshold}% target`],
    suggestedAction: item.requiredClasses ? `Attend the next ${item.requiredClasses} classes.` : 'Review attendance details.', targetRoute: '/attendance',
  }));
  const priorityTasks = [...attendanceTasks, ...pendingAssignments, ...todoTasks.filter((item) => item.reason !== 'Completed')].sort((a, b) => b.score - a.score);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const todayLectures = source.timetable.filter((entry) => entry.dayOfWeek === weekday).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((entry) => ({
    id: entry.id, subjectId: entry.subjectId, subject: subjects.get(entry.subjectId)?.name ?? 'Untitled', subjectCode: subjects.get(entry.subjectId)?.code,
    startTime: entry.startTime, endTime: entry.endTime, facultyName: entry.facultyName, location: entry.classroom, onlineLink: entry.onlineLink,
    status: (clockMinutes(entry.endTime) <= currentMinutes ? 'completed' : clockMinutes(entry.startTime) <= currentMinutes ? 'ongoing' : 'upcoming') as 'completed' | 'ongoing' | 'upcoming',
  }));

  const upcomingExams = source.examinations.filter((exam) => (time(exam.examDate) ?? -1) >= now.getTime()).sort((a, b) => (time(a.examDate) ?? 0) - (time(b.examDate) ?? 0)).slice(0, 5).map((exam) => ({
    id: exam.id, title: exam.name, subject: subjects.get(exam.subjectId)?.name, startsAt: exam.examDate,
    daysRemaining: Math.max(0, Math.ceil(((time(exam.examDate) ?? now.getTime()) - now.getTime()) / 86_400_000)),
    examType: exam.examinationType, syllabus: exam.topics, preparationProgress: exam.preparationProgress,
  }));

  const dangerCount = subjectWarnings.filter((item) => item.status === 'danger').length;
  const warningCount = subjectWarnings.length - dangerCount;
  const riskScore = Math.min(100, dangerCount * 35 + warningCount * 15 + overdueAssignments.length * 20);
  const riskLevel = riskScore >= 80 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 20 ? 'moderate' : 'safe';
  const riskReasons = [
    ...(dangerCount ? [`${dangerCount} subject${dangerCount === 1 ? '' : 's'} critically below attendance target.`] : []),
    ...(warningCount ? [`${warningCount} subject${warningCount === 1 ? '' : 's'} near the attendance limit.`] : []),
    ...(overdueAssignments.length ? [`${overdueAssignments.length} overdue assignment${overdueAssignments.length === 1 ? '' : 's'}.`] : []),
  ];

  const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = weekStart.getTime() + 7 * 86_400_000;
  const weeklyItems = [
    ...source.assignments.map((item) => ({ date: time(item.deadline), completed: Boolean(item.completedAt), subject: subjects.get(item.subjectId)?.name ?? 'General' })),
    ...source.todos.map((item) => ({ date: time(item.due_date ?? item.created_at), completed: item.completed, subject: 'General' })),
  ].filter((item) => item.date !== null && item.date >= weekStart.getTime() && item.date < weekEnd);
  const completedTasks = weeklyItems.filter((item) => item.completed).length;
  const subjectProgress = [...new Set(weeklyItems.map((item) => item.subject))].map((subject) => {
    const items = weeklyItems.filter((item) => item.subject === subject); const completed = items.filter((item) => item.completed).length;
    return { subject, completedTasks: completed, totalTasks: items.length, percentage: Math.round(completed * 100 / items.length) };
  });

  const notices = source.notices.filter((notice) => notice.title.value).sort((a, b) => (time(a.deadline.value) ?? Number.MAX_SAFE_INTEGER) - (time(b.deadline.value) ?? Number.MAX_SAFE_INTEGER)).slice(0, 5).map((notice) => ({
    id: notice.id, title: notice.title.value ?? 'Notice', deadline: notice.deadline.value ?? undefined,
    summary: notice.instructions.value?.join(' '), category: notice.category.value ?? undefined, updatedAt: notice.updatedAt,
    importance: notice.status === 'confirmed' ? 'confirmed' : 'review', targetRoute: '/notices',
  }));
  const nextBestAction = priorityTasks[0] ? { ...priorityTasks[0], explanation: priorityTasks[0].suggestedAction ?? priorityTasks[0].reason } : null;
  const pendingTodos = todoTasks.filter((item) => item.reason !== 'Completed');
  const sourceIds = [...new Set([
    source.profile.id,
    ...source.attendance.records.map((item) => item.id),
    ...source.assignments.map((item) => item.id),
    ...source.todos.map((item) => item.id),
    ...source.timetable.map((item) => item.id),
    ...source.examinations.map((item) => item.id),
  ].filter(Boolean))].sort();
  const stateVersion = versionOf(JSON.stringify({
    attendance: source.attendance.records.map((item) => [item.id, item.status, item.updatedAt]),
    assignments: source.assignments.map((item) => [item.id, item.completedAt, item.updatedAt]),
    todos: source.todos.map((item) => [item.id, item.completed, item.updated_at]),
    timetable: source.timetable.map((item) => [item.id, item.updatedAt]),
  }));
  const nextLecture = todayLectures.find((item) => item.status !== 'completed');
  const nextLectureAttendance = nextLecture ? attendanceSubjects.find((item) => item.id === nextLecture.subjectId) : undefined;
  const decision = nextLectureAttendance ? getAttendanceDecision(nextLectureAttendance.presentClasses, nextLectureAttendance.totalClasses, nextLectureAttendance.threshold) : null;
  const attendanceToday = nextLecture && nextLectureAttendance && decision ? {
    lectureId: nextLecture.id, subjectId: nextLectureAttendance.id, subject: nextLecture.subject, startTime: nextLecture.startTime,
    ...decision, sourceIds: [nextLecture.id, ...source.attendance.records.filter((item) => item.subjectId === nextLectureAttendance.id).map((item) => item.id)],
  } : null;
  const requiredMinutes = source.assignments.filter((item) => !item.completedAt).reduce((sum, item) => sum + (item.estimatedMinutes || 30), 0) + pendingTodos.length * 30;
  const conflicts = todayLectures.slice(1).flatMap((item, index) => todayLectures[index].endTime > item.startTime ? [`${todayLectures[index].subject} overlaps ${item.subject}`] : []);
  const bottleneck = nextBestAction ? { ...nextBestAction, sourceIds: [nextBestAction.targetId] } : null;

  return {
    student: { id: source.profile.id, fullName: source.profile.fullName || source.profile.email.split('@')[0] || 'Student', currentDate: new Intl.DateTimeFormat(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(now), semester: Number(source.profile.semester) || null, course: source.profile.course || null },
    todayLectures,
    assignments: { pending: pendingAssignments, overdue: overdueAssignments, dueSoon: dueSoonAssignments, pendingCount: pendingAssignments.length, overdueCount: overdueAssignments.length },
    upcomingExams,
    attendance: { overallPercentage: source.attendance.stats.totalClasses ? source.attendance.stats.overallPercentage : null, totalClasses: source.attendance.stats.totalClasses, totalPresent: source.attendance.stats.totalPresent, subjectWarnings, atRiskSubjects: subjectWarnings.map((item) => item.subject), subjects: attendanceSubjects },
    importantNotices: notices,
    priorityTasks: priorityTasks.slice(0, 10),
    academicRisk: { level: riskLevel, score: riskScore, reasons: riskReasons.length ? riskReasons : ['No immediate academic risks detected.'], recommendedAction: nextBestAction?.explanation ?? 'Keep following your current plan.' },
    nextBestAction,
    studyTasks: { pending: pendingTodos, overdue: pendingTodos.filter((item) => item.reason === 'Overdue'), completedCount: todoTasks.length - pendingTodos.length, pendingCount: pendingTodos.length },
    weeklyProgress: { completedTasks, pendingTasks: weeklyItems.length - completedTasks, totalTasks: weeklyItems.length, percentage: weeklyItems.length ? Math.round(completedTasks * 100 / weeklyItems.length) : 0, subjectProgress },
    studentState: { state_version: stateVersion, generated_at: now.toISOString(), data_freshness: source.attendance.records.length && source.timetable.length ? 'fresh' : 'partial', missing_data: [...(!source.attendance.records.length ? ['attendance'] : []), ...(!source.timetable.length ? ['timetable'] : [])], warnings: [], source_ids: sourceIds },
    attendanceToday,
    capacity: { availableMinutes: 180, requiredMinutes, surplusMinutes: 180 - requiredMinutes, conflicts, usedFallbackEstimate: pendingTodos.length > 0, assumption: '180 available study minutes; checklist items use a visible 30-minute fallback.' },
    bottleneck,
    why: nextBestAction ? { facts: nextBestAction.reasons, inferences: ['Highest deterministic priority among current incomplete items.'], confidence: nextBestAction.score >= 70 ? 'high' : 'medium', sourceIds: [nextBestAction.targetId] } : null,
  };
};
