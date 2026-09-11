/** Profile hydration pattern adapted from ResuMate frontend/src/pages/Settings.jsx (README-declared MIT). */
import type { StudentProfile, StudyPreferences } from './models';
import { readStorage, subscribeStorage, writeStorage } from '../settings/repository.ts';
import { getSupabase, hasSupabaseConfiguration, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

export const PROFILE_STORAGE_KEY = 'campusflow_profile';
export const STUDY_PREFERENCES_STORAGE_KEY = 'campusflow_study_preferences';

export const defaultProfile = (): StudentProfile => ({ id: 'local-student', fullName: '', email: '', studentId: '', college: '', course: '', department: '', semester: '', preferredLanguage: 'English', updatedAt: '' });
export const defaultStudyPreferences = (): StudyPreferences => ({ averageSessionMinutes: 45, strongSubjectIds: [], weakSubjectIds: [], breakPreferenceMinutes: 10, attendanceTargetPercent: 75, updatedAt: '' });

export interface ProfileRepository {
  getProfile(): Promise<StudentProfile>;
  saveProfile(profile: StudentProfile): Promise<StudentProfile>;
  getStudyPreferences(): Promise<StudyPreferences>;
  saveStudyPreferences(preferences: StudyPreferences): Promise<StudyPreferences>;
  subscribe(listener: () => void): () => void;
}

export class LocalProfileRepository implements ProfileRepository {
  async getProfile() { return { ...defaultProfile(), ...readStorage<Partial<StudentProfile>>(PROFILE_STORAGE_KEY, {}) }; }
  async saveProfile(profile: StudentProfile) {
    if (profile.avatarFileId?.startsWith('data:')) throw new Error('Profile images must be stored as file IDs, not base64 data.');
    writeStorage(PROFILE_STORAGE_KEY, profile); return profile;
  }
  async getStudyPreferences() { return { ...defaultStudyPreferences(), ...readStorage<Partial<StudyPreferences>>(STUDY_PREFERENCES_STORAGE_KEY, {}) }; }
  async saveStudyPreferences(preferences: StudyPreferences) { writeStorage(STUDY_PREFERENCES_STORAGE_KEY, preferences); return preferences; }
  subscribe(listener: () => void) {
    const profile = subscribeStorage(PROFILE_STORAGE_KEY, listener); const preferences = subscribeStorage(STUDY_PREFERENCES_STORAGE_KEY, listener);
    return () => { profile(); preferences(); };
  }
}

const AVATAR_DB = 'campusflow-profile-files';
const AVATAR_STORE = 'avatars';
const avatarMemory = new Map<string, Blob>();
const openAvatarDb = () => new Promise<IDBDatabase | null>((resolve, reject) => {
  if (typeof indexedDB === 'undefined') { resolve(null); return; }
  const request = indexedDB.open(AVATAR_DB, 1);
  request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(AVATAR_STORE)) request.result.createObjectStore(AVATAR_STORE); };
  request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
});
const transactionDone = (transaction: IDBTransaction) => new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });

export interface AvatarRepository { save(file: File): Promise<string>; get(id: string): Promise<Blob | null>; delete(id: string): Promise<void> }
export class LocalAvatarRepository implements AvatarRepository {
  async save(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Use a JPG, PNG or WebP image up to 5 MB.');
    const id = crypto.randomUUID(); const database = await openAvatarDb();
    if (!database) avatarMemory.set(id, file); else { const transaction = database.transaction(AVATAR_STORE, 'readwrite'); transaction.objectStore(AVATAR_STORE).put(file, id); await transactionDone(transaction); }
    return id;
  }
  async get(id: string) {
    const database = await openAvatarDb(); if (!database) return avatarMemory.get(id) ?? null;
    return new Promise<Blob | null>((resolve, reject) => { const request = database.transaction(AVATAR_STORE).objectStore(AVATAR_STORE).get(id); request.onsuccess = () => { const result = request.result as Blob | undefined; resolve(result ?? null); }; request.onerror = () => reject(request.error); });
  }
  async delete(id: string) {
    avatarMemory.delete(id); const database = await openAvatarDb(); if (!database) return;
    const transaction = database.transaction(AVATAR_STORE, 'readwrite'); transaction.objectStore(AVATAR_STORE).delete(id); await transactionDone(transaction);
  }
}

const profileFromRow = (row: any, email: string): StudentProfile => ({
  id: row.id, fullName: row.full_name ?? '', email, studentId: row.student_id ?? '',
  college: row.college_name ?? '', course: row.course ?? '', department: row.department ?? '',
  semester: row.semester?.toString() ?? '', preferredLanguage: row.preferred_language ?? 'English',
  avatarFileId: row.avatar_path ?? undefined, updatedAt: row.updated_at,
});
const preferencesFromRow = (row: any): StudyPreferences => ({
  preferredStudyStartTime: row.preferred_study_start ?? undefined, preferredStudyEndTime: row.preferred_study_end ?? undefined,
  averageSessionMinutes: Number(row.session_duration_minutes ?? 45), strongSubjectIds: row.strong_subjects ?? [],
  weakSubjectIds: row.weak_subjects ?? [], breakPreferenceMinutes: Number(row.break_duration_minutes ?? 10),
  attendanceTargetPercent: Number(row.attendance_target_percent ?? 75), updatedAt: row.updated_at,
});

export class SupabaseProfileRepository implements ProfileRepository {
  async getProfile() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return data ? profileFromRow(data, user.email ?? '') : { ...defaultProfile(), id: user.id, email: user.email ?? '' };
  }
  async saveProfile(profile: StudentProfile) {
    if (profile.avatarFileId?.startsWith('data:')) throw new Error('Profile images must be stored as file IDs, not base64 data.');
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: profile.fullName, student_id: profile.studentId, college_name: profile.college,
      course: profile.course, department: profile.department, semester: Number(profile.semester),
      preferred_language: profile.preferredLanguage, avatar_path: profile.avatarFileId ?? null,
    }).select().single();
    if (error) throw error;
    return profileFromRow(data, user.email ?? profile.email);
  }
  async getStudyPreferences() {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('study_preferences').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data ? preferencesFromRow(data) : defaultStudyPreferences();
  }
  async saveStudyPreferences(preferences: StudyPreferences) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const { data, error } = await supabase.from('study_preferences').upsert({
      user_id: user.id, preferred_study_start: preferences.preferredStudyStartTime ?? null,
      preferred_study_end: preferences.preferredStudyEndTime ?? null,
      session_duration_minutes: preferences.averageSessionMinutes, strong_subjects: preferences.strongSubjectIds,
      weak_subjects: preferences.weakSubjectIds, break_duration_minutes: preferences.breakPreferenceMinutes,
      attendance_target_percent: preferences.attendanceTargetPercent,
    }).select().single();
    if (error) throw error;
    return preferencesFromRow(data);
  }
  subscribe(listener: () => void) {
    let unsubscribe: (() => void) | undefined;
    void getSupabase().then((supabase) => {
      const channel = supabase.channel('campusflow-profile')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, listener)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_preferences' }, listener)
        .subscribe();
      unsubscribe = () => { void supabase.removeChannel(channel); };
    });
    return () => unsubscribe?.();
  }
}

const avatarPath = (value: string) => {
  const [bucket, ...parts] = value.split('/');
  if (bucket !== 'avatars' || parts.length === 0) throw new Error('Invalid avatar path.');
  return parts.join('/');
};
export class SupabaseAvatarRepository implements AvatarRepository {
  async save(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Use a JPG, PNG or WebP image up to 5 MB.');
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type });
    if (error) throw error;
    return `avatars/${path}`;
  }
  async get(value: string) {
    const supabase = await getSupabase();
    const { data, error } = await supabase.storage.from('avatars').download(avatarPath(value));
    if (error) throw error;
    return data;
  }
  async delete(value: string) {
    const supabase = await getSupabase();
    const { error } = await supabase.storage.from('avatars').remove([avatarPath(value)]);
    if (error) throw error;
  }
}

export const profileRepository: ProfileRepository = hasSupabaseConfiguration() ? new SupabaseProfileRepository() : new LocalProfileRepository();
export const avatarRepository: AvatarRepository = hasSupabaseConfiguration() ? new SupabaseAvatarRepository() : new LocalAvatarRepository();
