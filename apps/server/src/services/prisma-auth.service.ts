import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { config } from "../config/env";
import type {
  AuthResponse,
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  TokenPayload,
} from "../types/auth.types";

export class PrismaAuthService {
  // Helper function to convert Profile to User
  private static profileToUser(profile: any): User {
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || undefined,
      username: profile.username || undefined,
      avatar_url: profile.avatar_url || undefined,
      website: profile.website || undefined,
      created_at: profile.created_at.toISOString(),
      updated_at: profile.updated_at?.toISOString(),
      role: "user",
    };
  }

  // Register a new user
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const { email, password, full_name, username } = data;

      // Check if user already exists by email
      const existingUser = await prisma.profile.findUnique({
        where: { email },
      });

      if (existingUser) {
        return {
          user: null,
          session: null,
          error: "User already exists with this email",
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user profile
      const profile = await prisma.profile.create({
        data: {
          email,
          full_name,
          username,
          password_hash: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Generate JWT token
      const tokenPayload: TokenPayload = {
        sub: profile.id,
        user_id: profile.id,
        email: profile.email,
        role: 'user',
        provider: 'email'
      };

      const accessToken = jwt.sign(tokenPayload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN || '7d',
        issuer: 'jobbot-auth',
        subject: profile.id
      } as jwt.SignOptions);

      return {
        user: this.profileToUser(profile),
        session: {
          access_token: accessToken,
          refresh_token: accessToken, // For simplicity, using same token
          expires_in: 7 * 24 * 60 * 60, // 7 days in seconds
          token_type: "bearer",
        },
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        user: null,
        session: null,
        error: "Internal server error during registration",
      };
    }
  }

  // Login user
  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = data;

      // Find user by email
      const profile = await prisma.profile.findUnique({
        where: { email },
      });

      if (!profile || !profile.password_hash) {
        return {
          user: null,
          session: null,
          error: "Invalid credentials",
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, profile.password_hash);
      if (!isPasswordValid) {
        return {
          user: null,
          session: null,
          error: "Invalid credentials",
        };
      }

      // Generate JWT token
      const tokenPayload: TokenPayload = {
        sub: profile.id,
        user_id: profile.id,
        email: profile.email,
        role: 'user',
        provider: 'email'
      };

      const accessToken = jwt.sign(tokenPayload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN || '7d',
        issuer: 'jobbot-auth',
        subject: profile.id
      } as jwt.SignOptions);

      return {
        user: this.profileToUser(profile),
        session: {
          access_token: accessToken,
          refresh_token: accessToken,
          expires_in: 7 * 24 * 60 * 60,
          token_type: "bearer",
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        user: null,
        session: null,
        error: "Internal server error during login",
      };
    }
  }

  // Logout user
  static async logout(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a production app, you might want to blacklist the token
      // For now, we'll just return success
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: "Internal server error during logout",
      };
    }
  }

  // Refresh token
  static async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    try {
      const { refresh_token } = data;

      // Verify the refresh token
      const decoded = jwt.verify(refresh_token, config.JWT_SECRET) as TokenPayload;

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { id: decoded.user_id },
      });

      if (!profile) {
        return {
          user: null,
          session: null,
          error: "User not found",
        };
      }

      // Generate new access token
      const tokenPayload: TokenPayload = {
        sub: profile.id,
        user_id: profile.id,
        email: profile.email,
        role: 'user',
        provider: decoded.provider || 'email'
      };

      const accessToken = jwt.sign(tokenPayload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN || '7d',
        issuer: 'jobbot-auth',
        subject: profile.id
      } as jwt.SignOptions);

      return {
        user: this.profileToUser(profile),
        session: {
          access_token: accessToken,
          refresh_token: accessToken,
          expires_in: 7 * 24 * 60 * 60,
          token_type: "bearer",
        },
      };
    } catch (error) {
      console.error("Refresh token error:", error);
      return {
        user: null,
        session: null,
        error: "Invalid refresh token",
      };
    }
  }

  // Get user by token
  static async getUserByToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;

      const profile = await prisma.profile.findUnique({
        where: { id: decoded.user_id },
      });

      if (!profile) {
        return null;
      }

      return this.profileToUser(profile);
    } catch (error) {
      console.error("Get user by token error:", error);
      return null;
    }
  }

  // Update user profile
  static async updateProfile(userId: string, data: UpdateProfileRequest): Promise<{
    user: User | null;
    error?: string;
  }> {
    try {
      const { username, full_name, avatar_url, website } = data;

      const updatedProfile = await prisma.profile.update({
        where: { id: userId },
        data: {
          username,
          full_name,
          avatar_url,
          website,
          updated_at: new Date(),
        },
      });

      return {
        user: this.profileToUser(updatedProfile),
      };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        user: null,
        error: "Failed to update profile",
      };
    }
  }

  // Change password
  static async changePassword(userId: string, data: ChangePasswordRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { current_password, new_password } = data;

      // Get user profile
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
      });

      if (!profile || !profile.password_hash) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(current_password, profile.password_hash);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: "Current password is incorrect",
        };
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(new_password, 12);

      // Update password
      await prisma.profile.update({
        where: { id: userId },
        data: {
          password_hash: hashedNewPassword,
          updated_at: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Change password error:", error);
      return {
        success: false,
        error: "Internal server error during password change",
      };
    }
  }

  // Request password reset
  static async requestPasswordReset(data: ResetPasswordRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { email } = data;

      // Find user by email
      const profile = await prisma.profile.findUnique({
        where: { email },
      });

      if (!profile) {
        // Don't reveal if user exists or not for security
        return { success: true };
      }

      // In a full implementation, you would:
      // 1. Generate a password reset token
      // 2. Store it with expiration
      // 3. Send reset email
      
      return { success: true };
    } catch (error) {
      console.error("Password reset request error:", error);
      return {
        success: false,
        error: "Internal server error during password reset request",
      };
    }
  }

  // Get all users (for admin/public listing)
  static async getAllUsers(): Promise<User[]> {
    try {
      const profiles = await prisma.profile.findMany({
        orderBy: { created_at: 'desc' },
        take: 100, // Limit to prevent performance issues
      });

      return profiles.map(profile => this.profileToUser(profile));
    } catch (error) {
      console.error("Get all users error:", error);
      return [];
    }
  }
}
