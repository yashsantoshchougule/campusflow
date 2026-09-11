import { supabase } from '../lib/supabase';

export const getTodayTimetable = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const primary = await supabase.from('timetable_entries').select('*').order('start_time');
  if (primary.error) throw primary.error;
  let data = primary.data;
  if (!data.length) {
    const legacy = await supabase.from('studybuddy_timetable_entries').select('*').order('start_time');
    if (legacy.error) throw legacy.error;
    data = legacy.data;
  }
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const dayNumber = (now.getDay() + 7) % 7;
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return data.filter((entry) => entry.day === today || entry.day_of_week === dayNumber || entry.specific_date === localDate);
};

export const getTimetableEntries = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  const { data, error } = await supabase.from('timetable_entries').select('*').order('day').order('start_time');
  if (error) throw error;
  return data;
};
