import { api } from "../api/client";

export async function initSession() {
  let sessionId = localStorage.getItem("sessionId");

  if (!sessionId) {
    try {
      const res = await api.createSession();
      sessionId = res.data.sessionId;
      localStorage.setItem("sessionId", sessionId);
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }

  return sessionId;
}

export function getSessionId() {
  return localStorage.getItem("sessionId");
}
