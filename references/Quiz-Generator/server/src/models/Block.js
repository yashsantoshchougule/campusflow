import mongoose from "mongoose";

const blockSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  sourceRef: {
    type: String,
    required: true, // e.g., "page-1", "slide-5"
  },
  text: {
    type: String,
    required: true,
  },
  orderIndex: {
    type: Number,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
});

blockSchema.index({ documentId: 1, orderIndex: 1 });

export const Block = mongoose.model("Block", blockSchema);
