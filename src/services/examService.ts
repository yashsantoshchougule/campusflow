import { supabase } from '../lib/supabase';

export const getUpcomingExams = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { data, error } = await supabase.from('examinations').select('*');
  if (error) throw error;
  const startsAt = (exam: Record<string, unknown>) => String(exam.starts_at ?? `${exam.exam_date}T${exam.start_time ?? '00:00:00'}`);
  return data.filter((exam) => new Date(startsAt(exam)).getTime() >= Date.now()).sort((a, b) => startsAt(a).localeCompare(startsAt(b)));
};
