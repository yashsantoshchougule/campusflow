export interface Folder {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
  folder?: Folder;
  model_used?: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  type: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  pinned: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  todo_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatRequest {
  message: string;
  conversation_history: ChatMessage[];
  use_rag?: boolean;
  folder_ids?: string[];
  note_ids?: string[];
  isolate_message?: boolean;
}

export interface AssistantChatResponse {
  response: string;
  model_used: string;
  fallback_used: boolean;
  source_citations: string[];
  generated_at: string;
  sources?: Note[];
}

// Change this to match your backend return key
export interface Pen2PDFExtractResponse {
  markdown: string;
  files_processed: number;
}

export interface Pen2PDFExportRequest {
  markdown: string;
  format: 'pdf' | 'docx' | 'markdown';
  title?: string;
}

export interface NoteGenerateRequest {
  file: File;
  folder_id?: string;
  title?: string;
}

export interface NoteGenerateResponse {
  note: Note;
  model_used: string;
  fallback_used: boolean;
  source_citations: string[];
  generated_at: string;
  processing_time?: number;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
