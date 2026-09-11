import api from './api';
import { supabase } from '../lib/supabase';
import type { StudyTaskInput } from '../types/dashboard';

export const getStudyTasks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { data, error } = await supabase.from('study_tasks').select('*').eq('user_id', user.id).order('due_at');
  if (error) throw error;
  return data;
};
export const createStudyTask = (input: StudyTaskInput) => api.post('/api/study-tasks', input).then(({ data }) => data);
export const updateStudyTask = (id: string, updates: Partial<StudyTaskInput> & { completed?: boolean }) => api.patch(`/api/study-tasks/${id}`, updates).then(({ data }) => data);
export const setStudyTaskCompleted = (id: string, completed: boolean) => updateStudyTask(id, { completed });
