import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";

import { config } from "./config/env";
import "./config/passport";
import  authRoutes from "./routes/auth.route";
import {
  securityHeaders,
  authRateLimit,
  generalRateLimit,
  corsOptions,
  errorHandler,
  notFoundHandler,
} from "./middlewares/security.middleware";

const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set("trust proxy", 1);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(generalRateLimit);

// Session configuration for OAuth
app.use(
  session({
    secret:
      config.SESSION_SECRET || "fallback-dev-secret-please-set-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax", // CSRF protection
    },
    name: "jobbot.sid", // Custom session name
  }),
);

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 JobBot API is running!",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: "1.0.0",
  });
});

app.get("/health", (_, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes - Clean Prisma-based authentication
app.use("/api/auth", authRateLimit, authRoutes);

// 404 handler
app.use("*", notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = config.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running on http://localhost:${PORT}
📚 Environment: ${config.NODE_ENV}
📦 Database: Managed by @repo/db package
🔑 JWT Secret: ${config.JWT_SECRET ? "✅ Configured" : "❌ Missing"}
🔐 Session Secret: ${config.SESSION_SECRET ? "✅ Configured" : "⚠️  Using fallback (set in production)"}
🌐 Google OAuth: ${config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET ? "✅ Configured" : "⚠️  Not configured (required for auth)"}
🎯 Frontend URL: ${config.FRONTEND_URL}
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

export default app;
