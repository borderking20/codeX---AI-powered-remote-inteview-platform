import Groq from "groq-sdk";
import pdfParse from "pdf-parse-new";
import mammoth from "mammoth";
import { MockInterview } from "../models/MockInterview.js";
import { ENV } from "../lib/env.js";

// Initialize Groq
const groq = new Groq({ apiKey: ENV.GROQ_API_KEY || "dummy_key" });

// Helper to parse file
const parseResumeFile = async (file) => {
  if (!file) return "";
  
  try {
    if (file.mimetype === "application/pdf") {
      const data = await pdfParse(file.buffer);
      return data.text;
    } else if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
  } catch (error) {
    console.error("Error parsing resume file:", error);
    return "";
  }
  return "";
};

const extractStructuredResumeData = async (rawText) => {
  if (!rawText) return {};
  
  const prompt = `
    Extract the following information from the resume text below and return ONLY a valid JSON object:
    {
      "skills": ["skill1", "skill2"],
      "projects": ["project1 description", "project2 description"],
      "experience": ["job1 description", "job2 description"],
      "education": ["edu1 description"]
    }
    
    Resume Text:
    ${rawText.substring(0, 15000)}
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });
    
    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error extracting structured resume data:", error);
    return { skills: [], projects: [], experience: [], education: [] };
  }
};

const getInterviewerName = () => {
  const names = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Jamie"];
  return names[Math.floor(Math.random() * names.length)];
};

export const startInterview = async (req, res) => {
  try {
    const { role, experience, interviewType } = req.body;
    const userId = req.auth?.userId; 

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let rawResumeText = "";
    if (req.file) {
      rawResumeText = await parseResumeFile(req.file);
    }

    const structuredData = await extractStructuredResumeData(rawResumeText);
    const interviewerName = getInterviewerName();

    const newInterview = new MockInterview({
      userId,
      role,
      interviewerName,
      experience,
      interviewType,
      resumeData: {
        text: rawResumeText,
        ...structuredData
      },
      conversation: [],
      status: "in_progress",
    });

    await newInterview.save();

    res.status(201).json(newInterview);
  } catch (error) {
    console.error("Error starting interview:", error);
    res.status(500).json({ error: "Failed to start interview" });
  }
};

export const nextQuestion = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.auth?.userId;
    
    const interview = await MockInterview.findOne({ _id: interviewId, userId });
    
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    if (interview.status === "completed") {
      return res.status(400).json({ error: "Interview already completed" });
    }

    const interviewerName = interview.interviewerName || "Alex";

    const systemPromptText = `You are a professional technical interviewer at a top tech company. Your name is ${interviewerName}.
CANDIDATE PROFILE:
- Role: ${interview.role}
- Experience: ${interview.experience} years
- Interview Type: ${interview.interviewType}
- Resume Context: ${JSON.stringify(interview.resumeData)}

STRICT RULES:
1. NEVER say you are an AI. Act entirely human.
2. If this is the start of the interview, introduce yourself with your name, state the role you are interviewing for, and ask the candidate to introduce themselves.
3. Wait for the candidate's introduction. Analyze it against their resume context.
4. If Interview Type is "Technical":
   - Ask a RANDOM Data Structures and Algorithms (DSA) question suitable for their experience. DO NOT use a fixed list. Generate a unique scenario.
   - The candidate may write code. I will provide their current code state to you in their messages (e.g., "[CANDIDATE CODE STATE]").
   - Analyze their code, point out bugs, ask about time/space complexity, or ask follow-up optimization questions.
5. If Interview Type is "HR":
   - Ask behavioral, situational, and culture-fit questions based on their resume.
6. Ask ONE question at a time. Keep responses concise and conversational.
7. Be encouraging but professional.`;

    const messages = [{ role: "system", content: systemPromptText }];
    
    for (const msg of interview.conversation) {
      messages.push({
        role: msg.role === "interviewer" ? "assistant" : "user",
        content: msg.content
      });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiMessage = chatCompletion.choices[0]?.message?.content || "I'm sorry, I didn't quite catch that. Could you repeat?";

    interview.conversation.push({
      role: "interviewer",
      content: aiMessage
    });

    await interview.save();

    res.status(200).json({ message: aiMessage });

  } catch (error) {
    console.error("Error getting next question:", error);
    if (error.error?.error?.message?.includes("API key")) {
      return res.status(400).json({ error: "Invalid Groq API Key. Please check your backend .env file." });
    }
    res.status(500).json({ error: "Failed to get next question" });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { answer, code } = req.body;
    const userId = req.auth?.userId;
    
    const interview = await MockInterview.findOne({ _id: interviewId, userId });
    
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    let fullAnswer = answer || "I'm submitting my current code for your review.";
    if (code) {
      fullAnswer = `${fullAnswer}\n\n[CANDIDATE CODE STATE]\n\`\`\`\n${code}\n\`\`\``;
    }

    interview.conversation.push({
      role: "candidate",
      content: fullAnswer
    });

    await interview.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ error: "Failed to submit answer" });
  }
};

export const endInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.auth?.userId;
    
    const interview = await MockInterview.findOne({ _id: interviewId, userId });
    
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    let convoText = interview.conversation.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

    const prompt = `
      Evaluate the following mock interview.
      Role: ${interview.role}
      Experience: ${interview.experience} years
      
      Conversation:
      ${convoText}
      
      Provide a structured JSON output with feedback:
      {
        "score": 8, // out of 10
        "strengths": ["string"],
        "weaknesses": ["string"],
        "suggestions": ["string"],
        "communication": "evaluation string",
        "technicalKnowledge": "evaluation string",
        "confidence": "evaluation string",
        "problemSolving": "evaluation string"
      }
      
      Return ONLY valid JSON.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    
    let feedback = {};
    try {
      feedback = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse feedback JSON", e);
    }

    interview.feedback = feedback;
    interview.status = "completed";
    await interview.save();

    res.status(200).json(interview);
  } catch (error) {
    console.error("Error ending interview:", error);
    res.status(500).json({ error: "Failed to end interview" });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const history = await MockInterview.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.auth?.userId;
    
    const interview = await MockInterview.findOne({ _id: interviewId, userId });
    
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    res.status(200).json(interview);
  } catch (error) {
    console.error("Error fetching interview:", error);
    res.status(500).json({ error: "Failed to fetch interview" });
  }
};
