import express from "express";
import { ENV } from "../lib/env.js";

const router = express.Router();

const LANGUAGE_MAPPING = {
  cpp: { language: "cpp17", versionIndex: "1" },         // C++17
  javascript: { language: "nodejs", versionIndex: "4" }, // Node.js 17.x
  python: { language: "python3", versionIndex: "4" },   // Python 3.9
  java: { language: "java", versionIndex: "4" },        // JDK 17
};

router.post("/", async (req, res) => {
  const { language, code } = req.body;

  try {
    const languageConfig = LANGUAGE_MAPPING[language];

    if (!languageConfig) {
      return res.status(400).json({ success: false, error: `Unsupported language: ${language}` });
    }

    const payload = {
      clientId: ENV.JDOODLE_CLIENT_ID,
      clientSecret: ENV.JDOODLE_CLIENT_SECRET,
      script: code,
      language: languageConfig.language,
      versionIndex: languageConfig.versionIndex,
    };

    const response = await fetch("https://api.jdoodle.com/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: `JDoodle API error: ${response.status}` });
    }

    const data = await response.json();
    
    if (data.error) {
       return res.status(500).json({ success: false, error: data.error });
    }

    res.status(200).json({
      success: true,
      output: data.output || "No output",
      cpuTime: data.cpuTime,
      memory: data.memory,
    });
  } catch (error) {
    console.error("Execution error:", error);
    res.status(500).json({ success: false, error: "Failed to execute code on server" });
  }
});

export default router;
