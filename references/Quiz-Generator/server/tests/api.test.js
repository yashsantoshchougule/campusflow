import request from "supertest";
import express from "express";
import sessionsRouter from "../src/routes/sessions.js";
import documentsRouter from "../src/routes/documents.js";
import quizzesRouter from "../src/routes/quizzes.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

// Mock app
const app = express();
app.use(express.json());
app.use("/api/sessions", sessionsRouter);
app.use("/api/docs", documentsRouter);
app.use("/api", quizzesRouter);
app.use(errorHandler);

describe("API Tests", () => {
  let sessionId;

  test("should create session", async () => {
    const res = await request(app).post("/api/sessions").expect(200);

    expect(res.body.sessionId).toBeDefined();
    expect(res.body.sessionId).toMatch(/^sess_/);
    sessionId = res.body.sessionId;
  });

  test("should upload document", async () => {
    const txtContent =
      "This is a test document with some content for quiz generation.";

    const res = await request(app)
      .post("/api/docs/upload")
      .set("x-session-id", sessionId)
      .attach("file", Buffer.from(txtContent), "test.txt")
      .expect(200);

    expect(res.body.documentId).toBeDefined();
    expect(res.body.filename).toBe("test.txt");
  });

  // Note: Full quiz generation test would require mocking AI provider
  // or using actual API keys in test environment
});
