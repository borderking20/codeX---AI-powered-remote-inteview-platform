import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  createSession,
  endSession,
  getActiveSessions,
  getMyRecentSessions,
  getSessionById,
  joinSession,
  createPrivateSession,
  joinByToken,
  submitFeedback,
} from "../controllers/sessionController.js";

const router = express.Router();

// ── Static routes MUST come before /:id wildcard routes ───────────────────────
router.post("/", protectRoute, createSession);
router.get("/active", protectRoute, getActiveSessions);
router.get("/my-recent", protectRoute, getMyRecentSessions);

// ── Private session routes (static paths — must be before /:id) ───────────────
router.post("/invite", protectRoute, createPrivateSession);
router.get("/join-token/:token", protectRoute, joinByToken);

// ── Wildcard :id routes ───────────────────────────────────────────────────────
router.get("/:id", protectRoute, getSessionById);
router.post("/:id/join", protectRoute, joinSession);
router.post("/:id/end", protectRoute, endSession);
router.post("/:id/feedback", protectRoute, submitFeedback);

export default router;

