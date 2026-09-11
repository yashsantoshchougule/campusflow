import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { exchangeGoogleCode } from "@/lib/google-calendar.functions";
import { consumeAndVerifyState, redirectUri, saveTokens } from "@/lib/google-calendar";

export const Route = createFileRoute("/oauth/google/callback")({
  head: () => ({ meta: [{ title: "Connecting Google Calendar — DegreeFlow" }] }),
  component: GoogleCallback,
});

function GoogleCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("Finishing Google sign-in…");

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const err = params.get("error");

      if (err) {
        setStatus("error");
        setMessage(`Google sign-in was cancelled or failed (${err}).`);
        return;
      }
      if (!code) {
        setStatus("error");
        setMessage("Missing authorization code from Google.");
        return;
      }
      if (!consumeAndVerifyState(state)) {
        setStatus("error");
        setMessage("Security check failed (state mismatch). Please try connecting again.");
        return;
      }
      try {
        const res = await exchangeGoogleCode({ data: { code, redirectUri: redirectUri() } });
        if (!res.ok) {
          setStatus("error");
          setMessage(res.error || "Could not exchange Google authorization code.");
          return;
        }
        await saveTokens({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
          expires_at: Date.now() + res.expires_in * 1000,
        });
        setStatus("ok");
        setMessage("Google Calendar connected. Redirecting…");
        setTimeout(() => navigate({ to: "/calendar" }), 800);
      } catch (e) {
        setStatus("error");
        setMessage((e as Error).message);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="paper rounded-2xl border border-border p-8 max-w-md text-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Google Calendar</div>
        <h1 className="font-display text-2xl text-ink mt-1">
          {status === "working" ? "Connecting…" : status === "ok" ? "Connected" : "Connection failed"}
        </h1>
        <p className="text-sm text-muted-foreground mt-3">{message}</p>
        {status === "error" && (
          <button
            onClick={() => navigate({ to: "/calendar" })}
            className="mt-5 px-4 py-2 rounded-full bg-ink text-cream text-sm"
          >
            Back to calendar
          </button>
        )}
      </div>
    </div>
  );
}
