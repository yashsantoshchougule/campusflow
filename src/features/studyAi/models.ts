export type EvidenceStatus = 'supported' | 'insufficient_evidence' | 'ai_unavailable';
export type MaterialType = 'summary' | 'key_points' | 'definitions' | 'formulas' | 'revision_questions';
export type QuizFrequency = 'daily' | 'weekly';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface StudyDocument {
  id: string;
  subjectId: string;
  sourceNoteId?: string;
  name: string;
  mimeType: string;
  version: number;
  extractionStatus: 'pending' | 'ready' | 'failed' | 'no_extractable_text';
  createdAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  text: string;
  pageNumber?: number;
  sectionTitle?: string;
  order: number;
}

export interface EvidenceCitation {
  id: string;
  documentId: string;
  documentName: string;
  chunkId: string;
  pageNumber?: number;
  sectionTitle?: string;
  excerpt: string;
}

export interface StudyAiAnswer {
  id: string;
  question: string;
  answer: string;
  evidenceStatus: EvidenceStatus;
  citations: EvidenceCitation[];
  createdAt: string;
}

export interface GeneratedMaterialSection {
  text: string;
  citationIds: string[];
}

export interface GeneratedStudyMaterial {
  id: string;
  documentId: string;
  subjectId: string;
  type: MaterialType;
  content: GeneratedMaterialSection[];
  citations: EvidenceCitation[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  citations: EvidenceCitation[];
}

export interface StudyQuiz {
  id: string;
  documentId: string;
  subjectId: string;
  frequency?: QuizFrequency;
  difficulty: QuizDifficulty;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  answers: number[];
  score: number;
  percentage: number;
  completedAt: string;
}

export interface QuizSchedule {
  id: string;
  subjectId: string;
  documentId: string;
  frequency: QuizFrequency;
  questionCount: number;
  difficulty: QuizDifficulty;
  lastGeneratedAt: string;
  nextDueAt: string;
}

export interface ExtractedPage {
  text: string;
  pageNumber?: number;
  sectionTitle?: string;
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  score: number;
}

export interface ProviderChunk {
  id: string;
  text: string;
}

export interface StudyAiProviderRequest {
  operation: 'answer' | MaterialType;
  question?: string;
  chunks: ProviderChunk[];
}

export interface StudyAiProviderResponse {
  answer: string;
  citationChunkIds: string[];
  evidenceStatus: EvidenceStatus;
}
