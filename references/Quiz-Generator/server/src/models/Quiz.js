import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  params: {
    count: {
      type: Number,
      default: 15,
    },
    language: {
      type: String,
      enum: ["zh", "en"],
      default: "zh",
    },
    difficulty: {
      easy: { type: Number, default: 5 },
      medium: { type: Number, default: 7 },
      hard: { type: Number, default: 3 },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["generating", "completed", "failed"],
    default: "generating",
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
});

export const Quiz = mongoose.model("Quiz", quizSchema);
