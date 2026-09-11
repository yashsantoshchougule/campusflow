import type { Assignment, AssignmentStatus, DayOfWeek, Difficulty, Examination, Priority, TimetableEntry } from './models';

const DAY_MS = 86_400_000;
export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function getAssignmentStatus(assignment: Pick<Assignment, 'completedAt' | 'deadline'>, now = new Date()): AssignmentStatus {
  if (assignment.completedAt) return 'Completed';
  return new Date(assignment.deadline).getTime() < now.getTime() ? 'Overdue' : 'Pending';
}

export function getDeadlineWarning(assignment: Pick<Assignment, 'completedAt' | 'deadline'>, now = new Date()): string | null {
  if (assignment.completedAt) return null;
  const hours = (new Date(assignment.deadline).getTime() - now.getTime()) / 3_600_000;
  if (hours < 0) return 'Overdue';
  if (hours <= 24) return 'Due within 24 hours';
  if (hours <= 72) return 'Due within three days';
  return null;
}

export function hasTimetableConflict(entry: Pick<TimetableEntry, 'id' | 'dayOfWeek' | 'startTime' | 'endTime'>, entries: TimetableEntry[]): boolean {
  return entries.some((other) =>
    other.id !== entry.id &&
    other.dayOfWeek === entry.dayOfWeek &&
    entry.startTime < other.endTime &&
    entry.endTime > other.startTime
  );
}

export function getExamDaysRemaining(examDate: string, now = new Date()): number {
  return Math.ceil((new Date(examDate).getTime() - now.getTime()) / DAY_MS);
}

export function getExamPriority(exam: Pick<Examination, 'examDate' | 'preparationProgress'>, subjectDifficulty: Difficulty, now = new Date()): Priority {
  const days = getExamDaysRemaining(exam.examDate, now);
  const score =
    (days <= 3 ? 3 : days <= 7 ? 2 : days <= 14 ? 1 : 0) +
    (exam.preparationProgress < 30 ? 3 : exam.preparationProgress < 70 ? 2 : exam.preparationProgress < 90 ? 1 : 0) +
    (subjectDifficulty === 'Hard' ? 2 : subjectDifficulty === 'Medium' ? 1 : 0);
  return score >= 6 ? 'High' : score >= 3 ? 'Medium' : 'Low';
}

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export const getTodayName = (now = new Date()) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now) as DayOfWeek;
