import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import {
  userQueries,
  otpQueries,
  db,
  users,
  seeker_profiles,
  otp_codes,
} from "@postly/database";
import type { AuthResponse, UserRole } from "@postly/shared-types";
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  RESEND_FROM_EMAIL,
} from "../config/secrets.js";
import { resend } from "../lib/resend.js";
import { logger } from "@postly/logger";

// ─── Custom Errors ───────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * AuthService — Pure business logic for authentication.
 *
 * This service owns:
 *  - Registration (user + OTP in a single transaction)
 *  - Login (credential validation + token generation)
 *  - OTP verification & resend
 *  - Token refresh
 *  - Password reset flow
 *
 * It does NOT import Express types — it is HTTP-framework-agnostic.
 */
export class AuthService {
  // ─── Token Generation ─────────────────────────────────────────────────

  generateTokens(user: { id: string; email: string; roles: UserRole[] }) {
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

  // ─── Registration ─────────────────────────────────────────────────────

  async register(email: string, password: string, fullName?: string) {
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      throw new AuthError("User with this email already exists", 409);
    }

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user + OTP in a single transaction to prevent orphaned users
    const user = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          email,
          password_hash,
          full_name: fullName,
          roles: ["job_seeker"],
          avatar_url: `https://api.dicebear.com/9.x/dylan/svg?seed=${encodeURIComponent(fullName || email.split("@")[0])}`,
        })
        .returning();

      // Initialize seeker profile within same transaction
      await tx
        .insert(seeker_profiles)
        .values({ user_id: createdUser.id })
        .onConflictDoNothing();

      // Create OTP within same transaction
      await tx
        .insert(otp_codes)
        .values({
          user_id: createdUser.id,
          code_hash: otpHash,
          expires_at: otpExpiry,
          attempts: 0,
          last_attempt_at: null,
        })
        .onConflictDoUpdate({
          target: otp_codes.user_id,
          set: {
            code_hash: otpHash,
            expires_at: otpExpiry,
            attempts: 0,
            last_attempt_at: null,
            created_at: new Date(),
          },
        });

      return createdUser;
    });

    // Send verification email (fire-and-forget, outside transaction)
    this.sendVerificationEmail(email, otpCode).catch((err) => {
      logger.error("Failed to send verification email", {
        error: err instanceof Error ? err.message : "Unknown",
        email,
      });
    });

    return {
      message:
        "Registration successful. Please check your email for the verification code.",
      email: user.email,
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await userQueries.findByEmail(email);
    if (!user || !user.password_hash) {
      throw new AuthError("Invalid email or password", 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthError("Invalid email or password", 401);
    }

    if (!user.is_verified) {
      throw new AuthError("Email not verified", 403, "EMAIL_NOT_VERIFIED");
    }

    // Track login timestamp (fire-and-forget)
    userQueries.updateLastLogin(user.id).catch((err) => {
      logger.error("Failed to update last login", {
        error: err instanceof Error ? err.message : "Unknown",
        userId: user.id,
      });
    });

    const tokens = this.generateTokens(user);

    return {
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
  }

  // ─── Token Refresh ────────────────────────────────────────────────────

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    let decoded: { id: string; type: string };
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
        id: string;
        type: string;
      };
    } catch {
      throw new AuthError("Invalid or expired refresh token", 401);
    }

    if (decoded.type !== "refresh") {
      throw new AuthError("Invalid token type", 401);
    }

    const user = await userQueries.findById(decoded.id);
    if (!user) {
      throw new AuthError("User not found", 401);
    }

    const access_token = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] },
    );

    return { access_token };
  }

  // ─── OTP Verification ─────────────────────────────────────────────────

  async verifyOtp(email: string, code: string): Promise<AuthResponse> {
    const user = await userQueries.findByEmail(email);
    if (!user) {
      throw new AuthError("User not found", 404);
    }

    if (user.is_verified) {
      throw new AuthError("User is already verified", 400);
    }

    const otp = await otpQueries.findOtpByUserId(user.id);
    if (!otp) {
      throw new AuthError(
        "No verification code found. Please request a new one.",
        400,
      );
    }

    // Check expiry
    if (new Date() > new Date(otp.expires_at)) {
      await otpQueries.deleteOtp(otp.id);
      throw new AuthError(
        "Verification code expired. Please request a new one.",
        400,
      );
    }

    // Check attempts
    if (otp.attempts >= 3) {
      throw new AuthError(
        "Too many failed attempts. Please request a new code.",
        429,
      );
    }

    // Verify code
    const isValid = await bcrypt.compare(code, otp.code_hash);
    if (!isValid) {
      await otpQueries.incrementOtpAttempts(otp.id);
      throw new AuthError("Invalid verification code", 400);
    }

    // Success — verify user and clean up
    await otpQueries.verifyUser(user.id);
    await otpQueries.deleteOtp(otp.id);

    const tokens = this.generateTokens(user);

    return {
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
  }

  // ─── OTP Resend ───────────────────────────────────────────────────────

  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await userQueries.findByEmail(email);
    if (!user) {
      throw new AuthError("User not found", 404);
    }

    if (user.is_verified) {
      throw new AuthError("User is already verified", 400);
    }

    // Rate-limit resend
    const existingOtp = await otpQueries.findOtpByUserId(user.id);
    if (existingOtp) {
      const timeSinceCreation =
        Date.now() - new Date(existingOtp.created_at || 0).getTime();
      if (timeSinceCreation < 60 * 1000) {
        const waitTime = Math.ceil((60 * 1000 - timeSinceCreation) / 1000);
        throw new AuthError(
          `Please wait ${waitTime} seconds before requesting a new code.`,
          429,
        );
      }
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await otpQueries.upsertOtp(user.id, otpHash, otpExpiry);
    await this.sendVerificationEmail(email, otpCode);

    return { message: "Verification code resent successfully." };
  }

  // ─── Forgot Password ─────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<{ message: string }> {
    // Always return success to prevent email enumeration
    const user = await userQueries.findByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await userQueries.setResetToken(email, token, expiresAt);
      // TODO: Send password reset email with token
    }

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  // ─── Reset Password ──────────────────────────────────────────────────

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const success = await userQueries.resetPassword(token, password_hash);
    if (!success) {
      throw new AuthError("Invalid or expired reset token", 400);
    }

    return { message: "Password has been reset successfully" };
  }

  // ─── Get Current User ─────────────────────────────────────────────────

  async getCurrentUser(userId: string) {
    const user = await userQueries.findById(userId);
    if (!user) {
      throw new AuthError("User not found", 404);
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      roles: user.roles,
      is_verified: user.is_verified,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  // ─── Email Helpers (Private) ──────────────────────────────────────────

  private async sendVerificationEmail(
    email: string,
    otpCode: string,
  ): Promise<void> {
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
  }
}

export const authService = new AuthService();
