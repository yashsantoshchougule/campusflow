import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured. Add it as a server secret.`);
  return v;
}

/**
 * Exchange an OAuth authorization code for access + refresh tokens.
 * Runs server-side so GOOGLE_CLIENT_SECRET is never exposed to the browser.
 */
export const exchangeGoogleCode = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      code: z.string().min(1).max(2048),
      redirectUri: z.string().url().max(512),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const clientId = requireEnv("GOOGLE_CLIENT_ID");
    const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

    const body = new URLSearchParams({
      code: data.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: data.redirectUri,
      grant_type: "authorization_code",
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = await res.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      token_type?: string;
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !json.access_token) {
      return { ok: false as const, error: json.error_description || json.error || `Token exchange failed (${res.status})` };
    }
    return {
      ok: true as const,
      access_token: json.access_token,
      refresh_token: json.refresh_token ?? null,
      expires_in: json.expires_in ?? 3600,
      scope: json.scope ?? "",
    };
  });

/**
 * Refresh an expired access token using a refresh token.
 */
export const refreshGoogleAccessToken = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      refreshToken: z.string().min(1).max(2048),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const clientId = requireEnv("GOOGLE_CLIENT_ID");
    const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refreshToken,
      grant_type: "refresh_token",
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = await res.json() as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !json.access_token) {
      return { ok: false as const, error: json.error_description || json.error || `Token refresh failed (${res.status})` };
    }
    return {
      ok: true as const,
      access_token: json.access_token,
      expires_in: json.expires_in ?? 3600,
    };
  });

/**
 * Expose the public Client ID to the browser for building the OAuth URL,
 * without ever shipping the secret. Reads server env at call time.
 */
export const getGoogleClientId = createServerFn({ method: "GET" }).handler(async () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  return { clientId: clientId ?? null };
});
