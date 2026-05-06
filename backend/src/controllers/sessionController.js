import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { sendInviteEmail, sendReportEmail } from "../lib/mailer.js";
import { ENV } from "../lib/env.js";
import Groq from "groq-sdk";
import crypto from "crypto";

// Groq client (same pattern as aiController.js)
const groq = new Groq({ apiKey: ENV.GROQ_API_KEY || "dummy_key" });

// ─── EXISTING PUBLIC SESSION FUNCTIONS (unchanged) ───────────────────────────

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res.status(400).json({ message: "Problem and difficulty are required" });
    }

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // create session in db
    const session = await Session.create({ problem, difficulty, host: userId, callId });

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    // chat messaging
    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    res.status(201).json({ session });
  } catch (error) {
    console.log("Error in createSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    // Only show public sessions in the active list — private sessions are invite-only
    const sessions = await Session.find({ status: "active", sessionType: { $ne: "private" } })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ message: "Cannot join a completed session" });
    }

    if (session.host.toString() === userId.toString()) {
      return res.status(400).json({ message: "Host cannot join their own session as participant" });
    }

    // check if session is already full - has a participant
    if (session.participant) return res.status(409).json({ message: "Session is full" });

    session.participant = userId;
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // check if user is the host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can end the session" });
    }

    // check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    // delete stream video call
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    // delete stream chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();

    session.status = "completed";
    await session.save();

    res.status(200).json({ session, message: "Session ended successfully" });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ─── NEW: PRIVATE SESSION FUNCTIONS ──────────────────────────────────────────

/**
 * Creates a private invite-only session and sends a magic link email.
 * NOTE: The problem/question is intentionally NOT included in the email.
 */
export async function createPrivateSession(req, res) {
  try {
    const { problem, difficulty, inviteeEmail } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty || !inviteeEmail) {
      return res.status(400).json({ message: "Problem, difficulty, and invitee email are required" });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteeEmail)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    // TODO: Re-enable this check once you verify a custom domain on Resend
    // (For now, disabled so you can test with your own email on Resend's free tier)
    // if (req.user.email === inviteeEmail) {
    //   return res.status(400).json({ message: "You cannot invite yourself to a session" });
    // }

    // Generate a secure random token for the magic link
    const inviteToken = crypto.randomBytes(32).toString("hex");

    // Generate stream call ID
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create the private session in DB
    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
      sessionType: "private",
      inviteeEmail: inviteeEmail.toLowerCase().trim(),
      inviteToken,
    });

    // Create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    // Create stream chat channel
    const channel = chatClient.channel("messaging", callId, {
      name: `Private Interview Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });
    await channel.create();

    // Build the magic join link
    const joinLink = `${ENV.CLIENT_URL}/join/${inviteToken}`;

    // Send invite email (problem NOT included in email)
    await sendInviteEmail({
      toEmail: inviteeEmail,
      hostName: req.user.name,
      joinLink,
    });

    res.status(201).json({
      session,
      message: `Invitation sent successfully to ${inviteeEmail}`,
    });
  } catch (error) {
    console.error("========= ERROR in createPrivateSession =========");
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    console.error("Stack:", error.stack);
    console.error("=================================================");
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}

/**
 * Validates the invite token and returns session ID so the candidate can join.
 * The candidate must be logged in AND their email must match inviteeEmail.
 */
export async function joinByToken(req, res) {
  try {
    const { token } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    // Find session by invite token
    const session = await Session.findOne({ inviteToken: token });

    if (!session) {
      return res.status(404).json({ message: "Invalid or expired invite link" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ message: "This session has already ended" });
    }

    // Verify the logged-in user's email matches the invited email
    const userEmail = req.user.email?.toLowerCase().trim();
    if (userEmail !== session.inviteeEmail) {
      return res.status(403).json({
        message: `This invitation was sent to ${session.inviteeEmail}. Please log in with that email to join.`,
      });
    }

    // Prevent host from joining their own session via token
    if (session.host.toString() === userId.toString()) {
      return res.status(400).json({ message: "You are the host of this session" });
    }

    // If no participant yet, add this user as participant
    if (!session.participant) {
      session.participant = userId;
      await session.save();

      const channel = chatClient.channel("messaging", session.callId);
      await channel.addMembers([clerkId]);
    } else if (session.participant.toString() !== userId.toString()) {
      // Another user already joined
      return res.status(409).json({ message: "Session is full" });
    }

    res.status(200).json({ sessionId: session._id.toString() });
  } catch (error) {
    console.log("Error in joinByToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/**
 * Saves feedback ratings, calls Groq to generate an AI performance report,
 * and sends the report via email to the candidate.
 */
export async function submitFeedback(req, res) {
  try {
    const { id } = req.params;
    const { problemSolving, communication, codeQuality, timeManagement, overallImpression } = req.body;
    const userId = req.user._id;

    // Validate all ratings are provided and in range 1–5
    const ratings = { problemSolving, communication, codeQuality, timeManagement, overallImpression };
    for (const [key, val] of Object.entries(ratings)) {
      if (!val || val < 1 || val > 5) {
        return res.status(400).json({ message: `Invalid rating for ${key}. Must be between 1 and 5.` });
      }
    }

    const session = await Session.findById(id)
      .populate("host", "name email")
      .populate("participant", "name email");

    if (!session) return res.status(404).json({ message: "Session not found" });

    // Only the host can submit feedback
    if (session.host._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can submit feedback" });
    }

    // Feedback only for private sessions that have a participant
    if (session.sessionType !== "private") {
      return res.status(400).json({ message: "Feedback is only available for private sessions" });
    }

    if (!session.participant) {
      return res.status(400).json({ message: "No participant to evaluate" });
    }

    // Save feedback ratings to the session
    session.feedback = { ...ratings, submittedAt: new Date() };
    await session.save();

    // ── Generate AI report using Groq ────────────────────────────────────
    const avg = (Object.values(ratings).reduce((a, b) => a + b, 0) / 5).toFixed(1);

    const prompt = `You are a professional technical interview evaluator. Write a detailed, honest, and encouraging performance report for a candidate based on their interview ratings.

Interview Details:
- Problem: ${session.problem} (${session.difficulty} difficulty)
- Interviewer: ${session.host.name}
- Candidate: ${session.participant.name}

Performance Ratings (out of 5):
- Problem Solving: ${problemSolving}/5
- Communication: ${communication}/5
- Code Quality: ${codeQuality}/5
- Time Management: ${timeManagement}/5
- Overall Impression: ${overallImpression}/5
- Average Score: ${avg}/5

Write a professional performance report in 3-4 paragraphs. The tone should be encouraging and constructive. Include:
1. An opening summary of the candidate's overall performance
2. Specific strengths based on high-rated areas
3. Areas for improvement based on lower-rated areas with actionable tips
4. A motivating closing statement

Keep it professional, specific, and personalized. Do not use bullet points — write in flowing paragraphs.`;

    let aiReport = "";
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 800,
      });
      aiReport = chatCompletion.choices[0]?.message?.content || "";
    } catch (groqError) {
      console.error("Groq AI report generation failed:", groqError.message);
      // Fallback report if Groq fails
      aiReport = `${session.participant.name} participated in a coding interview on the CodeX platform. Based on the interviewer's ratings, the candidate demonstrated an average performance of ${avg}/5 across key competencies including problem solving, communication, code quality, time management, and overall impression. We encourage continued practice and learning to improve in areas that need growth.`;
    }

    // ── Send email to candidate ──────────────────────────────────────────
    await sendReportEmail({
      toEmail: session.participant.email,
      candidateName: session.participant.name,
      hostName: session.host.name,
      problem: session.problem,
      ratings,
      aiReport,
    });

    res.status(200).json({
      message: `Feedback saved and performance report sent to ${session.participant.email}`,
      aiReport,
    });
  } catch (error) {
    console.log("Error in submitFeedback controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

