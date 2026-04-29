import type { Request, Response, NextFunction } from "express";
import { NODE_ENV, WEB_URL } from "../config/secrets.js";
import { logger } from "@postly/logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (NODE_ENV !== "production") {
    logger.error("Unhandled error", {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  // Ensure CORS headers are present even in error responses, but ONLY for trusted origins
  const origin = _req.headers.origin;
  if (typeof origin === "string" && origin.length > 0) {
    const allowedOrigins = WEB_URL
      ? WEB_URL.split(",")
          .map((o) => o.trim().replace(/\/$/, ""))
          .filter(Boolean)
      : [];

    const normalizedOrigin = origin.trim().replace(/\/$/, "");
    const matchedOrigin =
      normalizedOrigin !== "null"
        ? allowedOrigins.find((o) => o === normalizedOrigin)
        : undefined;

    if (matchedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", matchedOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}

export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
