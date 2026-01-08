/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/secrets.js";

import { User } from "@postly/shared-types";

// Extend Express Request type to include User from shared-types
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    console.log("[AuthMiddleware] No token provided in header:", authHeader);
    res.status(401).json({
      success: false,
      error: { message: "Access token required" },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    console.log("[AuthMiddleware] Token verified for user:", decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("[AuthMiddleware] Token verification failed:", error);
    res.status(401).json({
      success: false,
      error: { message: "Invalid or expired token" },
    });
  }
}
