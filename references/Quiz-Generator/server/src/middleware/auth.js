export const requireSession = (req, res, next) => {
  const sessionId = req.headers["x-session-id"];

  if (!sessionId) {
    return res.status(401).json({ error: "Session ID required" });
  }

  req.sessionId = sessionId;
  next();
};
