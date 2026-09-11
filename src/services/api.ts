import axios from 'axios';
import { supabase } from '../lib/supabase';
import type {
  Folder,
  Note,
  TimetableEntry,
  Todo,
  Subtask,
  AssistantChatRequest,
  AssistantChatResponse,
  Pen2PDFExtractResponse,
  NoteGenerateResponse,
  ChatMessage,
} from '../types';
import type { ExtractedPage, StudyAiProviderRequest, StudyAiProviderResponse } from '../features/studyAi/models';
import type { NoticeExtractionResponse } from '../features/notices/models';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8003' });

export const extractNoticeSource = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<NoticeExtractionResponse>('/api/notices/extract', formData);
};

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session) config.headers.Authorization = `Bearer ${data.session.access_token}`;
  return config;
});

const response = <T>(data: T | null, error: { message: string } | null) => {
  if (error) throw error;
  return { data: data as T };
};

export const getFolders = async () => {
  const { data, error } = await supabase.from('note_folders').select('*').order('created_at');
  return response<Folder[]>(data, error);
};

export const createFolder = async (values: { name: string; color: string }) => {
  const { data, error } = await supabase.from('note_folders').insert(values).select().single();
  return response<Folder>(data, error);
};

export const updateFolder = async (id: string, values: { name?: string; color?: string }) => {
  const { data, error } = await supabase.from('note_folders').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return response<Folder>(data, error);
};

export const deleteFolder = async (id: string) => {
  const { error } = await supabase.from('note_folders').delete().eq('id', id);
  return response(null, error);
};

export const getNotes = async (folderId?: string) => {
  let query = supabase.from('notes').select('*');
  if (folderId) query = query.eq('folder_id', folderId);
  const { data, error } = await query.order('updated_at', { ascending: false });
  return response<Note[]>(data, error);
};

export const createNote = async (values: { title: string; content: string; folder_id?: string }) => {
  const { data, error } = await supabase.from('notes').insert({ ...values, folder_id: values.folder_id ?? null }).select().single();
  return response<Note>(data, error);
};

export const updateNote = async (id: string, values: { title?: string; content?: string; folder_id?: string }) => {
  const { data, error } = await supabase.from('notes').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return response<Note>(data, error);
};

export const deleteNote = async (id: string) => {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  return response(null, error);
};

export const getTimetable = async () => {
  const { data, error } = await supabase.from('studybuddy_timetable_entries').select('*').order('start_time');
  return response<TimetableEntry[]>(data, error);
};

type TimetableInput = Omit<TimetableEntry, 'id' | 'created_at' | 'updated_at'>;

export const createTimetableEntry = async (values: TimetableInput) => {
  const { data, error } = await supabase.from('studybuddy_timetable_entries').insert(values).select().single();
  return response<TimetableEntry>(data, error);
};

export const updateTimetableEntry = async (id: string, values: Partial<TimetableInput>) => {
  const { data, error } = await supabase.from('studybuddy_timetable_entries').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return response<TimetableEntry>(data, error);
};

export const deleteTimetableEntry = async (id: string) => {
  const { error } = await supabase.from('studybuddy_timetable_entries').delete().eq('id', id);
  return response(null, error);
};

export const getTodos = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { data, error } = await supabase.from('todos').select('*, subtasks:todo_subtasks(*)').eq('user_id', user.id).order('created_at', { ascending: false });
  return response<Todo[]>(data, error);
};

export const createTodo = async (values: { title: string; description?: string; due_date?: string | null }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { data, error } = await supabase.from('todos').insert({ ...values, user_id: user.id }).select().single();
  return response<Todo>(data, error);
};

type TodoUpdate = Partial<Pick<Todo, 'title' | 'description' | 'completed' | 'pinned' | 'due_date'>>;

export const updateTodo = async (id: string, values: TodoUpdate) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { data, error } = await supabase.from('todos').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (!data && !error) throw new Error('Todo not found');
  return response<Todo>(data, error);
};

export const deleteTodo = async (id: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', user.id);
  return response(null, error);
};

export const createSubtask = async (todoId: string, values: { title: string }) => {
  const { data, error } = await supabase.from('todo_subtasks').insert({ ...values, todo_id: todoId }).select().single();
  return response<Subtask>(data, error);
};

export const updateSubtask = async (_todoId: string, subtaskId: string, values: { title?: string; completed?: boolean }) => {
  const { data, error } = await supabase.from('todo_subtasks').update({ ...values, updated_at: new Date().toISOString() }).eq('id', subtaskId).select().single();
  return response<Subtask>(data, error);
};

export const deleteSubtask = async (_todoId: string, subtaskId: string) => {
  const { error } = await supabase.from('todo_subtasks').delete().eq('id', subtaskId);
  return response(null, error);
};

const mimeType = (file: File) => file.type || ({ md: 'text/markdown', txt: 'text/plain', csv: 'text/csv' }[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream');

const storeDocument = async (file: File, documentType: 'notes' | 'other') => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in before uploading files');
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Files must be between 1 byte and 10 MB');

  const path = `${session.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const type = mimeType(file);
  const { error: uploadError } = await supabase.storage.from('student-documents').upload(path, file, { contentType: type });
  if (uploadError) throw uploadError;

  const { error } = await supabase.from('documents').insert({
    source_module: documentType === 'notes' ? 'Notes' : 'Pen2PDF',
    file_name: file.name.slice(0, 255),
    storage_bucket: 'student-documents',
    storage_path: path,
    mime_type: type,
    file_size: file.size,
  });
  if (error) {
    await supabase.storage.from('student-documents').remove([path]);
    throw error;
  }
};

const storeFormFiles = async (formData: FormData, documentType: 'notes' | 'other') => {
  const files: File[] = [];
  formData.forEach((value) => { if (value instanceof File) files.push(value); });
  await Promise.all(files.map((file) => storeDocument(file, documentType)));
};

export const generateNotes = async (formData: FormData) => {
  const result = await api.post<NoteGenerateResponse>('/api/notes/generate', formData);
  await storeFormFiles(formData, 'notes');
  return result;
};

export const formatNotes = (values: { content: string }) => api.post<{ content: string; error?: string }>('/api/notes/format', values);

let chatSession: { userId: string; id: string } | undefined;

const getChatSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in to use chat');
  if (chatSession?.userId === session.user.id) return chatSession.id;

  const existing = await supabase.from('chat_sessions').select('id').order('created_at').limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return (chatSession = { userId: session.user.id, id: existing.data.id }).id;

  const created = await supabase.from('chat_sessions').insert({ title: 'Isabella' }).select('id').single();
  if (created.error) throw created.error;
  return (chatSession = { userId: session.user.id, id: created.data.id }).id;
};

export const getChatMessages = async (limit = 15) => {
  const sessionId = await getChatSession();
  const { data, error } = await supabase.from('chat_messages').select('role, content').eq('session_id', sessionId).in('role', ['user', 'assistant']).order('created_at', { ascending: false }).limit(limit);
  return response<ChatMessage[]>(data?.reverse() as ChatMessage[] | undefined ?? null, error);
};

export const chatWithAssistant = async (values: AssistantChatRequest) => {
  const formData = new FormData();
  formData.append('message', values.message);
  formData.append('chat_history', JSON.stringify(values.conversation_history));
  formData.append('use_rag', String(values.use_rag ?? false));
  formData.append('isolate_message', String(values.isolate_message ?? false));

  if (values.note_ids?.length) {
    const { data, error } = await supabase.from('notes').select('title, content').in('id', values.note_ids);
    if (error) throw error;
    formData.append('context_notes', data.map((note) => `[Note: ${note.title}]\n${note.content}`).join('\n\n'));
  }

  const result = await api.post<AssistantChatResponse>('/api/assistant/chat', formData);
  try {
    const sessionId = await getChatSession();
    const { error } = await supabase.from('chat_messages').insert([
      { session_id: sessionId, role: 'user', content: values.message },
      { session_id: sessionId, role: 'assistant', content: result.data.response },
    ]);
    if (error) console.warn('Chat history was not saved:', error.message);
  } catch (error) {
    console.warn('Chat history was not saved:', error);
  }
  return result;
};

export const extractPen2PDF = async (formData: FormData) => {
  const result = await api.post<Pen2PDFExtractResponse>('/api/pen2pdf/extract', formData);
  await storeFormFiles(formData, 'other');
  return result;
};

export const exportPen2PDF = (formData: FormData) => api.post('/api/pen2pdf/export', formData, { responseType: 'blob' });

export const exportFolderAsZip = async (folderId: string, format: string) => {
  const [folder, notes] = await Promise.all([
    supabase.from('note_folders').select('name').eq('id', folderId).single(),
    supabase.from('notes').select('title, content').eq('folder_id', folderId),
  ]);
  if (folder.error) throw folder.error;
  if (notes.error) throw notes.error;
  return api.post('/api/notes/export-zip', { folder_name: folder.data.name, notes: notes.data, format }, { responseType: 'blob' });
};

export const importTimetable = async (formData: FormData) => {
  const parsed = await api.post<{ entries: TimetableInput[] }>('/api/timetable/import', formData);
  const { error } = await supabase.from('studybuddy_timetable_entries').insert(parsed.data.entries);
  if (error) throw error;
  return { data: { message: 'Timetable imported', entries_created: parsed.data.entries.length } };
};

export const extractStudyAiDocument = (file: Blob, fileName: string) => {
  const formData = new FormData();
  formData.append('file', file, fileName);
  return api.post<{ status: 'ready' | 'no_extractable_text'; pages: ExtractedPage[]; message?: string }>('/api/study-ai/extract', formData);
};

export const generateGroundedStudyAiResponse = (payload: StudyAiProviderRequest) =>
  api.post<StudyAiProviderResponse>('/api/study-ai/generate', payload);

export default api;
