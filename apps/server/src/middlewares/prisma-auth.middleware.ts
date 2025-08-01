import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaAuthService } from "../services/prisma-auth.service";
import { config } from "../config/env";
import type { TokenPayload } from "../types/auth.types";

export interface PrismaAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    supabase_user_id: string;
    provider: "email" | "google";
  };
}

export const prismaAuthenticate = async (
  req: PrismaAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Missing or invalid authorization header",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;

    // Get user data
    const user = await PrismaAuthService.getUserByToken(token);

    if (!user) {
      res.status(401).json({
        error: "Invalid token or user not found",
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      supabase_user_id: user.id, // Using the same ID for compatibility
      provider: (user.provider as "email" | "google") || "email",
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      error: "Invalid token",
    });
  }
};

export const prismaOptionalAuth = async (
  req: PrismaAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    // Try to verify and get user data
    const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    const user = await PrismaAuthService.getUserByToken(token);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        supabase_user_id: user.id,
        provider: (user.provider as "email" | "google") || "email",
      };
    }

    next();
  } catch (error) {
    // If there's an error, just continue without user
    console.warn("Optional auth error:", error);
    next();
  }
};

export const authorize = (roles: string[] = []) => {
  return (
    req: PrismaAuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
      });
      return;
    }

    // For now, we'll just pass through since we don't have role-based auth implemented
    // In a full implementation, you'd check req.user.role against the roles array
    next();
  };
};
