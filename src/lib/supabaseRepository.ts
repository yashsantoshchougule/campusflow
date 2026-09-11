import type { User } from '@supabase/supabase-js';

export const hasSupabaseConfiguration = () => typeof window !== 'undefined'
  && Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

export async function requireSupabaseUser(): Promise<User> {
  if (!hasSupabaseConfiguration()) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  const { supabase } = await import('./supabase.ts');
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Authentication required.');
  return data.user;
}

export async function getSupabase() {
  if (!hasSupabaseConfiguration()) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  return (await import('./supabase.ts')).supabase;
}
