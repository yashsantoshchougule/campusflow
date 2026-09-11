import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  filename: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ["pdf", "docx", "pptx", "txt"],
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["parsing", "completed", "failed"],
    default: "parsing",
  },
  stats: {
    wordCount: Number,
    pageCount: Number,
    slideCount: Number,
    blockCount: Number,
  },
  error: String,
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
});

documentSchema.index({ sessionId: 1, uploadedAt: -1 });

export const Document = mongoose.model("Document", documentSchema);
