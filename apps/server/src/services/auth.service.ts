import { prisma } from "../config/prisma";
import type { User as PrismaUser } from "@repo/db";
import type { User } from "../types/auth.types";

export class AuthService {
  // Helper function to convert Prisma User to API User
  private static prismaUserToUser(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      full_name: user.name || undefined,
      username: undefined, // Not in current schema
      avatar_url: user.avatar || undefined,
      website: undefined, // Not in current schema
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt?.toISOString(),
      role: "user",
      provider: "google", // Since we're using OAuth
    };
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return null;
      }

      return this.prismaUserToUser(user);
    } catch (error) {
      console.error("Get user by ID error:", error);
      return null;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return null;
      }

      return this.prismaUserToUser(user);
    } catch (error) {
      console.error("Get user by email error:", error);
      return null;
    }
  }

  // Create or update user (for OAuth)
  static async createOrUpdateUser(userData: {
    email: string;
    name?: string;
    avatar?: string;
  }): Promise<User | null> {
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          avatar: userData.avatar,
          updatedAt: new Date(),
        },
        create: {
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
        },
      });

      return this.prismaUserToUser(user);
    } catch (error) {
      console.error("Create or update user error:", error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(
    id: string,
    updates: {
      name?: string;
      avatar?: string;
    }
  ): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      return this.prismaUserToUser(user);
    } catch (error) {
      console.error("Update user profile error:", error);
      return null;
    }
  }

  // Get all users (admin function)
  static async getAllUsers(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });

      return users.map((user) => this.prismaUserToUser(user));
    } catch (error) {
      console.error("Get all users error:", error);
      return [];
    }
  }

  // Delete user
  static async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Delete user error:", error);
      return false;
    }
  }
}
