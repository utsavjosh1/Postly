import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { userQueries } from "@postly/database";
import type { AuthResponse } from "@postly/shared-types";
import type { JwtPayload } from "../middleware/auth.js";
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} from "../config/secrets.js";

// ─── Validation Schemas ──────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required").optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ─── Controller ──────────────────────────────────────────────────────────────

export class AuthController {
  /**
   * Generate access + refresh token pair for a user.
   */
  private generateTokens(user: { id: string; email: string; role: string }) {
    const access_token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] },
    );

    const refresh_token = jwt.sign(
      { id: user.id, type: "refresh" },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] },
    );

    return { access_token, refresh_token };
  }

  // ─── POST /register ──────────────────────────────────────────────────────

  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { email, password, full_name } = validation.data;

      const existingUser = await userQueries.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { message: "User with this email already exists" },
        });
        return;
      }

      const salt = await bcrypt.genSalt(12);
      const password_hash = await bcrypt.hash(password, salt);

      const user = await userQueries.create({
        email,
        password_hash,
        full_name,
      });
      const tokens = this.generateTokens(user);

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        ...tokens,
      };

      res.status(201).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /login ─────────────────────────────────────────────────────────

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { email, password } = validation.data;

      const user = await userQueries.findByEmail(email);
      if (!user || !user.password_hash) {
        res.status(401).json({
          success: false,
          error: { message: "Invalid email or password" },
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: { message: "Invalid email or password" },
        });
        return;
      }

      // Track login timestamp
      await userQueries.updateLastLogin(user.id);

      const tokens = this.generateTokens(user);

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        ...tokens,
      };

      res.json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /refresh ───────────────────────────────────────────────────────

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = refreshSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { refresh_token } = validation.data;

      let decoded: { id: string; type: string };
      try {
        decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as {
          id: string;
          type: string;
        };
      } catch {
        res.status(401).json({
          success: false,
          error: { message: "Invalid or expired refresh token" },
        });
        return;
      }

      if (decoded.type !== "refresh") {
        res.status(401).json({
          success: false,
          error: { message: "Invalid token type" },
        });
        return;
      }

      const user = await userQueries.findById(decoded.id);
      if (!user) {
        res.status(401).json({
          success: false,
          error: { message: "User not found" },
        });
        return;
      }

      const access_token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] },
      );

      res.json({ success: true, data: { access_token } });
    } catch (error) {
      next(error);
    }
  };

  // ─── GET /me ─────────────────────────────────────────────────────────────

  me = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = req.user as JwtPayload;
      const user = await userQueries.findById(payload.id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: "User not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_verified: user.is_verified,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /forgot-password ───────────────────────────────────────────────

  forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = forgotPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { email } = validation.data;

      // Always return success to prevent email enumeration
      const user = await userQueries.findByEmail(email);
      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await userQueries.setResetToken(user.id, token, expiresAt);
        // TODO: Send password reset email with token
      }

      res.json({
        success: true,
        data: {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /reset-password ────────────────────────────────────────────────

  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = resetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { token, password } = validation.data;

      const user = await userQueries.findByResetToken(token);
      if (!user) {
        res.status(400).json({
          success: false,
          error: { message: "Invalid or expired reset token" },
        });
        return;
      }

      const salt = await bcrypt.genSalt(12);
      const password_hash = await bcrypt.hash(password, salt);

      await userQueries.resetPassword(user.id, password_hash);

      res.json({
        success: true,
        data: { message: "Password has been reset successfully" },
      });
    } catch (error) {
      next(error);
    }
  };
}
