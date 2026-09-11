import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { PORT } from "./config/env.js";
import sessionsRouter from "./routes/sessions.js";
import documentsRouter from "./routes/documents.js";
import quizzesRouter from "./routes/quizzes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/sessions", sessionsRouter);
app.use("/api/docs", documentsRouter);
app.use("/api", quizzesRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
