import { supabase } from '../lib/supabase';

type SignUpInput = { fullName: string; email: string; password: string };

export function useAuth() {
  return {
    async signIn(email: string, password: string) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signInWithGoogle() {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } });
      if (error) throw error;
    },
    async signUp({ fullName, email, password }: SignUpInput) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
    },
    async requestPasswordReset(email: string) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
    },
    async updateRecoveredPassword(password: string) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    async changePassword(currentPassword: string, password: string) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.email) throw new Error('Password changes require an email/password account.');
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (reauthError) throw new Error('Current password could not be verified.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    async signOutEverywhere() {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
    },
    async deleteAccount(currentPassword: string, confirmation: string) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user?.email) throw new Error('Account deletion requires an email/password account.');
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (reauthError) throw new Error('Current password could not be verified.');
      const { data, error } = await supabase.functions.invoke('campusflow-admin', { body: { action: 'delete_my_account', confirmation } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
  };
}
