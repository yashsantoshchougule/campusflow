/**
 * Persistence behavior adapted from TacticalReader/Calendar-App and
 * diegnghtmr/vale. Calendar-App is Apache-2.0; Vale is MIT licensed.
 */
import type { CalendarPreferences, Reminder } from './models';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

export const CALENDAR_STORAGE_KEYS = {
  reminders: 'campusflow_reminders', preferences: 'campusflow_calendar_preferences',
} as const;

const memory = new Map<string, string>();
const storage = () => typeof localStorage === 'undefined'
  ? { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } }
  : localStorage;

const defaultPreferences = (): CalendarPreferences => ({
  view: 'month', selectedDate: new Date().toISOString(),
  filters: { eventTypes: [], includeCompletedReminders: false },
});

export interface CalendarRepository {
  getReminders(): Promise<Reminder[]>;
  saveReminder(reminder: Reminder): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
  getPreferences(): Promise<CalendarPreferences>;
  savePreferences(preferences: CalendarPreferences): Promise<CalendarPreferences>;
}

export class LocalCalendarRepository implements CalendarRepository {
  async getReminders() {
    try {
      const value = JSON.parse(storage().getItem(CALENDAR_STORAGE_KEYS.reminders) ?? '[]');
      return Array.isArray(value) ? value as Reminder[] : [];
    } catch { return []; }
  }

  async saveReminder(reminder: Reminder) {
    const reminders = await this.getReminders();
    const index = reminders.findIndex((item) => item.id === reminder.id);
    if (index < 0) reminders.push(reminder); else reminders[index] = reminder;
    storage().setItem(CALENDAR_STORAGE_KEYS.reminders, JSON.stringify(reminders));
    return reminder;
  }

  async deleteReminder(id: string) {
    storage().setItem(CALENDAR_STORAGE_KEYS.reminders, JSON.stringify((await this.getReminders()).filter((item) => item.id !== id)));
  }

  async getPreferences() {
    try {
      const value = JSON.parse(storage().getItem(CALENDAR_STORAGE_KEYS.preferences) ?? '{}') as Partial<CalendarPreferences>;
      return { ...defaultPreferences(), ...value, filters: { ...defaultPreferences().filters, ...value.filters } };
    } catch { return defaultPreferences(); }
  }

  async savePreferences(preferences: CalendarPreferences) {
    storage().setItem(CALENDAR_STORAGE_KEYS.preferences, JSON.stringify(preferences));
    return preferences;
  }
}

const fromRow = (row: any): Reminder => ({
  id: row.id, title: row.title, description: row.description ?? undefined, reminderAt: row.reminder_at,
  subjectId: row.subject_id ?? undefined, linkedEntityType: row.linked_entity_type ?? undefined,
  linkedEntityId: row.linked_entity_id ?? undefined, status: row.status,
  completedAt: row.completed_at ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at,
});

export class SupabaseCalendarRepository implements CalendarRepository {
  async getReminders() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('reminders').select('*').eq('user_id', user.id).order('reminder_at');
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  async saveReminder(reminder: Reminder) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('reminders').upsert({
      id: reminder.id, user_id: user.id, title: reminder.title, description: reminder.description ?? null,
      reminder_at: reminder.reminderAt, subject_id: reminder.subjectId ?? null,
      linked_entity_type: reminder.linkedEntityType ?? null, linked_entity_id: reminder.linkedEntityId ?? null,
      status: reminder.status, completed_at: reminder.completedAt ?? null,
    }).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  async deleteReminder(id: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
  }
  async getPreferences() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('user_settings').select('calendar_preferences').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    const value = data?.calendar_preferences as Partial<CalendarPreferences> | undefined;
    return { ...defaultPreferences(), ...value, filters: { ...defaultPreferences().filters, ...value?.filters } };
  }
  async savePreferences(preferences: CalendarPreferences) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('user_settings').upsert({ user_id: user.id, calendar_preferences: preferences }).select('calendar_preferences').single();
    if (error) throw error;
    return (data.calendar_preferences as CalendarPreferences) ?? preferences;
  }
}

export const calendarRepository: CalendarRepository = hasSupabaseConfiguration() ? new SupabaseCalendarRepository() : new LocalCalendarRepository();
