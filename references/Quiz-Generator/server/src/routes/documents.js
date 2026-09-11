import express from "express";
import multer from "multer";
import { requireSession } from "../middleware/auth.js";
import { Document } from "../models/Document.js";
import { Block } from "../models/Block.js";
import { parseDocument } from "../services/parser.js";
import { SESSION_EXPIRY_HOURS, MAX_FILE_SIZE } from "../config/env.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed = ["pdf", "docx", "pptx", "txt"];
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"));
    }
  },
});

// Upload document
router.post(
  "/upload",
  requireSession,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const expiresAt = new Date(
        Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
      );
      const fileType = req.file.originalname.split(".").pop().toLowerCase();

      const document = await Document.create({
        sessionId: req.sessionId,
        filename: req.file.originalname,
        fileType,
        status: "parsing",
        expiresAt,
      });

      // Parse document asynchronously
      parseDocument(
        document._id,
        req.file.buffer,
        fileType,
        req.sessionId,
        expiresAt
      ).catch((err) => console.error("Parse error:", err));

      res.json({
        documentId: document._id,
        filename: document.filename,
        status: document.status,
      });
    } catch (error) {
      next(error);
    }
  }
);

// List documents
router.get("/", requireSession, async (req, res, next) => {
  try {
    const documents = await Document.find({ sessionId: req.sessionId })
      .sort({ uploadedAt: -1 })
      .select("-__v");

    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// Get document with blocks preview
router.get("/:id", requireSession, async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      sessionId: req.sessionId,
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const blocks = await Block.find({ documentId: document._id })
      .sort({ orderIndex: 1 })
      .limit(10);

    res.json({ document, blocks });
  } catch (error) {
    next(error);
  }
});

export default router;
