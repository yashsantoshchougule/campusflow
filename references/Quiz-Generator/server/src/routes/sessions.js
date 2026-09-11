import express from "express";
import { createSession } from "../utils/sessionId.js";
import { Session } from "../models/Session.js";
import { SESSION_EXPIRY_HOURS } from "../config/env.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const sessionId = createSession();
    const expiresAt = new Date(
      Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    await Session.create({
      sessionId,
      expiresAt,
    });

    res.json({ sessionId });
  } catch (error) {
    next(error);
  }
});

export default router;
