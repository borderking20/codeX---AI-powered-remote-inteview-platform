import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import { createServer } from "http";
import { Server } from "socket.io";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import mockInterviewRoutes from "./routes/mockInterviewRoutes.js";
import executionRoutes from "./routes/executionRoutes.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ENV.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected via Socket.io:", socket.id);

  socket.on("join-session", (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined session ${sessionId}`);
  });

  socket.on("code-change", ({ sessionId, code }) => {
    socket.to(sessionId).emit("code-change", code);
  });

  socket.on("language-change", ({ sessionId, language }) => {
    socket.to(sessionId).emit("language-change", language);
  });

  socket.on("code-run-result", ({ sessionId, output }) => {
    socket.to(sessionId).emit("code-run-result", output);
  });

  socket.on("participant-exited-fullscreen", ({ sessionId }) => {
    socket.to(sessionId).emit("participant-exited-fullscreen");
  });

  socket.on("participant-rejected-fullscreen", ({ sessionId }) => {
    socket.to(sessionId).emit("participant-rejected-fullscreen");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const __dirname = path.resolve();

// middleware
app.use(express.json());
// credentials:true meaning?? => server allows a browser to include cookies on request
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(clerkMiddleware()); // this adds auth field to request object: req.auth()

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/mock-interview", mockInterviewRoutes);
app.use("/api/execute", executionRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
