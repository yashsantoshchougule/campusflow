/**
 * Storage shape adapted from zenith-notification-center StorageService.ts and
 * rehooks/local-storage storage events. MIT licensed; see THIRD_PARTY_NOTICES.md.
 */
import type { NotificationPreferences, NotificationStateRecord } from './models';
import { readStorage, subscribeStorage, writeStorage } from '../settings/repository.ts';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

export const NOTIFICATION_STATE_KEY = 'campusflow_notification_states';
export const NOTIFICATION_PREFERENCES_KEY = 'campusflow_notification_preferences';
export const defaultNotificationPreferences = (): NotificationPreferences => ({ enabled: true, assignmentReminderHours: 48, examReminderDays: 3, lectureReminderMinutes: 30, attendanceAlerts: true, noticeAlerts: true, atktAlerts: true, updatedAt: '' });

export interface NotificationRepository {
  getStates(): Promise<NotificationStateRecord[]>;
  saveState(state: NotificationStateRecord): Promise<NotificationStateRecord>;
  getPreferences(): Promise<NotificationPreferences>;
  savePreferences(preferences: NotificationPreferences): Promise<NotificationPreferences>;
  subscribe(listener: () => void): () => void;
}

export class LocalNotificationRepository implements NotificationRepository {
  async getStates() { const values = readStorage<NotificationStateRecord[]>(NOTIFICATION_STATE_KEY, []); return Array.isArray(values) ? values : []; }
  async saveState(state: NotificationStateRecord) {
    const states = await this.getStates(); const index = states.findIndex((item) => item.stableSourceKey === state.stableSourceKey);
    if (index < 0) states.push(state); else states[index] = state; writeStorage(NOTIFICATION_STATE_KEY, states); return state;
  }
  async getPreferences() { return { ...defaultNotificationPreferences(), ...readStorage<Partial<NotificationPreferences>>(NOTIFICATION_PREFERENCES_KEY, {}) }; }
  async savePreferences(preferences: NotificationPreferences) { writeStorage(NOTIFICATION_PREFERENCES_KEY, preferences); return preferences; }
  subscribe(listener: () => void) { const states = subscribeStorage(NOTIFICATION_STATE_KEY, listener); const preferences = subscribeStorage(NOTIFICATION_PREFERENCES_KEY, listener); return () => { states(); preferences(); }; }
}

const stateFromRow = (row: any): NotificationStateRecord => ({
  stableSourceKey: row.stable_source_key, status: row.status, readAt: row.read_at ?? undefined, dismissedAt: row.dismissed_at ?? undefined,
});
const preferencesFromRow = (row: any): NotificationPreferences => ({
  enabled: row.enabled, assignmentReminderHours: row.assignment_reminder_hours,
  examReminderDays: row.exam_reminder_days, lectureReminderMinutes: row.lecture_reminder_minutes,
  attendanceAlerts: row.attendance_alerts, noticeAlerts: row.notice_alerts, atktAlerts: row.atkt_alerts,
  updatedAt: row.updated_at,
});

export class SupabaseNotificationRepository implements NotificationRepository {
  async getStates() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('notification_states').select('*').eq('user_id', user.id);
    if (error) throw error;
    return (data ?? []).map(stateFromRow);
  }
  async saveState(state: NotificationStateRecord) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('notification_states').upsert({
      user_id: user.id, stable_source_key: state.stableSourceKey, status: state.status,
      read_at: state.readAt ?? null, dismissed_at: state.dismissedAt ?? null,
    }, { onConflict: 'user_id,stable_source_key' }).select().single();
    if (error) throw error;
    return stateFromRow(data);
  }
  async getPreferences() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data ? preferencesFromRow(data) : defaultNotificationPreferences();
  }
  async savePreferences(preferences: NotificationPreferences) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('notification_preferences').upsert({
      user_id: user.id, enabled: preferences.enabled, assignment_reminder_hours: preferences.assignmentReminderHours,
      exam_reminder_days: preferences.examReminderDays, lecture_reminder_minutes: preferences.lectureReminderMinutes,
      attendance_alerts: preferences.attendanceAlerts, notice_alerts: preferences.noticeAlerts,
      atkt_alerts: preferences.atktAlerts,
    }).select().single();
    if (error) throw error;
    return preferencesFromRow(data);
  }
  subscribe(listener: () => void) {
    let unsubscribe: (() => void) | undefined;
    void getSupabase().then((supabase) => {
      const channel = supabase.channel('campusflow-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_states' }, listener)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_preferences' }, listener)
        .subscribe();
      unsubscribe = () => { void supabase.removeChannel(channel); };
    });
    return () => unsubscribe?.();
  }
}

export const notificationRepository: NotificationRepository = hasSupabaseConfiguration() ? new SupabaseNotificationRepository() : new LocalNotificationRepository();
