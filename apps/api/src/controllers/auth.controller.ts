import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { userQueries, otpQueries } from "@postly/database";
import type { AuthResponse, UserRole } from "@postly/shared-types";
import type { JwtPayload } from "../middleware/auth.js";
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  RESEND_FROM_EMAIL,
} from "../config/secrets.js";
import { resend } from "../lib/resend.js";


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

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

const resendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});


// ─── Controller ──────────────────────────────────────────────────────────────

export class AuthController {
  /**
   * Generate access + refresh token pair for a user.
   */
  private generateTokens(user: {
    id: string;
    email: string;
    roles: UserRole[];
  }) {
    const access_token = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
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

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otpCode, 10);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await otpQueries.upsertOtp(user.id, otpHash, otpExpiry);

      // Send OTP via Resend
      try {
        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: email,
          subject: "Verify your Postly account",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Welcome to Postly!</h2>
              <p>Your verification code is:</p>
              <div style="background: #f4f4f4; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px;">
                ${otpCode}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // We still created the user, they can request a resend later
      }

      res.status(201).json({
        success: true,
        data: {
          message: "Registration successful. Please check your email for the verification code.",
          email: user.email,
        },
      });
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

      // Check if email is verified
      if (!user.is_verified) {
        res.status(403).json({
          success: false,
          error: {
            message: "Email not verified",
            code: "EMAIL_NOT_VERIFIED",
          },
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
          roles: user.roles,
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
        { id: user.id, email: user.email, roles: user.roles },
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
          roles: user.roles,
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

  // ─── POST /verify-otp ────────────────────────────────────────────────────

  verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = verifyOtpSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { email, code } = validation.data;
      const user = await userQueries.findByEmail(email);

      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: "User not found" },
        });
        return;
      }

      if (user.is_verified) {
        res.status(400).json({
          success: false,
          error: { message: "User is already verified" },
        });
        return;
      }

      const otp = await otpQueries.findOtpByUserId(user.id);
      if (!otp) {
        res.status(400).json({
          success: false,
          error: { message: "No verification code found. Please request a new one." },
        });
        return;
      }

      // Check expiry
      if (new Date() > new Date(otp.expires_at)) {
        await otpQueries.deleteOtp(otp.id);
        res.status(400).json({
          success: false,
          error: { message: "Verification code expired. Please request a new one." },
        });
        return;
      }

      // Check attempts
      if (otp.attempts >= 3) {
        res.status(429).json({
          success: false,
          error: { message: "Too many failed attempts. Please request a new code." },
        });
        return;
      }

      // Verify code
      const isValid = await bcrypt.compare(code, otp.code_hash);
      if (!isValid) {
        await otpQueries.incrementOtpAttempts(otp.id);
        res.status(400).json({
          success: false,
          error: { message: "Invalid verification code" },
        });
        return;
      }

      // Success
      await otpQueries.verifyUser(user.id);
      await otpQueries.deleteOtp(otp.id);


      const tokens = this.generateTokens(user);
      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          roles: user.roles,
          is_verified: true,
          created_at: user.created_at,
          updated_at: new Date(),
        },
        ...tokens,
      };

      res.json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  };

  // ─── POST /resend-otp ────────────────────────────────────────────────────

  resendOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validation = resendOtpSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: { message: validation.error.errors[0].message },
        });
        return;
      }

      const { email } = validation.data;
      const user = await userQueries.findByEmail(email);

      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: "User not found" },
        });
        return;
      }

      if (user.is_verified) {
        res.status(400).json({
          success: false,
          error: { message: "User is already verified" },
        });
        return;
      }

      const existingOtp = await otpQueries.findOtpByUserId(user.id);
      if (existingOtp) {
        const timeSinceCreation = Date.now() - new Date(existingOtp.created_at || 0).getTime();
        if (timeSinceCreation < 60 * 1000) {
          const waitTime = Math.ceil((60 * 1000 - timeSinceCreation) / 1000);
          res.status(429).json({
            success: false,
            error: { message: `Please wait ${waitTime} seconds before requesting a new code.` },
          });
          return;
        }
      }

      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otpCode, 10);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await otpQueries.upsertOtp(user.id, otpHash, otpExpiry);


      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject: "Your new Postly verification code",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Verification Code</h2>
            <p>Your new verification code is:</p>
            <div style="background: #f4f4f4; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px;">
              ${otpCode}
            </div>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      });

      res.json({
        success: true,
        data: { message: "Verification code resent successfully." },
      });
    } catch (error) {
      next(error);
    }
  };
}
