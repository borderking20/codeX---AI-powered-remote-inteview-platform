import express from "express";
import multer from "multer";
import { requireAuth } from "@clerk/express";
import {
  startInterview,
  nextQuestion,
  submitAnswer,
  endInterview,
  getHistory,
  getInterviewById,
} from "../controllers/aiController.js";

const router = express.Router();

// Setup Multer for in-memory file parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Mock Interview Routes
router.post("/start", requireAuth(), upload.single("resume"), startInterview);
router.post("/:interviewId/next", requireAuth(), nextQuestion);
router.post("/:interviewId/answer", requireAuth(), submitAnswer);
router.post("/:interviewId/end", requireAuth(), endInterview);
router.get("/history", requireAuth(), getHistory);
router.get("/:interviewId", requireAuth(), getInterviewById);

export default router;
