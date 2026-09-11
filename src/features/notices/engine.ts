/**
 * OCR dispatch follows dagimgetaw/OCR image_processing.py and pdf_processing.py
 * (MIT declared in its README; the source repository contains no LICENSE file).
 * Academic context/date boundaries follow Nidhish-Balasubramanya/
 * RPA-Driven-Academic-Mail-Manager (Copyright (c) 2025 Nidhish, MIT).
 */
import type {
  EditableNoticeValues, ExtractedValue, NoticeActionLink, NoticeApplicabilityResult,
  NoticeDraft, NoticeField, NoticeFields, NoticeHistoryEntry, NoticeSource,
  NoticeSourceType, NoticeWarning, ParsedNoticePage, StudentAcademicContext,
  StructuredNoticePayload,
} from './models';

export const MAX_NOTICE_BYTES = 10 * 1024 * 1024;
export const NOTICE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
const FIELD_KEYS: (keyof NoticeFields)[] = ['title', 'deadline', 'instructions', 'eligibility', 'requiredDocuments', 'category', 'applicableCourses', 'applicableBranches', 'applicableYears', 'applicableSemesters', 'applicableDivisions'];

export function validateNoticeFile(file: File, sourceType: NoticeSourceType): void {
  if (!file.size || file.size > MAX_NOTICE_BYTES) throw new Error('Use a notice file between 1 byte and 10 MB.');
  if (!NOTICE_TYPES.includes(file.type as typeof NOTICE_TYPES[number])) throw new Error('Use a JPG, PNG, WebP or PDF notice.');
  if (sourceType === 'pdf_upload' && file.type !== 'application/pdf') throw new Error('PDF upload requires a PDF file.');
  if (sourceType === 'camera_capture' && !file.type.startsWith('image/')) throw new Error('Camera capture must produce an image.');
}

export async function noticeFileHash(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function dataUrlToNoticeFile(dataUrl: string, name = `notice-${Date.now()}.jpg`): File {
  const [header, encoded] = dataUrl.split(',');
  const mimeType = header?.match(/^data:([^;]+);base64$/)?.[1];
  if (!mimeType || !encoded) throw new Error('The camera did not return a valid image.');
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  return new File([bytes], name, { type: mimeType });
}

const blank = <T>(): NoticeField<T> => ({ value: null, confidence: 'low', status: 'needs_verification' });
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

function supported<T>(field: ExtractedValue<T> | undefined, pages: ParsedNoticePage[]): NoticeField<T> {
  if (!field?.value || !field.sourceSnippet || !pages.some((page) => normalize(page.text).includes(normalize(field.sourceSnippet!)))) return blank<T>();
  return { ...field, status: field.confidence === 'low' ? 'needs_verification' : 'extracted' };
}

export function mapExtractionToDraft(source: NoticeSource, pages: ParsedNoticePage[], structured: StructuredNoticePayload | null, now = new Date().toISOString()): NoticeDraft {
  const fields: NoticeFields = structured ? {
    title: supported(structured.title, pages),
    deadline: supported(structured.deadlines[0], pages),
    instructions: supported(structured.instructions, pages),
    eligibility: supported(structured.eligibility, pages),
    requiredDocuments: supported(structured.requiredDocuments, pages),
    category: supported(structured.category, pages),
    applicableCourses: supported(structured.applicableCourses, pages),
    applicableBranches: supported(structured.applicableBranches, pages),
    applicableYears: supported(structured.applicableYears, pages),
    applicableSemesters: supported(structured.applicableSemesters, pages),
    applicableDivisions: supported(structured.applicableDivisions, pages),
  } : {
    title: blank(), deadline: blank(), instructions: blank(), eligibility: blank(), requiredDocuments: blank(), category: blank(),
    applicableCourses: blank(), applicableBranches: blank(), applicableYears: blank(), applicableSemesters: blank(), applicableDivisions: blank(),
  };
  return {
    id: crypto.randomUUID(), sourceId: source.id, rawText: pages.map((page) => page.text).join('\n\n'),
    detectedDeadlines: structured?.deadlines.map((deadline) => deadline.value).filter((value): value is string => Boolean(value)) ?? [],
    ...fields, originalExtraction: structuredClone(fields), status: 'draft', version: 1, createdAt: now, updatedAt: now,
  };
}

export function noticeWarnings(draft: NoticeDraft): NoticeWarning[] {
  const warnings: NoticeWarning[] = [];
  if (!draft.rawText.trim()) warnings.push({ code: 'no_text', message: 'No readable text was extracted. Enter the notice fields manually.' });
  if (FIELD_KEYS.some((key) => draft[key].confidence === 'low')) warnings.push({ code: 'low_confidence', message: 'One or more fields have low OCR/extraction confidence.' });
  if (FIELD_KEYS.some((key) => draft[key].value !== null && !draft[key].sourceSnippet && draft[key].status !== 'manually_edited')) warnings.push({ code: 'missing_source', message: 'A field without source support requires verification.' });
  if (draft.detectedDeadlines.length > 1) warnings.push({ code: 'multiple_dates', message: 'Multiple deadlines were detected. Select the correct deadline manually.' });
  if (draft.deadline.value && !/\b\d{4}\b/.test(draft.deadline.value)) warnings.push({ code: 'ambiguous_date', message: 'The deadline has no year and must be verified.' });
  if (!draft.eligibility.value?.length) warnings.push({ code: 'eligibility_unclear', message: 'Eligibility could not be understood.' });
  if (!draft.requiredDocuments.value?.length) warnings.push({ code: 'documents_uncertain', message: 'Required documents are uncertain.' });
  return warnings;
}

const academicNormalize = (value: string) => normalize(value)
  .replace(/\b(first|1st)\b/g, '1').replace(/\b(second|2nd)\b/g, '2').replace(/\b(third|3rd)\b/g, '3').replace(/\b(fourth|4th)\b/g, '4')
  .replace(/\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/g, (roman) => String(['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'].indexOf(roman) + 1))
  .replace(/\b(semester|sem|year|division|branch|course)\b/g, '').replace(/\s+/g, ' ').trim();
const valuesMatch = (profileValue: string, rules: string[]) => rules.some((rule) => academicNormalize(rule).includes(academicNormalize(profileValue)) || academicNormalize(profileValue).includes(academicNormalize(rule)));

export function evaluateNoticeApplicability(draft: NoticeDraft, profile: StudentAcademicContext): NoticeApplicabilityResult {
  const checks: [keyof StudentAcademicContext, NoticeField<string[]>, string][] = [
    ['course', draft.applicableCourses, 'course'], ['branch', draft.applicableBranches, 'branch'], ['year', draft.applicableYears, 'year'],
    ['semester', draft.applicableSemesters, 'semester'], ['division', draft.applicableDivisions, 'division'],
  ];
  const relevant = checks.filter(([, field]) => field.value?.length);
  const missingProfileFields = relevant.filter(([key]) => !profile[key].trim()).map(([, , label]) => label);
  if (missingProfileFields.length) return { noticeId: draft.id, status: 'cannot_determine', reasons: [`Profile information is missing: ${missingProfileFields.join(', ')}.`], missingProfileFields };
  const mismatch = relevant.find(([key, field]) => !valuesMatch(profile[key], field.value ?? []));
  if (mismatch) return { noticeId: draft.id, status: 'does_not_apply', reasons: [`Does not match your ${mismatch[2]} (${profile[mismatch[0]]}).`], missingProfileFields: [] };
  if (!relevant.length || draft.eligibility.status === 'needs_verification') return { noticeId: draft.id, status: 'may_apply', reasons: ['Eligibility rules are incomplete or unclear; verify the original notice.'], missingProfileFields: [] };
  return { noticeId: draft.id, status: 'applies', reasons: [`Applies because your ${relevant.map(([, , label]) => label).join(', ')} matches the notice.`], missingProfileFields: [] };
}

export function editNoticeDraft(draft: NoticeDraft, values: EditableNoticeValues, now = new Date().toISOString()): NoticeDraft {
  const next = structuredClone(draft);
  for (const key of FIELD_KEYS) {
    const value = values[key];
    if (JSON.stringify(next[key].value) !== JSON.stringify(value)) next[key] = { ...next[key], value: value || null, status: 'manually_edited' } as never;
  }
  return { ...next, version: draft.version + 1, status: 'draft', updatedAt: now };
}

export function confirmNoticeDraft(draft: NoticeDraft, explicitlyConfirmed: boolean, now = new Date().toISOString()): NoticeDraft {
  if (!explicitlyConfirmed) throw new Error('Explicit confirmation is required before saving this notice.');
  if (!draft.title.value?.trim()) throw new Error('Confirm a notice title before saving.');
  const next = structuredClone(draft);
  for (const key of FIELD_KEYS) if (next[key].value !== null) next[key].status = 'confirmed';
  return { ...next, status: 'confirmed', version: draft.version + 1, updatedAt: now };
}

export function historyEntry(draft: NoticeDraft, action: NoticeHistoryEntry['action'], summary: string, now = new Date().toISOString()): NoticeHistoryEntry {
  return { id: crypto.randomUUID(), noticeId: draft.id, version: draft.version, action, summary, createdAt: now };
}

export function createNoticeActionLink(draft: NoticeDraft, type: NoticeActionLink['type'], targetId: string, details?: Record<string, string>, now = new Date().toISOString()): NoticeActionLink {
  if (draft.status !== 'confirmed') throw new Error('Confirm the notice before creating actions.');
  if (!targetId.trim()) throw new Error('Select or create a target before linking it.');
  return { id: crypto.randomUUID(), noticeId: draft.id, type, targetId: targetId.trim(), ...(details ? { details } : {}), createdAt: now };
}
