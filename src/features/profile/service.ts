/** Validation/save flow adapted from ResuMate frontend/src/pages/Settings.jsx (README-declared MIT). */
import type { Subject } from '../academics/models';
import type { ProfileRepository, AvatarRepository } from './repository';
import { avatarRepository, defaultStudyPreferences, profileRepository } from './repository.ts';
import type { StudentProfile, StudyPreferences, StudyPreferenceSuggestion } from './models';

export function validateProfile(profile: StudentProfile) {
  const required: Array<keyof Pick<StudentProfile, 'fullName' | 'email' | 'studentId' | 'college' | 'course' | 'department' | 'semester'>> = ['fullName', 'email', 'studentId', 'college', 'course', 'department', 'semester'];
  for (const field of required) if (!profile[field].trim()) throw new Error(`${field} is required.`);
  if (!/^\S+@\S+\.\S+$/.test(profile.email)) throw new Error('Enter a valid email address.');
  const semester = Number(profile.semester); if (!Number.isInteger(semester) || semester < 1 || semester > 20) throw new Error('Semester must be between 1 and 20.');
}

export function validateStudyPreferences(preferences: StudyPreferences, subjects: Subject[]) {
  if (!Number.isInteger(preferences.averageSessionMinutes) || preferences.averageSessionMinutes < 1 || preferences.averageSessionMinutes > 480) throw new Error('Average session duration must be between 1 and 480 minutes.');
  if (!Number.isInteger(preferences.breakPreferenceMinutes) || preferences.breakPreferenceMinutes < 0 || preferences.breakPreferenceMinutes > 120) throw new Error('Break preference must be between 0 and 120 minutes.');
  if (!Number.isFinite(preferences.attendanceTargetPercent) || preferences.attendanceTargetPercent < 1 || preferences.attendanceTargetPercent > 100) throw new Error('Attendance target must be between 1 and 100.');
  const validIds = new Set(subjects.map((subject) => subject.id));
  for (const id of [...preferences.strongSubjectIds, ...preferences.weakSubjectIds]) if (!validIds.has(id)) throw new Error('Study preferences contain an unknown subject.');
  if (preferences.strongSubjectIds.some((id) => preferences.weakSubjectIds.includes(id))) throw new Error('A subject cannot be both strong and weak.');
}

export class ProfileService {
  private readonly repository: ProfileRepository;
  private readonly avatars: AvatarRepository;
  constructor(repository: ProfileRepository = profileRepository, avatars: AvatarRepository = avatarRepository) { this.repository = repository; this.avatars = avatars; }
  async load() { return Promise.all([this.repository.getProfile(), this.repository.getStudyPreferences()]); }
  async saveProfile(profile: StudentProfile, avatar?: File) {
    validateProfile(profile); let avatarFileId = profile.avatarFileId;
    if (avatar) { if (avatarFileId) await this.avatars.delete(avatarFileId); avatarFileId = await this.avatars.save(avatar); }
    return this.repository.saveProfile({ ...profile, ...(avatarFileId ? { avatarFileId } : {}), updatedAt: new Date().toISOString() });
  }
  async removeAvatar(profile: StudentProfile) { if (profile.avatarFileId) await this.avatars.delete(profile.avatarFileId); const withoutAvatar = { ...profile }; delete withoutAvatar.avatarFileId; return this.repository.saveProfile({ ...withoutAvatar, updatedAt: new Date().toISOString() }); }
  async avatarUrl(id?: string) { if (!id) return ''; const file = await this.avatars.get(id); return file && typeof URL !== 'undefined' ? URL.createObjectURL(file) : ''; }
  async savePreferences(preferences: StudyPreferences, subjects: Subject[]) { validateStudyPreferences(preferences, subjects); return this.repository.saveStudyPreferences({ ...preferences, updatedAt: new Date().toISOString() }); }
  async resetPreferences() { return this.repository.saveStudyPreferences({ ...defaultStudyPreferences(), updatedAt: new Date().toISOString() }); }
  suggestPreferences(subjects: Subject[]): StudyPreferenceSuggestion {
    return { strongSubjectIds: subjects.filter((subject) => subject.strengthLevel === 'Strong').map((subject) => subject.id), weakSubjectIds: subjects.filter((subject) => subject.strengthLevel === 'Weak').map((subject) => subject.id), reason: 'Suggestions use the current subject strength labels and are not saved automatically.' };
  }
}

export const profileService = new ProfileService();
