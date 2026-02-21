import type { Request, Response, NextFunction } from "express";
import { NODE_ENV } from "../config/secrets.js";

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
    console.error("Error:", err);
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
