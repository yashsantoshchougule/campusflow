import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  confirmNoticeDraft, createNoticeActionLink, dataUrlToNoticeFile, editNoticeDraft,
  evaluateNoticeApplicability, mapExtractionToDraft, noticeFileHash, noticeWarnings, validateNoticeFile,
} from '../src/features/notices/engine.ts';
import { LocalNoticeSourceRepository } from '../src/features/notices/repositories.ts';
import type { EditableNoticeValues, NoticeSource, StructuredNoticePayload } from '../src/features/notices/models.ts';

const values: EditableNoticeValues = { title: 'Exam form', deadline: '12 September 2026', instructions: ['Submit the form'], eligibility: ['BSc IT Semester V students'], requiredDocuments: ['Bring marksheet'], category: 'Examination', applicableCourses: ['BSc IT'], applicableBranches: ['IT'], applicableYears: [], applicableSemesters: ['Semester V'], applicableDivisions: [] };
const source: NoticeSource = { id: 'source-1', sourceType: 'pdf_upload', fileName: 'notice.pdf', mimeType: 'application/pdf', fileHash: 'hash', pageCount: 2, createdAt: '2026-09-11T00:00:00.000Z' };
const field = <T>(value: T, snippet: string, pageNumber = 2) => ({ value, confidence: 'high' as const, sourceSnippet: snippet, pageNumber });
const structured: StructuredNoticePayload = {
  title: field('Exam form', 'Exam form'), deadlines: [field('12 September 2026', 'Deadline: 12 September 2026')], instructions: field(['Submit the form'], 'Submit the form'), eligibility: field(['BSc IT Semester V students'], 'BSc IT Semester V students'), requiredDocuments: field(['Bring marksheet'], 'Bring marksheet'), category: field('Examination', 'Exam form'), applicableCourses: field(['BSc IT'], 'BSc IT Semester V students'), applicableBranches: field(['IT'], 'BSc IT Semester V students'), applicableYears: { value: null, confidence: 'low' }, applicableSemesters: field(['Semester V'], 'BSc IT Semester V students'), applicableDivisions: { value: null, confidence: 'low' },
};
const draft = () => mapExtractionToDraft(source, [{ pageNumber: 1, text: 'Cover' }, { pageNumber: 2, text: 'Exam form\nDeadline: 12 September 2026\nSubmit the form\nBSc IT Semester V students\nBring marksheet' }], structured, '2026-09-11T00:00:00.000Z');

test('image, PDF and camera validation accepts supported sources and rejects mismatches', () => {
  validateNoticeFile(new File(['x'], 'notice.jpg', { type: 'image/jpeg' }), 'image_upload');
  validateNoticeFile(new File(['x'], 'notice.pdf', { type: 'application/pdf' }), 'pdf_upload');
  const captured = dataUrlToNoticeFile('data:image/jpeg;base64,eA==', 'capture.jpg');
  validateNoticeFile(captured, 'camera_capture');
  assert.throws(() => validateNoticeFile(captured, 'pdf_upload'), /requires a PDF/);
});

test('page-aware extraction maps only source-supported fields', () => {
  const notice = draft();
  assert.equal(notice.deadline.pageNumber, 2);
  assert.equal(notice.title.value, 'Exam form');
  const unsupported = structuredClone(structured); unsupported.title.sourceSnippet = 'invented';
  assert.equal(mapExtractionToDraft(source, [{ pageNumber: 1, text: 'Exam form' }], unsupported).title.value, null);
});

test('warnings cover low confidence, missing support, ambiguous and multiple deadlines', () => {
  const notice = draft();
  notice.deadline.value = '12 September'; notice.detectedDeadlines = ['12 September', '14 September'];
  notice.title = { value: 'Manual-looking value', confidence: 'medium', status: 'extracted' };
  const codes = noticeWarnings(notice).map((warning) => warning.code);
  assert.deepEqual(['low_confidence', 'missing_source', 'multiple_dates', 'ambiguous_date'], codes.slice(0, 4));
});

test('manual edits create a new version without changing original extraction', () => {
  const original = draft(); const edited = editNoticeDraft(original, { ...values, title: 'Corrected exam form' });
  assert.equal(edited.version, 2); assert.equal(edited.title.status, 'manually_edited');
  assert.equal(edited.originalExtraction.title.value, 'Exam form'); assert.equal(original.title.value, 'Exam form');
});

test('confirmation is explicit and actions require confirmed notices', () => {
  const original = draft();
  assert.throws(() => confirmNoticeDraft(original, false), /Explicit confirmation/);
  assert.throws(() => createNoticeActionLink(original, 'task', 'task-1'), /Confirm/);
  assert.equal(confirmNoticeDraft(original, true).status, 'confirmed');
});

test('applicability matches course, branch and semester without guessing missing profile data', () => {
  const notice = draft();
  const applies = evaluateNoticeApplicability(notice, { course: 'BSc IT', branch: 'IT', year: '', semester: '5', division: '', academicStatus: 'regular', atktStatus: 'none' });
  assert.equal(applies.status, 'applies');
  const missing = evaluateNoticeApplicability(notice, { course: '', branch: 'IT', year: '', semester: '5', division: '', academicStatus: '', atktStatus: '' });
  assert.equal(missing.status, 'cannot_determine'); assert.deepEqual(missing.missingProfileFields, ['course']);
});

test('task, reminder and ATKT links preserve notice and ATKT approval state', () => {
  const confirmed = confirmNoticeDraft(draft(), true); const before = structuredClone(confirmed);
  assert.equal(createNoticeActionLink(confirmed, 'task', 'task-1').noticeId, confirmed.id);
  assert.equal(createNoticeActionLink(confirmed, 'reminder', 'reminder-1').type, 'reminder');
  assert.equal(createNoticeActionLink(confirmed, 'atkt_application', 'atkt-1', { approvalStatus: 'unchanged' }).details?.approvalStatus, 'unchanged');
  assert.deepEqual(confirmed, before);
});

test('source hashes are stable and duplicate sources can be detected', async () => {
  const storageData = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => storageData.get(key) ?? null, setItem: (key: string, value: string) => storageData.set(key, value) } });
  const file = new File(['same notice'], 'notice.jpg', { type: 'image/jpeg' }); const hash = await noticeFileHash(file);
  const repository = new LocalNoticeSourceRepository(); await repository.save({ ...source, fileHash: hash }, file);
  const refreshedRepository = new LocalNoticeSourceRepository();
  assert.equal((await refreshedRepository.findByHash(await noticeFileHash(new File(['same notice'], 'copy.jpg', { type: 'image/jpeg' }))))?.id, source.id);
  assert.equal(await (await refreshedRepository.getFile(source.id))?.text(), 'same notice');
});

test('frontend source contains no notice AI provider secret', () => {
  const files = (directory: string): string[] => readdirSync(directory).flatMap((name) => { const path = join(directory, name); return statSync(path).isDirectory() ? files(path) : [path]; });
  const sourceText = files('src').filter((path) => /\.(ts|tsx)$/.test(path)).map((path) => readFileSync(path, 'utf8')).join('\n');
  assert.doesNotMatch(sourceText, /VITE_(?:OPENAI|GEMINI|MISTRAL|ANTHROPIC).*KEY/i);
});
