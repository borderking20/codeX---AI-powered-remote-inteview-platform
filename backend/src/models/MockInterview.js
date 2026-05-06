import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["interviewer", "candidate"], required: true },
  content: { type: String, required: true },
});

const mockInterviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Clerk user ID
    interviewerName: { type: String },
    role: { type: String, required: true }, // e.g., Backend, Frontend
    experience: { type: Number, required: true },
    interviewType: { type: String, required: true }, // e.g., Technical, HR
    resumeData: {
      text: { type: String }, // Raw extracted text
      skills: [{ type: String }],
      projects: [{ type: String }],
      experience: [{ type: String }],
      education: [{ type: String }],
    },
    conversation: [messageSchema],
    feedback: {
      score: { type: Number }, // Out of 10
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      suggestions: [{ type: String }],
      technicalKnowledge: { type: String },
      communication: { type: String },
      confidence: { type: String },
      problemSolving: { type: String },
    },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
  },
  { timestamps: true }
);

export const MockInterview = mongoose.model("MockInterview", mockInterviewSchema);
