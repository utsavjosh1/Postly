import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Extend Express Request interface for OAuth-specific properties
declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
    }

    interface Session {
      oauth_state?: string;
    }
  }
}

/**
 * Middleware to ensure user is authenticated via OAuth or JWT
 * Supports both session-based (OAuth) and token-based (JWT) authentication
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Check for OAuth session first
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // JWT validation will be handled by existing auth middleware
    return next();
  }

  return res.status(401).json({
    success: false,
    error: "Authentication required",
    message: "Please log in to access this resource",
  });
};

/**
 * Middleware to ensure user is NOT authenticated
 * Redirects authenticated users to dashboard or profile
 */
export const requireGuest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.status(403).json({
      success: false,
      error: "Already authenticated",
      message: "You are already logged in",
      redirect_url: "/dashboard",
    });
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return res.status(403).json({
      success: false,
      error: "Already authenticated",
      message: "You are already logged in",
      redirect_url: "/dashboard",
    });
  }

  next();
};

/**
 * Middleware to handle OAuth state parameter validation
 * Prevents CSRF attacks during OAuth flow
 */
export const validateOAuthState = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { state } = req.query;
  const sessionState = (req.session as any)?.oauth_state;

  if (!state || !sessionState || state !== sessionState) {
    return res.status(400).json({
      success: false,
      error: "Invalid OAuth state",
      message: "OAuth authentication failed due to invalid state parameter",
    });
  }

  // Clear the state from session after validation
  delete (req.session as any)?.oauth_state;
  next();
};

/**
 * Generate secure random state for OAuth flow
 */
export const generateOAuthState = (): string => {
  return Buffer.from(
    Math.random().toString(36) + Date.now().toString(36),
  ).toString("base64");
};

/**
 * Middleware to add security headers for OAuth redirects
 */
export const oauthSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Prevent clickjacking during OAuth flow
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Strict referrer policy for OAuth
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
};

/**
 * Enhanced error handler for OAuth-specific errors
 */
export const oauthErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("OAuth Error:", err);

  // Handle specific OAuth errors
  if (err.name === "TokenError") {
    return res.status(401).json({
      success: false,
      error: "OAuth token error",
      message: "Failed to exchange authorization code for access token",
    });
  }

  if (err.name === "InternalOAuthError") {
    return res.status(500).json({
      success: false,
      error: "OAuth provider error",
      message: "Authentication provider returned an error",
    });
  }

  if (err.message?.includes("authentication")) {
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
      message: "OAuth authentication was unsuccessful",
    });
  }

  // Pass to general error handler
  next(err);
};

/**
 * Validation schemas for OAuth-related requests
 */
export const oauthValidation = {
  // Validate OAuth callback query parameters
  callback: z.object({
    code: z.string().min(1, "Authorization code is required"),
    state: z.string().min(1, "State parameter is required"),
    scope: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
  }),

  // Validate OAuth initiation parameters
  initiate: z.object({
    returnTo: z.string().url().optional(),
    prompt: z.enum(["consent", "select_account"]).optional(),
  }),
};

/**
 * Middleware to validate OAuth callback parameters
 */
export const validateOAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validation = oauthValidation.callback.parse(req.query);

    // Check for OAuth errors from provider
    if (validation.error) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        message: validation.error_description || "OAuth authentication failed",
      });
    }

    req.validatedQuery = validation;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid OAuth callback parameters",
        details: error.issues,
      });
    }
    next(error);
  }
};

/**
 * Middleware to handle user session after successful OAuth
 */
export const handleOAuthSuccess = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(500).json({
      success: false,
      error: "OAuth authentication failed",
      message: "User information not available after authentication",
    });
  }

  // Set secure session options
  if (req.session) {
    req.session.cookie.secure = process.env.NODE_ENV === "production";
    req.session.cookie.httpOnly = true;
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
    req.session.cookie.sameSite = "lax";
  }

  next();
};
