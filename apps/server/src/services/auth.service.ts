import { prisma } from "../config/prisma";
import type { User as PrismaUser, Account as PrismaAccount } from "@repo/db";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleUserData {
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

export class AuthService {
  /**
   * Find user by ID with accounts
   */
  static async findUserById(id: string): Promise<AuthUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          accounts: true,
        },
      });

      return user ? this.formatUser(user) : null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      return null;
    }
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          accounts: true,
        },
      });

      return user ? this.formatUser(user) : null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  }

  /**
   * Find or create user from Google OAuth data
   */
  static async findOrCreateGoogleUser(
    googleData: GoogleUserData,
  ): Promise<AuthUser> {
    try {
      // First try to find existing user by email
      let user = await prisma.user.findUnique({
        where: { email: googleData.email },
        include: { accounts: true },
      });

      if (user) {
        // Check if Google account is already linked
        const googleAccount = user.accounts.find(
          (account) =>
            account.provider === "google" &&
            account.providerAccountId === googleData.googleId,
        );

        if (!googleAccount) {
          // Link Google account to existing user
          await prisma.account.create({
            data: {
              userId: user.id,
              type: "oauth",
              provider: "google",
              providerAccountId: googleData.googleId,
              access_token: googleData.accessToken,
              refresh_token: googleData.refreshToken,
              token_type: "Bearer",
              scope: "profile email",
            },
          });
        } else {
          // Update existing Google account tokens
          await prisma.account.update({
            where: { id: googleAccount.id },
            data: {
              access_token: googleData.accessToken,
              refresh_token: googleData.refreshToken,
            },
          });
        }

        // Update user profile if needed
        if (googleData.name && !user.name) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: googleData.name,
              avatar: googleData.avatar,
            },
            include: { accounts: true },
          });
        }
      } else {
        // Create new user with Google account
        user = await prisma.user.create({
          data: {
            email: googleData.email,
            name: googleData.name,
            avatar: googleData.avatar,
            accounts: {
              create: {
                type: "oauth",
                provider: "google",
                providerAccountId: googleData.googleId,
                access_token: googleData.accessToken,
                refresh_token: googleData.refreshToken,
                token_type: "Bearer",
                scope: "profile email",
              },
            },
          },
          include: { accounts: true },
        });

        console.log("✅ Created new user with Google account:", user.email);
      }

      return this.formatUser(user);
    } catch (error) {
      console.error("Error in findOrCreateGoogleUser:", error);
      throw error;
    }
  }

  /**
   * Get all users (admin function)
   */
  static async getAllUsers(): Promise<AuthUser[]> {
    try {
      const users = await prisma.user.findMany({
        include: { accounts: true },
        orderBy: { createdAt: "desc" },
      });

      return users.map((user) => this.formatUser(user));
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    id: string,
    updates: { name?: string; avatar?: string },
  ): Promise<AuthUser | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updates,
        include: { accounts: true },
      });

      return this.formatUser(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return null;
    }
  }

  /**
   * Delete user and all related data
   */
  static async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  /**
   * Format user for API response
   */
  private static formatUser(
    user: PrismaUser & { accounts?: PrismaAccount[] },
  ): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
