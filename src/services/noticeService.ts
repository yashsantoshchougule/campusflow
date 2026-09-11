import { supabase } from '../lib/supabase';

export const getImportantNotices = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { data, error } = await supabase.from('notices').select('*').limit(50);
  if (error) throw error;
  const recent = Date.now() - 7 * 86400000;
  const deadline = (notice: Record<string, unknown>) => String(notice.deadline ?? notice.deadline_at ?? '9999-12-31');
  return data.filter((notice) => notice.important || ['high', 'urgent'].includes(notice.priority) || new Date(String(notice.published_at ?? notice.created_at)).getTime() >= recent || Boolean(notice.deadline ?? notice.deadline_at) && new Date(deadline(notice)).getTime() >= Date.now()).sort((a, b) => deadline(a).localeCompare(deadline(b))).slice(0, 10);
};
