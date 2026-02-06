import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import jobRoutes from "./routes/job.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import passport from "./config/passport.js";
import { setupScraperWorker } from "./workers/scraper.worker.js";
import { schedulerService } from "./services/scheduler.service.js";
import { queueService } from "./services/queue.service.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.WEB_URL || "http://localhost:3001",
    credentials: true,
  }),
);

// Initialize Passport
app.use(passport.initialize());

// Global rate limiting - 100 requests per 15 minutes
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

// Strict rate limiting for auth endpoints - 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/resumes", resumeRoutes);
app.use("/api/v1/chat", chatRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || "postly"}`);

  // Initialize Background Workers & Schedules
  try {
    setupScraperWorker();
    await schedulerService.initSchedules();
  } catch (error) {
    console.error("Failed to initialize background services:", error);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  await queueService.close();
  server.close(() => process.exit(0));
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await queueService.close();
  server.close(() => process.exit(0));
});

export default app;
