import { getSupabase, requireSupabaseUser } from '../../lib/supabaseRepository.ts';

export type OnboardingValues = { fullName: string; studentId: string; collegeName: string; course: string; department: string; semester: string; minimumAttendance: string; preferredStart: string; preferredEnd: string; sessionDuration: string; breakDuration: string; strongSubjects: string[]; weakSubjects: string[]; language: 'English' | 'Hindi' | 'Marathi' };

export class OnboardingService {
  async load(): Promise<{ values: OnboardingValues; completed: boolean; avatarUrl: string }> {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const [profileResult, preferencesResult] = await Promise.all([
      supabase.from('profiles').select('full_name, student_id, college_name, course, department, semester, minimum_attendance_percentage, avatar_path, onboarding_completed').eq('id', user.id).maybeSingle(),
      supabase.from('study_preferences').select('preferred_study_start, preferred_study_end, session_duration_minutes, break_duration_minutes, strong_subjects, weak_subjects, language').eq('user_id', user.id).maybeSingle(),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (preferencesResult.error) throw preferencesResult.error;
    const profile = profileResult.data; const preferences = preferencesResult.data;
    let avatarUrl = '';
    if (profile?.avatar_path) {
      const { data, error } = await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path.replace(/^avatars\//, ''), 3600);
      if (error) throw error;
      avatarUrl = data.signedUrl;
    }
    return { completed: profile?.onboarding_completed ?? false, avatarUrl, values: {
      fullName: profile?.full_name ?? '', studentId: profile?.student_id ?? '', collegeName: profile?.college_name ?? '', course: profile?.course ?? '', department: profile?.department ?? '', semester: profile?.semester?.toString() ?? '', minimumAttendance: profile?.minimum_attendance_percentage?.toString() ?? '75', preferredStart: preferences?.preferred_study_start ?? '', preferredEnd: preferences?.preferred_study_end ?? '', sessionDuration: preferences?.session_duration_minutes?.toString() ?? '45', breakDuration: preferences?.break_duration_minutes?.toString() ?? '10', strongSubjects: preferences?.strong_subjects ?? [], weakSubjects: preferences?.weak_subjects ?? [], language: preferences?.language === 'Hindi' || preferences?.language === 'Marathi' ? preferences.language : 'English',
    } };
  }
  async save(values: OnboardingValues, complete: boolean, state: { imageFile: File | null; hasAvatar: boolean; removeAvatar: boolean }) {
    const [supabase, user] = await Promise.all([getSupabase(), requireSupabaseUser()]);
    const path = `${user.id}/avatar`;
    let avatarPath = state.removeAvatar ? null : state.hasAvatar ? `avatars/${path}` : null;
    let avatarUrl = '';
    if (state.imageFile) {
      const { error } = await supabase.storage.from('avatars').upload(path, state.imageFile, { contentType: state.imageFile.type, upsert: true });
      if (error) throw error;
      const { data, error: urlError } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
      if (urlError) throw urlError;
      avatarPath = `avatars/${path}`; avatarUrl = data.signedUrl;
    } else if (state.removeAvatar && state.hasAvatar) {
      const { error } = await supabase.storage.from('avatars').remove([path]);
      if (error) throw error;
    }
    const now = new Date().toISOString();
    const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, full_name: values.fullName.trim(), student_id: values.studentId.trim() || null, college_name: values.collegeName.trim() || null, course: values.course.trim() || null, department: values.department.trim() || null, semester: values.semester ? Number(values.semester) : null, minimum_attendance_percentage: Number(values.minimumAttendance), avatar_path: avatarPath, onboarding_completed: complete, updated_at: now });
    if (profileError) throw profileError;
    const { error: preferencesError } = await supabase.from('study_preferences').upsert({ user_id: user.id, preferred_study_start: values.preferredStart || null, preferred_study_end: values.preferredEnd || null, session_duration_minutes: Number(values.sessionDuration) || 45, break_duration_minutes: Number(values.breakDuration) || 10, strong_subjects: values.strongSubjects, weak_subjects: values.weakSubjects, language: values.language, updated_at: now });
    if (preferencesError) throw preferencesError;
    return { avatarPath, avatarUrl };
  }
}

export const onboardingService = new OnboardingService();
