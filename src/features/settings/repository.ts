/**
 * Availability, memory fallback and storage-event behavior adapted from
 * rehooks/local-storage src/storage.ts and src/local-storage-events.ts.
 * Copyright (c) 2018-present LocalStorage, MIT License.
 */
import type { UserSettings } from './models';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

export const SETTINGS_STORAGE_KEY = 'campusflow_settings';
export const CAMPUSFLOW_STORAGE_EVENT = 'campusflow:storage-change';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memory = new Map<string, string>();
const memoryStorage: StorageLike = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value); },
  removeItem: (key) => { memory.delete(key); },
};

export function localStorageAvailable() {
  if (typeof localStorage === 'undefined') return false;
  try { const key = '__campusflow_storage_test__'; localStorage.setItem(key, key); localStorage.removeItem(key); return true; } catch { return false; }
}

export const storage = (): StorageLike => localStorageAvailable() ? localStorage : memoryStorage;

export function readStorage<T>(key: string, fallback: T): T {
  try { const value = storage().getItem(key); return value === null ? fallback : JSON.parse(value) as T; } catch { return fallback; }
}

export function writeStorage<T>(key: string, value: T) {
  storage().setItem(key, JSON.stringify(value));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CAMPUSFLOW_STORAGE_EVENT, { detail: { key } }));
}

export function removeStorage(key: string) {
  storage().removeItem(key);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CAMPUSFLOW_STORAGE_EVENT, { detail: { key } }));
}

export function subscribeStorage(key: string, listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const receive = (event: Event) => {
    if (event instanceof StorageEvent ? event.key === key : (event as CustomEvent<{ key?: string }>).detail?.key === key) listener();
  };
  window.addEventListener('storage', receive); window.addEventListener(CAMPUSFLOW_STORAGE_EVENT, receive);
  return () => { window.removeEventListener('storage', receive); window.removeEventListener(CAMPUSFLOW_STORAGE_EVENT, receive); };
}

export const defaultSettings = (): UserSettings => {
  const now = new Date().toISOString();
  return { theme: 'system', language: 'English', allowStudyAiUploadedMaterials: true, confirmBeforeDataSave: true, privacySource: 'student', privacyUpdatedAt: now, updatedAt: now };
};

export interface SettingsRepository {
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<UserSettings>;
  subscribe(listener: () => void): () => void;
}

export class LocalSettingsRepository implements SettingsRepository {
  async getSettings() { return { ...defaultSettings(), ...readStorage<Partial<UserSettings>>(SETTINGS_STORAGE_KEY, {}) }; }
  async saveSettings(settings: UserSettings) { writeStorage(SETTINGS_STORAGE_KEY, settings); return settings; }
  subscribe(listener: () => void) { return subscribeStorage(SETTINGS_STORAGE_KEY, listener); }
}

const settingsFromRow = (row: any): UserSettings => ({
  theme: row.theme, language: row.language, allowStudyAiUploadedMaterials: row.allow_study_ai_uploaded_materials,
  confirmBeforeDataSave: row.confirm_before_data_save, privacySource: 'student',
  privacyUpdatedAt: row.privacy_updated_at, updatedAt: row.updated_at,
});

export class SupabaseSettingsRepository implements SettingsRepository {
  async getSettings() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data ? settingsFromRow(data) : defaultSettings();
  }
  async saveSettings(settings: UserSettings) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('user_settings').upsert({
      user_id: user.id, theme: settings.theme, language: settings.language,
      allow_study_ai_uploaded_materials: settings.allowStudyAiUploadedMaterials,
      confirm_before_data_save: settings.confirmBeforeDataSave, privacy_source: 'student',
      privacy_updated_at: settings.privacyUpdatedAt,
    }).select().single();
    if (error) throw error;
    return settingsFromRow(data);
  }
  subscribe(listener: () => void) {
    let unsubscribe: (() => void) | undefined;
    void getSupabase().then((supabase) => {
      const channel = supabase.channel('campusflow-settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings' }, listener)
        .subscribe();
      unsubscribe = () => { void supabase.removeChannel(channel); };
    });
    return () => unsubscribe?.();
  }
}

export const settingsRepository: SettingsRepository = hasSupabaseConfiguration() ? new SupabaseSettingsRepository() : new LocalSettingsRepository();

export const CAMPUSFLOW_OWNED_KEYS = [
  'campusflow_notification_states', 'campusflow_notification_preferences', 'campusflow_profile', 'campusflow_study_preferences', SETTINGS_STORAGE_KEY,
  'campusflow_reminders', 'campusflow_calendar_preferences', 'campusflow_study_sessions', 'campusflow_study_plans', 'campusflow_atkt_applications',
  'studybuddy.study-planner.sessions.v1', 'studybuddy.atkt.applications.v1',
  'studybuddy.academics.v1', 'studybuddy.attendance.v1', 'studybuddy.notices.sources.v1', 'studybuddy.notices.versions.v1',
  'studybuddy.notices.history.v1', 'studybuddy.notices.links.v1', 'studybuddy.notices.student-context.v1',
  'studybuddy.study-ai.documents.v1', 'studybuddy.study-ai.conversations.v1', 'studybuddy.study-ai.materials.v1',
  'studybuddy.study-ai.quizzes.v1', 'studybuddy.study-ai.attempts.v1', 'studybuddy.study-ai.schedules.v1', 'semesterStart',
] as const;
