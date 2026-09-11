import { academicsService } from '../academics/service';
import { hasSupabaseConfiguration } from '../../lib/supabaseRepository.ts';
import {
  confirmNoticeDraft, createNoticeActionLink, editNoticeDraft, evaluateNoticeApplicability,
  historyEntry, mapExtractionToDraft, noticeFileHash, noticeWarnings, validateNoticeFile,
} from './engine';
import {
  LocalNoticeActionLinkRepository, LocalNoticeHistoryRepository, LocalNoticeRepository,
  LocalNoticeSourceRepository, LocalStudentAcademicContextRepository, SupabaseNoticeActionLinkRepository,
  SupabaseNoticeHistoryRepository, SupabaseNoticeRepository, SupabaseNoticeSourceRepository,
  SupabaseStudentAcademicContextRepository, type NoticeActionLinkRepository,
  type NoticeHistoryRepository, type NoticeRepository, type NoticeSourceRepository,
  type StudentAcademicContextRepository,
} from './repositories';
import type {
  EditableNoticeValues, NoticeActionLink, NoticeApplicabilityResult, NoticeDraft,
  NoticeExtractionResponse, NoticeHistoryEntry, NoticeSource, NoticeSourceType,
  NoticeWarning, StudentAcademicContext,
} from './models';

export class NoticeUploadService {
  private readonly sources: NoticeSourceRepository;
  constructor(sources: NoticeSourceRepository) { this.sources = sources; }
  async upload(file: File, sourceType: NoticeSourceType): Promise<{ source: NoticeSource; duplicate: boolean }> {
    validateNoticeFile(file, sourceType);
    const fileHash = await noticeFileHash(file);
    const existing = await this.sources.findByHash(fileHash);
    if (existing) return { source: existing, duplicate: true };
    const source: NoticeSource = { id: crypto.randomUUID(), sourceType, fileName: file.name, mimeType: file.type, fileHash, createdAt: new Date().toISOString() };
    await this.sources.save(source, file);
    return { source, duplicate: false };
  }
}

export class NoticeDocumentParser {
  async parse(file: File): Promise<NoticeExtractionResponse> {
    const { extractNoticeSource } = await import('../../services/api');
    return (await extractNoticeSource(file)).data;
  }
}

export class NoticeOcrService {
  private readonly parser: NoticeDocumentParser;
  constructor(parser = new NoticeDocumentParser()) { this.parser = parser; }
  async extract(file: File): Promise<NoticeExtractionResponse> {
    try { return await this.parser.parse(file); }
    catch (error) { return { pages: [], pageCount: 0, structured: null, extractionError: error instanceof Error ? error.message : 'OCR is currently unavailable.' }; }
  }
}

export class NoticeStructuredExtractionService {
  createDraft(source: NoticeSource, extraction: NoticeExtractionResponse) { return mapExtractionToDraft(source, extraction.pages, extraction.structured); }
}
export class NoticeValidationService { warnings(draft: NoticeDraft) { return noticeWarnings(draft); } }
export class NoticeApplicabilityService { evaluate(draft: NoticeDraft, context: StudentAcademicContext) { return evaluateNoticeApplicability(draft, context); } }

export class NoticeActionService {
  private readonly links: NoticeActionLinkRepository;
  private readonly history: NoticeHistoryRepository;
  constructor(links: NoticeActionLinkRepository, history: NoticeHistoryRepository) { this.links = links; this.history = history; }
  private async existing(noticeId: string, type: NoticeActionLink['type']) { return (await this.links.list(noticeId)).find((link) => link.type === type) ?? null; }
  private async persist(draft: NoticeDraft, link: NoticeActionLink) { await this.links.save(link); await this.history.save(historyEntry(draft, 'linked', `Linked ${link.type} ${link.targetId}.`)); return link; }
  async createTask(draft: NoticeDraft) {
    const existing = await this.existing(draft.id, 'task'); if (existing) return existing;
    if (!draft.deadline.value) throw new Error('Confirm a deadline before creating an academic task.');
    const subject = (await academicsService.getSubjects())[0];
    if (!subject) throw new Error('Create an Academic subject before converting this notice to a task.');
    const task = await academicsService.createAssignment({ subjectId: subject.id, title: draft.title.value ?? 'Notice task', description: `Created from notice ${draft.id}.`, deadline: draft.deadline.value, estimatedMinutes: 30, difficulty: 'Medium', priority: 'High' });
    return this.persist(draft, createNoticeActionLink(draft, 'task', task.id));
  }
  async createReminder(draft: NoticeDraft, remindAt: string) {
    const existing = await this.existing(draft.id, 'reminder'); if (existing) return existing;
    if (!draft.deadline.value) throw new Error('Confirm a deadline before creating a reminder.');
    if (!remindAt || Number.isNaN(new Date(remindAt).getTime())) throw new Error('Choose a valid reminder time.');
    return this.persist(draft, createNoticeActionLink(draft, 'reminder', crypto.randomUUID(), { remindAt, deadline: draft.deadline.value }));
  }
  async linkAtkt(draft: NoticeDraft, applicationId: string) {
    const existing = await this.existing(draft.id, 'atkt_application'); if (existing) return existing;
    return this.persist(draft, createNoticeActionLink(draft, 'atkt_application', applicationId, { approvalStatus: 'unchanged' }));
  }
}

export interface NoticeDashboard {
  sources: NoticeSource[];
  notices: NoticeDraft[];
  history: NoticeHistoryEntry[];
  links: NoticeActionLink[];
  context: StudentAcademicContext;
}

export class CampusNoticeService {
  private readonly sources: NoticeSourceRepository;
  private readonly notices: NoticeRepository;
  private readonly history: NoticeHistoryRepository;
  private readonly links: NoticeActionLinkRepository;
  private readonly contexts: StudentAcademicContextRepository;
  private readonly uploadService: NoticeUploadService;
  private readonly ocr: NoticeOcrService;
  private readonly extraction = new NoticeStructuredExtractionService();
  private readonly validation = new NoticeValidationService();
  private readonly applicability = new NoticeApplicabilityService();
  private readonly actions: NoticeActionService;

  constructor(
    sources: NoticeSourceRepository = hasSupabaseConfiguration() ? new SupabaseNoticeSourceRepository() : new LocalNoticeSourceRepository(),
    notices: NoticeRepository = hasSupabaseConfiguration() ? new SupabaseNoticeRepository() : new LocalNoticeRepository(),
    history: NoticeHistoryRepository = hasSupabaseConfiguration() ? new SupabaseNoticeHistoryRepository() : new LocalNoticeHistoryRepository(),
    links: NoticeActionLinkRepository = hasSupabaseConfiguration() ? new SupabaseNoticeActionLinkRepository() : new LocalNoticeActionLinkRepository(),
    contexts: StudentAcademicContextRepository = hasSupabaseConfiguration() ? new SupabaseStudentAcademicContextRepository() : new LocalStudentAcademicContextRepository(), ocr = new NoticeOcrService(),
  ) {
    this.sources = sources; this.notices = notices; this.history = history; this.links = links; this.contexts = contexts;
    this.uploadService = new NoticeUploadService(sources); this.ocr = ocr; this.actions = new NoticeActionService(links, history);
  }

  async dashboard(): Promise<NoticeDashboard> {
    const [sources, notices, history, links, context] = await Promise.all([this.sources.list(), this.notices.list(), this.history.list(), this.links.list(), this.contexts.get()]);
    return { sources, notices, history, links, context };
  }

  async uploadAndExtract(file: File, sourceType: NoticeSourceType) {
    const uploaded = await this.uploadService.upload(file, sourceType);
    const previous = uploaded.duplicate ? await this.notices.findBySource(uploaded.source.id) : null;
    if (previous) return { source: uploaded.source, draft: previous, warnings: this.validation.warnings(previous), duplicate: true, extractionError: undefined };
    const result = await this.ocr.extract(file);
    const source = { ...uploaded.source, pageCount: result.pageCount || undefined, extractedAt: new Date().toISOString() };
    await this.sources.update(source);
    const draft = this.extraction.createDraft(source, result);
    await this.notices.saveVersion(draft);
    await this.history.save(historyEntry(draft, 'extracted', result.extractionError ? 'Source saved; automatic extraction requires manual review.' : 'Notice text and fields extracted.'));
    return { source, draft, warnings: this.validation.warnings(draft), duplicate: uploaded.duplicate, extractionError: result.extractionError };
  }

  async edit(id: string, values: EditableNoticeValues) {
    const draft = await this.required(id); const edited = editNoticeDraft(draft, values);
    await this.notices.saveVersion(edited); await this.history.save(historyEntry(edited, 'edited', 'Student saved manual field changes.'));
    return edited;
  }
  async confirm(id: string, explicitlyConfirmed: boolean) {
    const confirmed = confirmNoticeDraft(await this.required(id), explicitlyConfirmed);
    await this.notices.saveVersion(confirmed); await this.history.save(historyEntry(confirmed, 'confirmed', 'Student explicitly confirmed the extracted notice.'));
    return confirmed;
  }
  async saveContext(context: StudentAcademicContext) { await this.contexts.save(context); }
  applicabilityFor(draft: NoticeDraft, context: StudentAcademicContext): NoticeApplicabilityResult { return this.applicability.evaluate(draft, context); }
  warningsFor(draft: NoticeDraft): NoticeWarning[] { return this.validation.warnings(draft); }
  async createTask(id: string) { return this.actions.createTask(await this.required(id)); }
  async createReminder(id: string, remindAt: string) { return this.actions.createReminder(await this.required(id), remindAt); }
  async linkAtkt(id: string, applicationId: string) { return this.actions.linkAtkt(await this.required(id), applicationId); }
  async sourceUrl(sourceId: string) { const file = await this.sources.getFile(sourceId); return file ? URL.createObjectURL(file) : null; }
  async deleteSource(sourceId: string) {
    const notice = await this.notices.findBySource(sourceId);
    if (notice) { await Promise.all([this.history.deleteByNotice(notice.id), this.links.deleteByNotice(notice.id)]); }
    await this.notices.deleteBySource(sourceId); await this.sources.delete(sourceId);
  }
  private async required(id: string) { const notice = await this.notices.get(id); if (!notice) throw new Error('Notice not found.'); return notice; }
}

export const editableValues = (notice: NoticeDraft): EditableNoticeValues => ({
  title: notice.title.value ?? '', deadline: notice.deadline.value ?? '', instructions: notice.instructions.value ?? [], eligibility: notice.eligibility.value ?? [], requiredDocuments: notice.requiredDocuments.value ?? [],
  category: notice.category.value ?? 'Other', applicableCourses: notice.applicableCourses.value ?? [], applicableBranches: notice.applicableBranches.value ?? [], applicableYears: notice.applicableYears.value ?? [],
  applicableSemesters: notice.applicableSemesters.value ?? [], applicableDivisions: notice.applicableDivisions.value ?? [],
});

export const noticeService = new CampusNoticeService();
