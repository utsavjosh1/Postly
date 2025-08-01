import type { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number",
    ),
  full_name: z.string().min(1, "Full name is required").optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
  full_name: z.string().min(1, "Full name cannot be empty").optional(),
  avatar_url: z.string().url("Invalid URL format").optional(),
  website: z.string().url("Invalid URL format").optional(),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number",
    ),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

export class AuthController {
  // Register a new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(validatedData);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: result.user,
          session: result.session,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }

      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);

      if (result.error) {
        res.status(401).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          session: result.session,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }

      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Logout user
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.substring(7); // Remove "Bearer " prefix

      if (!token) {
        res.status(400).json({
          success: false,
          error: "No token provided",
        });
        return;
      }

      const result = await AuthService.logout(token);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = refreshTokenSchema.parse(req.body);
      const result = await AuthService.refreshToken(validatedData);

      if (result.error) {
        res.status(401).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          user: result.user,
          session: result.session,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }

      console.error("Token refresh error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Get current user profile
  static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const token = req.headers.authorization?.substring(7);
      if (!token) {
        res.status(401).json({
          success: false,
          error: "No token provided",
        });
        return;
      }

      const user = await AuthService.getUserByToken(token);

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Update user profile
  static async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const validatedData = updateProfileSchema.parse(req.body);
      const result = await AuthService.updateProfile(
        req.user.id,
        validatedData,
      );

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user: result.user },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }

      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Change password
  static async changePassword(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
        return;
      }

      const validatedData = changePasswordSchema.parse(req.body);
      const result = await AuthService.changePassword(
        req.user.id,
        validatedData,
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }

      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Request password reset
  static async requestPasswordReset(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const result = await AuthService.requestPasswordReset(validatedData);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }

      console.error("Password reset request error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  // Health check for auth routes
  static async healthCheck(_: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Auth service is healthy",
      timestamp: new Date().toISOString(),
    });
  }
}
