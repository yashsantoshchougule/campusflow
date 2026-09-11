import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    ts: {
      type: Date,
      default: Date.now,
    },
    level: {
      type: String,
      enum: ["info", "warn", "error"],
      default: "info",
    },
    msg: String,
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["queued", "running", "completed", "failed"],
    default: "queued",
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  logs: [logSchema],
  error: String,
  startedAt: Date,
  finishedAt: Date,
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
});

export const Job = mongoose.model("Job", jobSchema);
