export type NoticeSourceType = 'image_upload' | 'pdf_upload' | 'camera_capture';
export type FieldStatus = 'extracted' | 'manually_edited' | 'needs_verification' | 'confirmed';
export type FieldConfidence = 'high' | 'medium' | 'low';
export type NoticeCategory = 'General academic' | 'Assignment' | 'Examination' | 'Fee' | 'Scholarship' | 'Event' | 'ATKT' | 'Other';

export interface NoticeField<T> {
  value: T | null;
  confidence: FieldConfidence;
  status: FieldStatus;
  sourceSnippet?: string;
  pageNumber?: number;
}

export interface NoticeSource {
  id: string;
  sourceType: NoticeSourceType;
  fileName: string;
  mimeType: string;
  fileHash: string;
  pageCount?: number;
  createdAt: string;
  extractedAt?: string;
}

export interface NoticeFields {
  title: NoticeField<string>;
  deadline: NoticeField<string>;
  instructions: NoticeField<string[]>;
  eligibility: NoticeField<string[]>;
  requiredDocuments: NoticeField<string[]>;
  category: NoticeField<NoticeCategory>;
  applicableCourses: NoticeField<string[]>;
  applicableBranches: NoticeField<string[]>;
  applicableYears: NoticeField<string[]>;
  applicableSemesters: NoticeField<string[]>;
  applicableDivisions: NoticeField<string[]>;
}

export interface NoticeDraft extends NoticeFields {
  id: string;
  sourceId: string;
  rawText: string;
  detectedDeadlines: string[];
  originalExtraction: NoticeFields;
  status: 'draft' | 'confirmed' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAcademicContext {
  course: string;
  branch: string;
  year: string;
  semester: string;
  division: string;
  academicStatus: string;
  atktStatus: string;
}

export interface NoticeApplicabilityResult {
  noticeId: string;
  status: 'applies' | 'may_apply' | 'does_not_apply' | 'cannot_determine';
  reasons: string[];
  missingProfileFields: string[];
}

export interface NoticeActionLink {
  id: string;
  noticeId: string;
  type: 'task' | 'reminder' | 'atkt_application';
  targetId: string;
  details?: Record<string, string>;
  createdAt: string;
}

export interface NoticeHistoryEntry {
  id: string;
  noticeId: string;
  version: number;
  action: 'extracted' | 'edited' | 'confirmed' | 'linked';
  summary: string;
  createdAt: string;
}

export interface ParsedNoticePage {
  text: string;
  pageNumber: number;
}

export interface ExtractedValue<T> {
  value: T | null;
  confidence: FieldConfidence;
  sourceSnippet?: string;
  pageNumber?: number;
}

export interface StructuredNoticePayload {
  title: ExtractedValue<string>;
  deadlines: ExtractedValue<string>[];
  instructions: ExtractedValue<string[]>;
  eligibility: ExtractedValue<string[]>;
  requiredDocuments: ExtractedValue<string[]>;
  category: ExtractedValue<NoticeCategory>;
  applicableCourses: ExtractedValue<string[]>;
  applicableBranches: ExtractedValue<string[]>;
  applicableYears: ExtractedValue<string[]>;
  applicableSemesters: ExtractedValue<string[]>;
  applicableDivisions: ExtractedValue<string[]>;
}

export interface NoticeExtractionResponse {
  pages: ParsedNoticePage[];
  pageCount: number;
  structured: StructuredNoticePayload | null;
  extractionError?: string;
}

export interface NoticeWarning {
  code: string;
  message: string;
}

export type EditableNoticeValues = {
  title: string;
  deadline: string;
  instructions: string[];
  eligibility: string[];
  requiredDocuments: string[];
  category: NoticeCategory;
  applicableCourses: string[];
  applicableBranches: string[];
  applicableYears: string[];
  applicableSemesters: string[];
  applicableDivisions: string[];
};
