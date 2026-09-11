import { Quiz } from "../models/Quiz.js";
import { Block } from "../models/Block.js";
import { Job } from "../models/Job.js";
import { v4 as uuidv4 } from "uuid";
import { runStructurer } from "../ai/agents/structurer.js";
import { runKnowledgeExtractor } from "../ai/agents/knowledgeExtractor.js";
import { runQuizPlanner } from "../ai/agents/quizPlanner.js";
import { runQuestionGenerator } from "../ai/agents/questionGenerator.js";
import { runVerifier } from "../ai/agents/verifier.js";
import { runAssembler } from "../ai/agents/assembler.js";

export async function startQuizGeneration(quizId, sessionId, expiresAt) {
  const jobId = uuidv4();

  // Create job
  const job = await Job.create({
    jobId,
    quizId,
    sessionId,
    status: "queued",
    progress: 0,
    logs: [],
    expiresAt,
  });

  // Run generation in background
  runGenerationPipeline(job).catch((err) => {
    console.error("Generation error:", err);
  });

  return { jobId };
}

async function runGenerationPipeline(job) {
  try {
    await updateJob(
      job._id,
      { status: "running", startedAt: new Date() },
      "info",
      "Starting quiz generation"
    );

    // Load quiz and blocks
    const quiz = await Quiz.findById(job.quizId).populate("documentId");
    const blocks = await Block.find({ documentId: quiz.documentId._id }).sort({
      orderIndex: 1,
    });

    if (blocks.length === 0) {
      throw new Error("No content blocks found");
    }

    await updateJob(
      job._id,
      { progress: 10 },
      "info",
      `Loaded ${blocks.length} content blocks`
    );

    // Step 1: Structurer
    const chunks = await runStructurer(blocks, quiz.params.language);
    await updateJob(
      job._id,
      { progress: 20 },
      "info",
      `Structured into ${chunks.length} chunks`
    );

    // Step 2: Knowledge Extractor
    const knowledgePoints = await runKnowledgeExtractor(
      chunks,
      quiz.params.language
    );
    await updateJob(
      job._id,
      { progress: 35 },
      "info",
      `Extracted ${knowledgePoints.length} knowledge points`
    );

    // Step 3: Quiz Planner
    const blueprint = await runQuizPlanner(knowledgePoints, quiz.params);
    await updateJob(
      job._id,
      { progress: 50 },
      "info",
      `Created blueprint for ${blueprint.questions.length} questions`
    );

    // Step 4: Question Generator
    const rawQuestions = await runQuestionGenerator(
      blueprint,
      blocks,
      quiz.params.language
    );
    await updateJob(
      job._id,
      { progress: 70 },
      "info",
      `Generated ${rawQuestions.length} raw questions`
    );

    // Step 5: Verifier
    const verifiedQuestions = await runVerifier(
      rawQuestions,
      blocks,
      quiz.params.count,
      quiz.params.language
    );
    await updateJob(
      job._id,
      { progress: 85 },
      "info",
      `Verified ${verifiedQuestions.length} questions`
    );

    // Step 6: Assembler
    await runAssembler(verifiedQuestions, quiz._id, job.sessionId);
    await updateJob(
      job._id,
      { progress: 100, status: "completed", finishedAt: new Date() },
      "info",
      "Quiz generation completed"
    );

    // Update quiz status
    await Quiz.findByIdAndUpdate(quiz._id, { status: "completed" });
  } catch (error) {
    await updateJob(
      job._id,
      {
        status: "failed",
        error: error.message,
        finishedAt: new Date(),
      },
      "error",
      `Generation failed: ${error.message}`
    );

    await Quiz.findByIdAndUpdate(job.quizId, { status: "failed" });
  }
}

async function updateJob(jobId, updates, logLevel, logMsg) {
  const log = { ts: new Date(), level: logLevel, msg: logMsg };
  await Job.findByIdAndUpdate(jobId, {
    ...updates,
    $push: { logs: log },
  });
}
