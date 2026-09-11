/**
 * Chunk/retrieve flow adapted from RAG_v2 Ingestion/ingestion.py and Qa/query.py
 * (Copyright 2026 Prateek Saha, Apache-2.0). Quiz validation/orchestration adapted
 * from HyDrSnic/Quiz-Generator (MIT as declared by its package.json/README) and
 * deterministic generation/scoring from MK-QuizFlow (Copyright 2026 Kazi Musharraf, MIT).
 * All code here was rewritten for CampusFlow TypeScript and citation-first local data.
 */
import type {
  DocumentChunk, EvidenceCitation, ExtractedPage, ProviderChunk, QuizAttempt, QuizDifficulty,
  QuizFrequency, QuizQuestion, RetrievalResult, StudyAiProviderRequest, StudyAiProviderResponse, StudyDocument, StudyQuiz,
} from './models';

export const INSUFFICIENT_EVIDENCE = 'Not available in the uploaded material.';
export const AI_UNAVAILABLE = 'AI is currently unavailable.';
export const MIN_RELEVANCE_SCORE = 0.34;
const INJECTION_LINE = /(?:ignore|disregard)\s+(?:all|any|the|previous)|(?:system|developer|assistant)\s*(?:prompt|message|instruction)|do not follow the application/i;
const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'what', 'when', 'where', 'which', 'who', 'why', 'with']);

export function sanitizeDocumentText(text: string): string {
  return text.split(/\r?\n/).filter((line) => !INJECTION_LINE.test(line)).join('\n').replaceAll(String.fromCharCode(0), '').trim();
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokens(value: string): string[] {
  return [...new Set(normalize(value).split(' ').filter((word) => word.length > 1 && !STOP_WORDS.has(word)))];
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(36);
}

function heading(line: string): string | undefined {
  const markdown = line.match(/^#{1,6}\s+(.{2,120})$/)?.[1]?.trim();
  if (markdown) return markdown;
  const trimmed = line.trim();
  return trimmed.length >= 3 && trimmed.length <= 80 && (/^[A-Z][A-Z\d\s&/-]+$/.test(trimmed) || trimmed.endsWith(':')) ? trimmed.replace(/:$/, '') : undefined;
}

export function chunkDocument(document: StudyDocument, pages: ExtractedPage[], targetWords = 120, overlapWords = 20): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let order = 0;
  for (const page of pages) {
    let sectionTitle = page.sectionTitle;
    let sectionText = '';
    const flush = () => {
      const words = sanitizeDocumentText(sectionText).split(/\s+/).filter(Boolean);
      const step = Math.max(1, targetWords - overlapWords);
      for (let start = 0; start < words.length; start += step) {
        const text = words.slice(start, start + targetWords).join(' ').trim();
        if (!text) continue;
        chunks.push({ id: `${document.id}:v${document.version}:${order}`, documentId: document.id, text, ...(page.pageNumber ? { pageNumber: page.pageNumber } : {}), ...(sectionTitle ? { sectionTitle } : {}), order });
        order += 1;
        if (start + targetWords >= words.length) break;
      }
      sectionText = '';
    };
    for (const line of page.text.split(/\r?\n/)) {
      const nextHeading = heading(line);
      if (nextHeading) {
        flush();
        sectionTitle = nextHeading;
      } else if (!INJECTION_LINE.test(line)) sectionText += `${line}\n`;
    }
    flush();
  }
  return chunks;
}

export function retrieveRelevantChunks(question: string, chunks: DocumentChunk[], documentIds: string[], threshold = MIN_RELEVANCE_SCORE, limit = 4): RetrievalResult[] {
  const queryTokens = tokens(question);
  if (queryTokens.length === 0) return [];
  const allowed = new Set(documentIds);
  return chunks.filter((chunk) => allowed.has(chunk.documentId)).map((chunk) => {
    const source = new Set(tokens(chunk.text));
    const exactMatches = queryTokens.filter((token) => source.has(token)).length;
    const partialMatches = queryTokens.filter((token) => !source.has(token) && [...source].some((word) => word.startsWith(token) || token.startsWith(word))).length;
    return { chunk, score: (exactMatches + partialMatches * 0.5) / queryTokens.length };
  }).filter((result) => result.score >= threshold).sort((a, b) => b.score - a.score || a.chunk.order - b.chunk.order || a.chunk.id.localeCompare(b.chunk.id)).slice(0, limit);
}

export function citationFor(chunk: DocumentChunk, documents: StudyDocument[]): EvidenceCitation | null {
  const document = documents.find((item) => item.id === chunk.documentId);
  if (!document) return null;
  return {
    id: `citation:${chunk.id}`,
    documentId: chunk.documentId,
    documentName: document.name,
    chunkId: chunk.id,
    ...(chunk.pageNumber ? { pageNumber: chunk.pageNumber } : {}),
    ...(chunk.sectionTitle ? { sectionTitle: chunk.sectionTitle } : {}),
    excerpt: chunk.text.slice(0, 240),
  };
}

export function validateProviderEvidence(response: StudyAiProviderResponse, retrieved: DocumentChunk[], documents: StudyDocument[]): EvidenceCitation[] | null {
  if (response.evidenceStatus !== 'supported' || !response.answer.trim() || response.citationChunkIds.length === 0) return null;
  const allowed = new Map(retrieved.map((chunk) => [chunk.id, chunk]));
  const citations = [...new Set(response.citationChunkIds)].map((id) => allowed.get(id)).filter((chunk): chunk is DocumentChunk => Boolean(chunk)).map((chunk) => citationFor(chunk, documents)).filter((citation): citation is EvidenceCitation => Boolean(citation));
  return citations.length === response.citationChunkIds.length ? citations : null;
}

function sentenceCandidates(chunk: DocumentChunk): string[] {
  return sanitizeDocumentText(chunk.text).split(/(?<=[.!?])\s+/).map((value) => value.trim()).filter((value) => value.length >= 40 && value.length <= 280);
}

function termFromSentence(sentence: string): string | null {
  const definition = sentence.match(/^(.{2,60}?)\s+(?:is|are|means|refers to|is defined as)\s+/i)?.[1]?.replace(/^(the|a|an)\s+/i, '').trim();
  if (definition && definition.split(/\s+/).length <= 6) return definition;
  const words = tokens(sentence).filter((word) => word.length >= 4).sort((a, b) => b.length - a.length || a.localeCompare(b));
  return words[0] ?? null;
}

function deterministicShuffle(values: string[], seed: string): string[] {
  return [...values].map((value) => ({ value, key: stableHash(`${seed}:${value}`) })).sort((a, b) => a.key.localeCompare(b.key)).map((item) => item.value);
}

export function validateQuizQuestion(question: QuizQuestion, chunks: DocumentChunk[]): boolean {
  if (question.options.length !== 4 || question.correctOptionIndex < 0 || question.correctOptionIndex > 3 || new Set(question.options.map(normalize)).size !== 4 || question.citations.length === 0) return false;
  const correct = normalize(question.options[question.correctOptionIndex] ?? '');
  return question.citations.every((citation) => {
    const chunk = chunks.find((item) => item.id === citation.chunkId && item.documentId === citation.documentId);
    return Boolean(chunk && normalize(chunk.text).includes(correct) && chunk.text.includes(citation.excerpt));
  });
}

export function generateGroundedQuiz(document: StudyDocument, chunks: DocumentChunk[], count: number, difficulty: QuizDifficulty, frequency?: QuizFrequency): StudyQuiz {
  const candidates = chunks.flatMap((chunk) => sentenceCandidates(chunk).map((sentence) => ({ chunk, sentence, term: termFromSentence(sentence) }))).filter((item): item is { chunk: DocumentChunk; sentence: string; term: string } => Boolean(item.term));
  const termPool = [...new Set(candidates.map((item) => item.term))];
  const questions: QuizQuestion[] = [];
  const used = new Set<string>();
  for (const candidate of candidates) {
    if (questions.length >= count) break;
    const distractors = termPool.filter((term) => normalize(term) !== normalize(candidate.term)).slice(0, 3);
    if (distractors.length < 3) continue;
    const options = deterministicShuffle([candidate.term, ...distractors], candidate.sentence);
    const question: QuizQuestion = {
      id: `question:${stableHash(`${candidate.chunk.id}:${candidate.sentence}`)}`,
      question: `Which term is described by this sourced statement? “${candidate.sentence}”`,
      options,
      correctOptionIndex: options.indexOf(candidate.term),
      explanation: `The source directly identifies ${candidate.term} in the cited statement.`,
      citations: [citationFor(candidate.chunk, [document])].filter((item): item is EvidenceCitation => Boolean(item)),
    };
    const key = normalize(question.question);
    if (!used.has(key) && validateQuizQuestion(question, chunks)) {
      used.add(key);
      questions.push(question);
    }
  }
  return { id: `quiz:${stableHash(`${document.id}:${document.version}:${difficulty}:${count}:${frequency ?? ''}:${chunks.map((chunk) => chunk.id).join('|')}`)}`, documentId: document.id, subjectId: document.subjectId, ...(frequency ? { frequency } : {}), difficulty, questions, createdAt: new Date().toISOString() };
}

export function scoreQuiz(quiz: StudyQuiz, answers: number[], completedAt = new Date().toISOString()): QuizAttempt {
  const score = quiz.questions.reduce((total, question, index) => total + (answers[index] === question.correctOptionIndex ? 1 : 0), 0);
  return { id: crypto.randomUUID(), quizId: quiz.id, answers, score, percentage: quiz.questions.length === 0 ? 0 : Math.round((score / quiz.questions.length) * 100), completedAt };
}

export function weakTopics(quiz: StudyQuiz, attempt: QuizAttempt): string[] {
  return [...new Set(quiz.questions.filter((question, index) => attempt.answers[index] !== question.correctOptionIndex).map((question) => question.citations[0]?.sectionTitle ?? question.citations[0]?.documentName).filter((value): value is string => Boolean(value)))];
}

export class DocumentChunkingService {
  chunk(document: StudyDocument, pages: ExtractedPage[]) { return chunkDocument(document, pages); }
}

export class StudyAiRetrievalService {
  retrieve(question: string, chunks: DocumentChunk[], documentIds: string[]) { return retrieveRelevantChunks(question, chunks, documentIds); }
}

export class EvidenceValidationService {
  validate(response: StudyAiProviderResponse, chunks: DocumentChunk[], documents: StudyDocument[]) { return validateProviderEvidence(response, chunks, documents); }
}

export class StudyQuizGenerationService {
  generate(document: StudyDocument, chunks: DocumentChunk[], count: number, difficulty: QuizDifficulty, frequency?: QuizFrequency) { return generateGroundedQuiz(document, chunks, count, difficulty, frequency); }
}

export class QuizScoringService {
  score(quiz: StudyQuiz, answers: number[]) { return scoreQuiz(quiz, answers); }
}

export const asProviderChunks = (chunks: DocumentChunk[]): ProviderChunk[] => chunks.map(({ id, text }) => ({ id, text }));

export async function callProviderSafely(provider: (payload: StudyAiProviderRequest) => Promise<StudyAiProviderResponse>, payload: StudyAiProviderRequest): Promise<StudyAiProviderResponse | null> {
  try { return await provider(payload); } catch { return null; }
}
