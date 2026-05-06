import dotenv from "dotenv";
dotenv.config();

const key = process.env.GROQ_API_KEY;
console.log("GROQ_API_KEY:", key ? key.substring(0, 15) + "..." : "❌ MISSING OR EMPTY");

if (!key || key === "your_groq_api_key_here") {
  console.log("❌ Key is still placeholder - not set correctly!");
  process.exit(1);
}

// Try importing Groq
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: key });

console.log("Testing Groq API call...");
try {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "Say hello in one word." }],
    max_tokens: 10,
  });
  console.log("✅ Groq works! Response:", res.choices[0].message.content);
} catch (err) {
  console.error("❌ Groq API error:", err.message);
  if (err.status) console.error("Status:", err.status);
  if (err.error) console.error("Error body:", JSON.stringify(err.error));
}
