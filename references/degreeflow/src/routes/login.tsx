import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — DegreeFlow" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn, signUp, signInWithGoogle, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/availability" });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) toast.error(error);
        else { toast.success("Welcome back"); navigate({ to: "/availability" }); }
      } else if (mode === "signup") {
        if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        const { error } = await signUp(email, password, fullName || undefined);
        if (error) toast.error(error);
        else toast.success("Check your email to confirm your account");
      } else {
        const { error } = await requestPasswordReset(email);
        if (error) toast.error(error);
        else { toast.success("Password reset email sent"); setMode("signin"); }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) { toast.error(error); setBusy(false); }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-background">
      <div className="mb-8">
        <Logo size="md" />
      </div>

      <div className="w-full max-w-md paper rounded-2xl border border-border shadow-sm p-8">
        <h1 className="font-display text-3xl text-ink">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to access your study plan." : mode === "signup" ? "Start planning smarter, in minutes." : "We'll email you a reset link."}
        </p>

        {mode !== "forgot" && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-ink/20 hover:bg-ink/5 text-sm font-medium disabled:opacity-50"
            >
              <GoogleIcon /> Continue with Google
            </button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Full name (optional)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={255}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={72}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-2.5 rounded-full bg-ink text-cream text-sm font-medium hover:bg-ink/90 disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        <div className="mt-5 text-xs text-muted-foreground flex flex-col gap-1 items-center">
          {mode === "signin" && (
            <>
              <button onClick={() => setMode("forgot")} className="hover:text-foreground">Forgot password?</button>
              <div>No account? <button onClick={() => setMode("signup")} className="text-accent hover:underline">Sign up</button></div>
            </>
          )}
          {mode === "signup" && (
            <div>Already have an account? <button onClick={() => setMode("signin")} className="text-accent hover:underline">Sign in</button></div>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("signin")} className="hover:text-foreground">Back to sign in</button>
          )}
        </div>
      </div>

      <Link to="/" className="mt-6 text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.45.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
