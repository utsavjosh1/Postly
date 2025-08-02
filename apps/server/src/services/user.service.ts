import { prisma } from "@repo/db";

export interface GoogleUserData {
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

export class UserService {
  /**
   * Find user by ID
   */
  static async findById(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          accounts: true,
        },
      });
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          accounts: true,
        },
      });
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  /**
   * Find or create user from Google OAuth data
   */
  static async findOrCreateGoogleUser(googleData: GoogleUserData) {
    try {
      // First, try to find existing user by email
      let user = await this.findByEmail(googleData.email);

      if (user) {
        // User exists, check if they have a Google account linked
        const googleAccount = user.accounts.find(
          (account) => account.provider === "google"
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
            },
          });
        } else {
          // Update existing Google account tokens
          await prisma.account.update({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: googleData.googleId,
              },
            },
            data: {
              access_token: googleData.accessToken,
              refresh_token: googleData.refreshToken,
            },
          });
        }

        // Update user info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: googleData.name || user.name,
            avatar: googleData.avatar || user.avatar,
          },
          include: {
            accounts: true,
          },
        });
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
              },
            },
          },
          include: {
            accounts: true,
          },
        });
      }

      return user;
    } catch (error) {
      console.error("Error in findOrCreateGoogleUser:", error);
      throw error;
    }
  }

  /**
   * Create a new session for user
   */
  static async createSession(userId: string, sessionToken: string, expires: Date) {
    try {
      return await prisma.session.create({
        data: {
          userId,
          sessionToken,
          expires,
        },
      });
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }

  /**
   * Find session by token
   */
  static async findSessionByToken(sessionToken: string) {
    try {
      return await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            include: {
              accounts: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error finding session:", error);
      throw error;
    }
  }

  /**
   * Delete session
   */
  static async deleteSession(sessionToken: string) {
    try {
      return await prisma.session.delete({
        where: { sessionToken },
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  }
}
