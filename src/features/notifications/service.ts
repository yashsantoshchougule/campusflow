/**
 * Inbox actions adapt zenith-notification-center NotificationService.ts,
 * applyFilter, useUnreadCount and NotificationInbox.tsx. MIT licensed.
 */
import { readStorage } from '../settings/repository.ts';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';
import { createNotifications, type NotificationFactorySources } from './notificationFactory.ts';
import type { CampusNotification, NotificationFilters, NotificationPreferences } from './models';
import type { NotificationRepository } from './repository';
import { notificationRepository } from './repository.ts';

export interface NotificationSourceProvider { load(now: Date, preferences: NotificationPreferences): Promise<NotificationFactorySources> }

const firstStoredArray = <T>(keys: string[]) => {
  for (const key of keys) { const values = readStorage<T[]>(key, []); if (Array.isArray(values) && values.length) return values; }
  return [];
};

async function plannerNotifications() {
  if (!hasSupabaseConfiguration()) return {
    studySessions: firstStoredArray<{ id: string; title: string; start: string; end?: string; status?: string; completedAt?: string }>(['campusflow_study_sessions', 'studybuddy.study-planner.sessions.v1']),
    atktApplications: firstStoredArray<{ id: string; title?: string; status: string; updatedAt: string; correctionMessage?: string }>(['campusflow_atkt_applications', 'studybuddy.atkt.applications.v1']),
  };
  const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
  const [sessions, applications] = await Promise.all([
    supabase.from('study_sessions').select('*').eq('user_id', user.id), supabase.from('atkt_applications').select('*').eq('user_id', user.id),
  ]);
  if (sessions.error) throw sessions.error;
  if (applications.error) throw applications.error;
  return {
    studySessions: (sessions.data ?? []).map((item: any) => ({ id: item.id, title: item.title, start: item.start_at, end: item.end_at, status: item.status, completedAt: item.status === 'completed' ? item.updated_at : undefined })),
    atktApplications: (applications.data ?? []).map((item: any) => ({ id: item.id, title: item.title, status: item.status, updatedAt: item.updated_at, correctionMessage: item.correction_message ?? undefined })),
  };
}

export class CampusNotificationSourceProvider implements NotificationSourceProvider {
  async load(now: Date, preferences: NotificationPreferences): Promise<NotificationFactorySources> {
    const [{ academicsService }, { attendanceService }, { calendarAggregationService }, { noticeService }] = await Promise.all([
      import('../academics/service.ts'), import('../attendance/service.ts'), import('../calendar/aggregationService.ts'), import('../notices/service.ts'),
    ]);
    const rangeEnd = new Date(now); rangeEnd.setDate(rangeEnd.getDate() + Math.max(4, preferences.examReminderDays));
    const rangeStart = new Date(now); rangeStart.setDate(rangeStart.getDate() - 30);
    const [subjects, assignments, examinations, calendarEvents, attendance, notices, planner] = await Promise.all([
      academicsService.getSubjects(), academicsService.getAssignments(), academicsService.getExaminations(),
      calendarAggregationService.getEvents({ start: rangeStart, end: rangeEnd }), attendanceService.getDashboard(), noticeService.dashboard(), plannerNotifications(),
    ]);
    const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.name;
    const confirmedNotices = notices.notices.filter((notice) => notice.status === 'confirmed').map((notice) => ({ id: notice.id, title: notice.title.value ?? 'Confirmed notice', confirmedAt: notice.updatedAt, applies: noticeService.applicabilityFor(notice, notices.context).status === 'applies' }));
    const linkedAtkt = notices.links.filter((link) => link.type === 'atkt_application').map((link) => ({ id: link.targetId, title: notices.notices.find((notice) => notice.id === link.noticeId)?.title.value ?? 'ATKT application update', status: link.details?.approvalStatus ?? 'updated', updatedAt: link.createdAt, message: link.details?.correctionMessage }));
    return {
      assignments: assignments.map((value) => ({ id: value.id, title: value.title, deadline: value.deadline, subjectName: subjectName(value.subjectId) })),
      examinations: examinations.map((value) => ({ id: value.id, title: value.name, startsAt: value.examDate, subjectName: subjectName(value.subjectId) })),
      lectures: calendarEvents.filter((value) => value.sourceType === 'lecture').map((value) => ({ id: value.id, title: value.title, startsAt: value.start, subjectName: value.subjectName })),
      attendance: attendance.subjects.map((value) => ({ subjectId: value.subjectId, subjectName: value.name, status: value.status, percentage: value.percentage, target: value.threshold })),
      studySessions: planner.studySessions.map((value) => ({ id: value.id, title: value.title, endsAt: value.end ?? value.start, completed: value.status === 'completed' || Boolean(value.completedAt) })),
      notices: confirmedNotices,
      atktUpdates: [...planner.atktApplications.map((value) => ({ id: value.id, title: value.title ?? 'ATKT application update', status: value.status, updatedAt: value.updatedAt, message: value.correctionMessage })), ...linkedAtkt],
    };
  }
}

export class NotificationService {
  private readonly repository: NotificationRepository;
  private readonly sources: NotificationSourceProvider;
  constructor(repository: NotificationRepository = notificationRepository, sources: NotificationSourceProvider = new CampusNotificationSourceProvider()) { this.repository = repository; this.sources = sources; }

  async getInbox(now = new Date()) {
    const [preferences, states] = await Promise.all([this.repository.getPreferences(), this.repository.getStates()]);
    const generated = createNotifications(await this.sources.load(now, preferences), preferences, now);
    const stateByKey = new Map(states.map((state) => [state.stableSourceKey, state]));
    return generated.map((notification) => ({ ...notification, ...stateByKey.get(notification.stableSourceKey) })).filter((notification) => notification.status !== 'dismissed');
  }

  filter(notifications: CampusNotification[], filters: NotificationFilters) {
    return notifications.filter((item) => (!filters.type || item.type === filters.type) && (!filters.status || filters.status === 'all' || item.status === filters.status));
  }
  unreadCount(notifications: CampusNotification[]) { return notifications.filter((item) => item.status === 'unread').length; }
  async markRead(stableSourceKey: string, now = new Date()) { return this.repository.saveState({ stableSourceKey, status: 'read', readAt: now.toISOString() }); }
  async markAllRead(notifications: CampusNotification[], now = new Date()) { await Promise.all(notifications.filter((item) => item.status === 'unread').map((item) => this.markRead(item.stableSourceKey, now))); }
  async dismiss(stableSourceKey: string, now = new Date()) { return this.repository.saveState({ stableSourceKey, status: 'dismissed', dismissedAt: now.toISOString() }); }
  async getPreferences() { return this.repository.getPreferences(); }
  async savePreferences(preferences: NotificationPreferences) { return this.repository.savePreferences({ ...preferences, updatedAt: new Date().toISOString() }); }
  subscribe(listener: () => void) { return this.repository.subscribe(listener); }
}

export const notificationService = new NotificationService();
