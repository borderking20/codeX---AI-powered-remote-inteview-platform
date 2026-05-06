import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

async function run() {
  try {
    // List models doesn't seem to be explicitly exported as listModels in this version of the SDK,
    // wait actually let's try calling an API directly using fetch to see what models exist for this key.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Supported Models:", data.models?.map(m => m.name));
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

run();
