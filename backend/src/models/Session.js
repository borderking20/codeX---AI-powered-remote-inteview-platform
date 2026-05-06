import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    problem: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    // stream video call ID
    callId: {
      type: String,
      default: "",
    },

    // ── PRIVATE SESSION FIELDS ──────────────────────────────────────────
    // "public" = anyone can join; "private" = invite-only via token link
    sessionType: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    // email of the specific candidate invited (private sessions only)
    inviteeEmail: {
      type: String,
      default: null,
    },
    // unique token embedded in the magic link sent by email
    inviteToken: {
      type: String,
      default: null,
      index: true, // fast lookup when candidate clicks the link
    },

    // ── POST-SESSION FEEDBACK (filled by host after ending session) ─────
    feedback: {
      problemSolving: { type: Number, min: 1, max: 5, default: null },
      communication: { type: Number, min: 1, max: 5, default: null },
      codeQuality: { type: Number, min: 1, max: 5, default: null },
      timeManagement: { type: Number, min: 1, max: 5, default: null },
      overallImpression: { type: Number, min: 1, max: 5, default: null },
      submittedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
