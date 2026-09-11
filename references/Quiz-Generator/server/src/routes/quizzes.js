import express from "express";
import { requireSession } from "../middleware/auth.js";
import {
  quizParamsValidator,
  submitAnswersValidator,
} from "../middleware/validator.js";
import { Quiz } from "../models/Quiz.js";
import { Question } from "../models/Question.js";
import { Attempt } from "../models/Attempt.js";
import { Job } from "../models/Job.js";
import { Document } from "../models/Document.js";
import { startQuizGeneration } from "../services/quizGenerator.js";
import { SESSION_EXPIRY_HOURS } from "../config/env.js";

const router = express.Router();

// Create quiz (async generation)
router.post(
  "/quizzes",
  requireSession,
  quizParamsValidator,
  async (req, res, next) => {
    try {
      const { documentId, params } = req.body;

      // Verify document exists and belongs to session
      const document = await Document.findOne({
        _id: documentId,
        sessionId: req.sessionId,
        status: "completed",
      });

      if (!document) {
        return res
          .status(404)
          .json({ error: "Document not found or not ready" });
      }

      const expiresAt = new Date(
        Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
      );

      // Create quiz
      const quiz = await Quiz.create({
        sessionId: req.sessionId,
        documentId,
        params: params || {},
        expiresAt,
      });

      // Start generation job
      const { jobId } = await startQuizGeneration(
        quiz._id,
        req.sessionId,
        expiresAt
      );

      res.json({ jobId, quizId: quiz._id });
    } catch (error) {
      next(error);
    }
  }
);

// Get job status
router.get("/jobs/:jobId", requireSession, async (req, res, next) => {
  try {
    const job = await Job.findOne({
      jobId: req.params.jobId,
      sessionId: req.sessionId,
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const lastLog = job.logs.length > 0 ? job.logs[job.logs.length - 1] : null;

    res.json({
      status: job.status,
      progress: job.progress,
      lastLog,
      error: job.error,
      quizId: job.quizId,
    });
  } catch (error) {
    next(error);
  }
});

// Get quiz (without answers)
router.get("/quizzes/:quizId", requireSession, async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.quizId,
      sessionId: req.sessionId,
    });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const questions = await Question.find({ quizId: quiz._id })
      .sort({ orderIndex: 1 })
      .select("-correctAnswerIndex -__v");

    res.json({ quiz, questions });
  } catch (error) {
    next(error);
  }
});

// Submit answers
router.post(
  "/quizzes/:quizId/submit",
  requireSession,
  submitAnswersValidator,
  async (req, res, next) => {
    try {
      const { answers } = req.body;

      const quiz = await Quiz.findOne({
        _id: req.params.quizId,
        sessionId: req.sessionId,
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const questions = await Question.find({ quizId: quiz._id }).sort({
        orderIndex: 1,
      });

      if (answers.length !== questions.length) {
        return res.status(400).json({ error: "Answer count mismatch" });
      }

      // Calculate score
      let correctCount = 0;
      const results = questions.map((q, idx) => {
        const isCorrect = answers[idx] === q.correctAnswerIndex;
        if (isCorrect) correctCount++;

        return {
          questionId: q._id,
          correct: isCorrect,
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation,
          citations: q.citations,
        };
      });

      const score = Math.round((correctCount / questions.length) * 100);

      // Save attempt
      const expiresAt = new Date(
        Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
      );
      await Attempt.create({
        quizId: quiz._id,
        sessionId: req.sessionId,
        answers,
        score,
        expiresAt,
      });

      res.json({ score, results });
    } catch (error) {
      next(error);
    }
  }
);

// Get review (wrong questions)
router.get(
  "/quizzes/:quizId/review",
  requireSession,
  async (req, res, next) => {
    try {
      const quiz = await Quiz.findOne({
        _id: req.params.quizId,
        sessionId: req.sessionId,
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const attempt = await Attempt.findOne({
        quizId: quiz._id,
        sessionId: req.sessionId,
      }).sort({ createdAt: -1 });

      if (!attempt) {
        return res.status(404).json({ error: "No attempt found" });
      }

      const questions = await Question.find({ quizId: quiz._id }).sort({
        orderIndex: 1,
      });

      const wrongQuestions = questions
        .map((q, idx) => ({
          ...q.toObject(),
          userAnswer: attempt.answers[idx],
        }))
        .filter((q, idx) => attempt.answers[idx] !== q.correctAnswerIndex);

      res.json({ wrongQuestions });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
