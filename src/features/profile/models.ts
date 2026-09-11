import type { CampusLanguage } from '../settings/models';

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  college: string;
  course: string;
  department: string;
  semester: string;
  preferredLanguage: CampusLanguage;
  avatarFileId?: string;
  updatedAt: string;
}

export interface StudyPreferences {
  preferredStudyStartTime?: string;
  preferredStudyEndTime?: string;
  averageSessionMinutes: number;
  strongSubjectIds: string[];
  weakSubjectIds: string[];
  breakPreferenceMinutes: number;
  attendanceTargetPercent: number;
  updatedAt: string;
}

export type StudyPreferenceSuggestion = Pick<StudyPreferences, 'strongSubjectIds' | 'weakSubjectIds'> & { reason: string };

