import type { Note, Subject } from '../academics/models';
import { academicsService } from '../academics/service';
import { mockStorageAdapter, supabaseStorageAdapter, type StorageAdapter } from '../academics/storage';
import { hasSupabaseConfiguration } from '../../lib/supabaseRepository.ts';
import {
  AI_UNAVAILABLE, DocumentChunkingService, EvidenceValidationService, INSUFFICIENT_EVIDENCE,
  QuizScoringService, StudyAiRetrievalService, StudyQuizGenerationService, asProviderChunks, callProviderSafely, weakTopics,
} from './engine';
import { extractPdf, hasExtractableText } from './pdf';
import {
  LocalAcademicDocumentAdapter, LocalGeneratedStudyMaterialRepository, LocalQuizAttemptRepository,
  LocalQuizScheduleRepository, LocalStudyAiConversationRepository, LocalStudyAiDocumentIndexRepository,
  LocalStudyQuizRepository, type AcademicDocumentRepository, type GeneratedStudyMaterialRepository,
  type QuizAttemptRepository, type QuizScheduleRepository, type StudyAiConversationRepository,
  type StudyAiDocumentIndexRepository, type StudyQuizRepository, SupabaseAcademicDocumentAdapter,
  SupabaseGeneratedStudyMaterialRepository, SupabaseQuizAttemptRepository, SupabaseQuizScheduleRepository,
  SupabaseStudyAiConversationRepository, SupabaseStudyAiDocumentIndexRepository, SupabaseStudyQuizRepository,
} from './repositories';
import type {
  DocumentChunk, ExtractedPage, GeneratedStudyMaterial, MaterialType, QuizAttempt, QuizDifficulty,
  QuizFrequency, QuizSchedule, StudyAiAnswer, StudyAiProviderRequest, StudyAiProviderResponse,
  StudyDocument, StudyQuiz,
} from './models';

type ProviderClient = (payload: StudyAiProviderRequest) => Promise<StudyAiProviderResponse>;

export class DocumentExtractionService {
  private readonly storage: StorageAdapter;
  constructor(storage: StorageAdapter = hasSupabaseConfiguration() ? supabaseStorageAdapter : mockStorageAdapter) { this.storage = storage; }
  async extract(document: StudyDocument, note: Note): Promise<ExtractedPage[]> {
    if (note.noteType === 'text') return [{ text: note.textContent, sectionTitle: note.title }];
    if (!note.filePath) throw new Error('The academic note has no stored file.');
    const blob = await this.storage.getFile(note.filePath);
    if (!blob) throw new Error('The original local file is unavailable. Upload it again from Academics.');
    const file = new File([blob], document.name, { type: document.mimeType });
    if (document.mimeType === 'application/pdf' || document.name.toLowerCase().endsWith('.pdf')) {
      try { return await extractPdf(file); } catch { /* The existing backend is the PDF fallback. */ }
    }
    if (/^(text\/plain|text\/markdown)$/.test(document.mimeType) || /\.(txt|md)$/i.test(document.name)) return [{ text: await blob.text(), sectionTitle: document.name }];
    const { extractStudyAiDocument } = await import('../../services/api');
    const response = await extractStudyAiDocument(blob, document.name);
    return response.data.pages;
  }
}

export class StudyAiGenerationService {
  private readonly provider: ProviderClient;

  constructor(provider?: ProviderClient) {
    this.provider = provider ?? (async (payload) => {
      const { generateGroundedStudyAiResponse } = await import('../../services/api');
      return (await generateGroundedStudyAiResponse(payload)).data;
    });
  }

  async generate(operation: StudyAiProviderRequest['operation'], chunks: DocumentChunk[], question?: string): Promise<StudyAiProviderResponse> {
    const response = await callProviderSafely(this.provider, { operation, ...(question ? { question } : {}), chunks: asProviderChunks(chunks) });
    if (!response) throw new Error(AI_UNAVAILABLE);
    return response;
  }
}

export interface StudyAiDashboard {
  subjects: Subject[];
  documents: StudyDocument[];
  answers: StudyAiAnswer[];
  materials: GeneratedStudyMaterial[];
  quizzes: StudyQuiz[];
  attempts: QuizAttempt[];
  dueSchedules: QuizSchedule[];
}

export class CampusStudyAiService {
  private readonly chunking = new DocumentChunkingService();
  private readonly retrieval = new StudyAiRetrievalService();
  private readonly evidence = new EvidenceValidationService();
  private readonly quizGeneration = new StudyQuizGenerationService();
  private readonly scoring = new QuizScoringService();

  private readonly documents: AcademicDocumentRepository;
  private readonly index: StudyAiDocumentIndexRepository;
  private readonly conversations: StudyAiConversationRepository;
  private readonly materials: GeneratedStudyMaterialRepository;
  private readonly quizzes: StudyQuizRepository;
  private readonly attempts: QuizAttemptRepository;
  private readonly schedules: QuizScheduleRepository;
  private readonly extraction: DocumentExtractionService;
  private readonly generation: StudyAiGenerationService;

  constructor(
    documents: AcademicDocumentRepository = hasSupabaseConfiguration() ? new SupabaseAcademicDocumentAdapter() : new LocalAcademicDocumentAdapter(),
    index: StudyAiDocumentIndexRepository = hasSupabaseConfiguration() ? new SupabaseStudyAiDocumentIndexRepository() : new LocalStudyAiDocumentIndexRepository(),
    conversations: StudyAiConversationRepository = hasSupabaseConfiguration() ? new SupabaseStudyAiConversationRepository() : new LocalStudyAiConversationRepository(),
    materials: GeneratedStudyMaterialRepository = hasSupabaseConfiguration() ? new SupabaseGeneratedStudyMaterialRepository() : new LocalGeneratedStudyMaterialRepository(),
    quizzes: StudyQuizRepository = hasSupabaseConfiguration() ? new SupabaseStudyQuizRepository() : new LocalStudyQuizRepository(),
    attempts: QuizAttemptRepository = hasSupabaseConfiguration() ? new SupabaseQuizAttemptRepository() : new LocalQuizAttemptRepository(),
    schedules: QuizScheduleRepository = hasSupabaseConfiguration() ? new SupabaseQuizScheduleRepository() : new LocalQuizScheduleRepository(),
    extraction = new DocumentExtractionService(),
    generation = new StudyAiGenerationService(),
  ) {
    this.documents = documents;
    this.index = index;
    this.conversations = conversations;
    this.materials = materials;
    this.quizzes = quizzes;
    this.attempts = attempts;
    this.schedules = schedules;
    this.extraction = extraction;
    this.generation = generation;
  }

  async dashboard(subjectId?: string, now = new Date()): Promise<StudyAiDashboard> {
    const [subjects, documents, answers, materials, quizzes, attempts, schedules] = await Promise.all([
      academicsService.getSubjects(), this.documents.list(subjectId), this.conversations.list(), this.materials.list(), this.quizzes.list(), this.attempts.list(), this.schedules.list(),
    ]);
    return { subjects, documents, answers, materials, quizzes, attempts, dueSchedules: schedules.filter((schedule) => new Date(schedule.nextDueAt).getTime() <= now.getTime()) };
  }

  async ensureIndexed(documentId: string): Promise<StudyDocument> {
    const document = (await this.documents.list()).find((item) => item.id === documentId);
    if (!document) throw new Error('Document not found in Academic Management.');
    const existing = await this.index.list([documentId]);
    if (document.extractionStatus === 'ready' && existing.length > 0) return document;
    const note = await this.documents.getSourceNote(documentId);
    if (!note) throw new Error('The linked academic note no longer exists.');
    try {
      const pages = await this.extraction.extract(document, note);
      if (!hasExtractableText(pages)) {
        await this.documents.setExtractionStatus(documentId, 'no_extractable_text');
        return { ...document, extractionStatus: 'no_extractable_text' };
      }
      const chunks = this.chunking.chunk(document, pages);
      await this.index.replace(documentId, chunks);
      await this.documents.setExtractionStatus(documentId, chunks.length ? 'ready' : 'no_extractable_text');
      return { ...document, extractionStatus: chunks.length ? 'ready' : 'no_extractable_text' };
    } catch (error) {
      await this.documents.setExtractionStatus(documentId, 'failed');
      throw error;
    }
  }

  private async scoped(subjectId: string, documentId: string | 'all'): Promise<{ documents: StudyDocument[]; chunks: DocumentChunk[] }> {
    const candidates = (await this.documents.list(subjectId)).filter((document) => documentId === 'all' || document.id === documentId);
    for (const document of candidates) {
      try { await this.ensureIndexed(document.id); } catch { /* Keep other documents usable in an all-documents scope. */ }
    }
    const documents = (await this.documents.list(subjectId)).filter((document) => (documentId === 'all' || document.id === documentId) && document.extractionStatus === 'ready');
    return { documents, chunks: await this.index.list(documents.map((document) => document.id)) };
  }

  async ask(subjectId: string, documentId: string | 'all', question: string): Promise<StudyAiAnswer> {
    const createdAt = new Date().toISOString();
    const base = { id: crypto.randomUUID(), question: question.trim(), createdAt };
    try {
      const scope = await this.scoped(subjectId, documentId);
      const retrieved = this.retrieval.retrieve(question, scope.chunks, scope.documents.map((document) => document.id));
      if (retrieved.length === 0) {
        const answer: StudyAiAnswer = { ...base, answer: INSUFFICIENT_EVIDENCE, evidenceStatus: 'insufficient_evidence', citations: [] };
        await this.conversations.save(answer);
        return answer;
      }
      let providerResponse: StudyAiProviderResponse;
      try { providerResponse = await this.generation.generate('answer', retrieved.map((result) => result.chunk), question); }
      catch {
        const answer: StudyAiAnswer = { ...base, answer: AI_UNAVAILABLE, evidenceStatus: 'ai_unavailable', citations: [] };
        await this.conversations.save(answer);
        return answer;
      }
      const citations = this.evidence.validate(providerResponse, retrieved.map((result) => result.chunk), scope.documents);
      const answer: StudyAiAnswer = citations
        ? { ...base, answer: providerResponse.answer.replace(/\s*\n+\s*/g, ' ').trim(), evidenceStatus: 'supported', citations }
        : { ...base, answer: INSUFFICIENT_EVIDENCE, evidenceStatus: 'insufficient_evidence', citations: [] };
      await this.conversations.save(answer);
      return answer;
    } catch {
      const answer: StudyAiAnswer = { ...base, answer: INSUFFICIENT_EVIDENCE, evidenceStatus: 'insufficient_evidence', citations: [] };
      await this.conversations.save(answer);
      return answer;
    }
  }

  async generateMaterial(subjectId: string, documentId: string, type: MaterialType): Promise<GeneratedStudyMaterial> {
    const scope = await this.scoped(subjectId, documentId);
    const chunks = scope.chunks.slice(0, 8);
    if (chunks.length === 0) throw new Error(INSUFFICIENT_EVIDENCE);
    let response: StudyAiProviderResponse;
    try { response = await this.generation.generate(type, chunks); }
    catch { throw new Error(AI_UNAVAILABLE); }
    const citations = this.evidence.validate(response, chunks, scope.documents);
    if (!citations) throw new Error(INSUFFICIENT_EVIDENCE);
    const lines = response.answer.split(/\n+/).map((line) => line.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
    const content = (lines.length ? lines : [response.answer]).map((text, index) => ({
      text,
      citationIds: type === 'summary' || citations.length === 1
        ? citations.map((citation) => citation.id)
        : [citations[Math.min(index, citations.length - 1)].id],
    }));
    const material: GeneratedStudyMaterial = { id: crypto.randomUUID(), documentId, subjectId, type, content, citations, createdAt: new Date().toISOString() };
    await this.materials.save(material);
    return material;
  }

  async generateQuiz(subjectId: string, documentId: string, frequency: QuizFrequency, count: number, difficulty: QuizDifficulty): Promise<StudyQuiz> {
    const scope = await this.scoped(subjectId, documentId);
    const document = scope.documents.find((item) => item.id === documentId);
    if (!document) throw new Error(INSUFFICIENT_EVIDENCE);
    const quiz = this.quizGeneration.generate(document, scope.chunks, Math.max(1, Math.min(20, count)), difficulty, frequency);
    if (quiz.questions.length === 0) throw new Error('The document does not contain enough distinct, cited facts for an MCQ quiz.');
    await this.quizzes.save(quiz);
    const next = new Date();
    next.setDate(next.getDate() + (frequency === 'daily' ? 1 : 7));
    await this.schedules.save({ id: `${subjectId}:${documentId}:${frequency}`, subjectId, documentId, frequency, questionCount: count, difficulty, lastGeneratedAt: quiz.createdAt, nextDueAt: next.toISOString() });
    return quiz;
  }

  async completeQuiz(quiz: StudyQuiz, answers: number[]): Promise<{ attempt: QuizAttempt; weakTopics: string[] }> {
    const attempt = this.scoring.score(quiz, answers);
    await this.attempts.save(attempt);
    return { attempt, weakTopics: weakTopics(quiz, attempt) };
  }

  async citationUrl(citation: StudyAiAnswer['citations'][number]): Promise<string | null> {
    const note = await this.documents.getSourceNote(citation.documentId);
    if (!note?.filePath) return null;
    const storage = hasSupabaseConfiguration() ? supabaseStorageAdapter : mockStorageAdapter;
    const url = await storage.getFileUrl(note.filePath);
    return url && citation.pageNumber ? `${url}#page=${citation.pageNumber}` : url;
  }
}

export const studyAiService = new CampusStudyAiService();
