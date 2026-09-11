import { useState } from 'react';
import { AuthFrame, FormNotice } from '../components/auth/AuthFrame';
import { useAuth } from '../hooks/useAuth';

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true); setMessage('');
    try { await requestPasswordReset(email.trim()); setMessage('If an account exists, a password-reset email has been sent.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to request a password reset.'); }
    finally { setPending(false); }
  };
  return <AuthFrame title="Reset password" subtitle="We will send a secure recovery link to your email.">
    <form onSubmit={(event) => void submit(event)} className="form-stack">
      <label>Email<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      {message && <FormNotice message={message} kind={message.startsWith('If ') ? 'success' : 'error'} />}
      <button disabled={pending} type="submit">{pending ? 'Sending…' : 'Send recovery link'}</button>
    </form>
    <p className="form-links"><a href="/login">Back to sign in</a></p>
  </AuthFrame>;
}
