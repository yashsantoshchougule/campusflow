import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_URL,
});

// Add session ID to all requests
client.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem("sessionId");
  if (sessionId) {
    config.headers["x-session-id"] = sessionId;
  }
  return config;
});

export const api = {
  // Sessions
  createSession: () => client.post("/sessions"),

  // Documents
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return client.post("/docs/upload", formData);
  },
  getDocuments: () => client.get("/docs"),
  getDocument: (id) => client.get(`/docs/${id}`),

  // Quizzes
  createQuiz: (documentId, params) =>
    client.post("/quizzes", { documentId, params }),
  getJob: (jobId) => client.get(`/jobs/${jobId}`),
  getQuiz: (quizId) => client.get(`/quizzes/${quizId}`),
  submitQuiz: (quizId, answers) =>
    client.post(`/quizzes/${quizId}/submit`, { answers }),
  getReview: (quizId) => client.get(`/quizzes/${quizId}/review`),
};
