import { useState } from 'react';
import { AuthFrame, FormNotice } from '../components/auth/AuthFrame';
import { useAuth } from '../hooks/useAuth';

export function ResetPasswordPage() {
  const { updateRecoveredPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setMessage('Use a password with at least 8 characters.');
    if (password !== confirmPassword) return setMessage('Passwords do not match.');
    setPending(true); setMessage('');
    try { await updateRecoveredPassword(password); setMessage('Password updated. You can now sign in.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'The recovery link is invalid or expired.'); }
    finally { setPending(false); }
  };
  return <AuthFrame title="Choose a new password" subtitle="This link authorizes one password update.">
    <form onSubmit={(event) => void submit(event)} className="form-stack">
      <label>New password<input autoComplete="new-password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <label>Confirm password<input autoComplete="new-password" type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
      {message && <FormNotice message={message} kind={message.startsWith('Password updated') ? 'success' : 'error'} />}
      <button disabled={pending} type="submit">{pending ? 'Updating…' : 'Update password'}</button>
    </form>
  </AuthFrame>;
}
