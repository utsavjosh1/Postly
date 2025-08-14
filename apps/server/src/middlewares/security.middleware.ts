import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

import type { Request, Response, NextFunction } from "express";
import { config } from "../config/env";
import ApiError from "../utils/ApiError";

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Enhanced rate limiting middleware
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth routes
  message: {
    success: false,
    error: {
      statusCode: 429,
      message: "Too many authentication attempts, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs for API routes
  message: {
    success: false,
    error: {
      statusCode: 429,
      message: "Too many API requests, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      statusCode: 429,
      message: "Too many requests, please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Speed limiting (slow down) middleware
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 100, // Add 100ms delay per request after delayAfter (new v2 syntax)
  maxDelayMs: 2000, // Max delay of 2 seconds
});

// CORS configuration
export const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      config.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "https://localhost:3000",
      "https://localhost:3001",
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-API-Key",
  ],
  exposedHeaders: ["X-Total-Count", "X-Rate-Limit-Remaining"],
};

// Request size limitation
export const requestSizeLimit = (maxSize: string = "1mb") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get("content-length");

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = maxSize.includes("mb")
        ? parseInt(maxSize) * 1024 * 1024
        : parseInt(maxSize) * 1024;

      if (sizeInBytes > maxSizeInBytes) {
        throw ApiError.badRequest(
          `Request body too large. Maximum size: ${maxSize}`,
        );
      }
    }

    next();
  };
};

// Enhanced error handler
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else {
    // Handle specific error types
    if (error.name === "ValidationError") {
      apiError = ApiError.badRequest("Validation error", []);
    } else if (error.name === "CastError") {
      apiError = ApiError.badRequest("Invalid data format");
    } else if (
      error.name === "MongoError" ||
      error.name === "PrismaClientKnownRequestError"
    ) {
      apiError = ApiError.internal("Database error");
    } else {
      apiError = new ApiError(
        500,
        error.message || "Internal Server Error",
        [],
        false,
        error.stack,
      );
    }
  }

  // Log error details
  if (process.env.NODE_ENV === "development" || apiError.statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] API Error:`, {
      statusCode: apiError.statusCode,
      message: apiError.message,
      errors: apiError.errors,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      ...(apiError.statusCode >= 500 && { stack: apiError.stack }),
    });
  }

  res.status(apiError.statusCode).json(apiError.toJSON());
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  res.status(404).json(error.toJSON());
};
