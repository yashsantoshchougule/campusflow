export type ThemePreference = 'light' | 'dark' | 'system';
export type CampusLanguage = 'English' | 'Hindi' | 'Marathi';

export interface UserSettings {
  theme: ThemePreference;
  language: CampusLanguage;
  allowStudyAiUploadedMaterials: boolean;
  confirmBeforeDataSave: boolean;
  privacySource: 'student';
  privacyUpdatedAt: string;
  updatedAt: string;
}

export interface UploadedDocument {
  id: string;
  sourceId: string;
  fileId?: string;
  fileName: string;
  sourceModule: 'Notes' | 'Notice Intelligence';
  uploadedAt: string;
  updatedAt: string;
}

export interface ExportOptions { includeAiHistory: boolean }

