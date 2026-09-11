/**
 * Immutable notification construction adapts zenith-notification-center
 * NotificationService.add/update and filtering semantics. Copyright (c) 2026
 * arunkumarbrahmaniyaa, MIT License.
 */
import type { CampusNotification, NotificationPreferences, NotificationPriority, NotificationType } from './models';

export interface NotificationFactorySources {
  assignments: Array<{ id: string; title: string; deadline: string; subjectName?: string }>;
  examinations: Array<{ id: string; title: string; startsAt: string; subjectName?: string }>;
  lectures: Array<{ id: string; title: string; startsAt: string; subjectName?: string }>;
  attendance: Array<{ subjectId: string; subjectName: string; status: 'safe' | 'warning' | 'danger'; percentage: number; target: number }>;
  studySessions: Array<{ id: string; title: string; endsAt: string; completed: boolean }>;
  notices: Array<{ id: string; title: string; confirmedAt: string; applies: boolean }>;
  atktUpdates: Array<{ id: string; title: string; status: string; updatedAt: string; message?: string }>;
}

const hoursBetween = (future: Date, now: Date) => (future.getTime() - now.getTime()) / 3_600_000;
const validFuture = (value: string, now: Date, hours: number) => { const date = new Date(value); const difference = hoursBetween(date, now); return !Number.isNaN(date.getTime()) && difference >= 0 && difference <= hours; };
const item = (stableSourceKey: string, type: NotificationType, priority: NotificationPriority, title: string, message: string, createdAt: string, relatedEntityType: string, relatedEntityId: string, relatedPath: string): CampusNotification => ({ id: `notification:${stableSourceKey}`, stableSourceKey, type, priority, title, message, createdAt, relatedEntityType, relatedEntityId, relatedPath, status: 'unread' });

export function createNotifications(sources: NotificationFactorySources, preferences: NotificationPreferences, now = new Date()): CampusNotification[] {
  if (!preferences.enabled) return [];
  const values: CampusNotification[] = [];
  for (const source of sources.assignments) if (validFuture(source.deadline, now, preferences.assignmentReminderHours)) values.push(item(`assignment:${source.id}:deadline-warning`, 'assignment_deadline', 'important', source.title, `${source.subjectName ?? 'Assignment'} is due within ${preferences.assignmentReminderHours} hours.`, source.deadline, 'assignment', source.id, '/academics'));
  for (const source of sources.examinations) if (validFuture(source.startsAt, now, preferences.examReminderDays * 24)) values.push(item(`exam:${source.id}:reminder`, 'examination_reminder', 'urgent', source.title, `${source.subjectName ?? 'Examination'} is within ${preferences.examReminderDays} days.`, source.startsAt, 'examination', source.id, '/academics'));
  for (const source of sources.lectures) if (validFuture(source.startsAt, now, preferences.lectureReminderMinutes / 60)) values.push(item(`lecture:${source.id}:reminder`, 'lecture_reminder', 'normal', source.title, `${source.subjectName ?? 'Lecture'} starts soon.`, source.startsAt, 'lecture', source.id, '/academics'));
  if (preferences.attendanceAlerts) for (const source of sources.attendance) if (source.status !== 'safe') values.push(item(`attendance:${source.subjectId}:${source.status}`, 'attendance_alert', source.status === 'danger' ? 'urgent' : 'important', `${source.subjectName} attendance`, `${source.percentage.toFixed(1)}% attendance against a ${source.target}% target.`, now.toISOString(), 'subject', source.subjectId, '/attendance'));
  for (const source of sources.studySessions) if (!source.completed && new Date(source.endsAt) < now) values.push(item(`study-session:${source.id}:missed`, 'missed_study_session', 'important', `Missed: ${source.title}`, 'This study session ended without being completed.', source.endsAt, 'study_session', source.id, '/study-planner'));
  if (preferences.noticeAlerts) for (const source of sources.notices) if (source.applies) values.push(item(`notice:${source.id}:new`, 'new_notice', 'normal', source.title, 'A confirmed notice applies to your academic profile.', source.confirmedAt, 'notice', source.id, '/notices'));
  if (preferences.atktAlerts) for (const source of sources.atktUpdates) values.push(item(`atkt:${source.id}:${source.status.toLowerCase().replaceAll(' ', '-')}`, 'atkt_update', /rejected|correction/i.test(source.status) ? 'urgent' : 'important', source.title, source.message ?? `ATKT status: ${source.status}.`, source.updatedAt, 'atkt_application', source.id, '/notices'));
  return [...new Map(values.map((notification) => [notification.stableSourceKey, notification])).values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

