import { Question } from "../../models/Question.js";
import { SESSION_EXPIRY_HOURS } from "../../config/env.js";

export async function runAssembler(questions, quizId, sessionId) {
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
  );

  const questionDocs = questions.map((q, idx) => ({
    quizId,
    sessionId,
    type: "mcq",
    question: q.question,
    options: q.options,
    correctAnswerIndex: q.correctAnswerIndex,
    explanation: q.explanation,
    difficulty: q.difficulty,
    tags: q.tags || [],
    citations: q.citations,
    orderIndex: idx,
    expiresAt,
  }));

  await Question.insertMany(questionDocs);
}
