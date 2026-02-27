import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { API_PORT, WEB_URL, NODE_ENV } from "./config/secrets.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import jobRoutes from "./routes/job.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import discordRoutes from "./routes/discord.routes.js";
import dodoRoutes from "./routes/dodo.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import { queueService } from "./services/queue.service.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: WEB_URL,
    credentials: true,
  }),
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many requests, please try again later" },
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many authentication attempts, please try again later",
    },
  },
});

app.use(globalLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/resumes", resumeRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/discord", discordRoutes);
app.use("/api/v1/payments", dodoRoutes);
app.use("/api/v1/applications", applicationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(API_PORT, "0.0.0.0", async () => {
  console.log(`🚀 API server running on http://0.0.0.0:${API_PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);

  // Initialize Discord Job Queue
  try {
    await queueService.initDailyCron();
    queueService.setupWorker();
  } catch (err) {
    console.error("Failed to initialize Discord Queue:", err);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

export default app;
