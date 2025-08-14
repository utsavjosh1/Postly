import {
  AuthService,
  type AuthUser,
  type GoogleUserData,
} from "./auth.service";

export type { AuthUser, GoogleUserData };

export class UserService {
  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<AuthUser | null> {
    return AuthService.findUserById(id);
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<AuthUser | null> {
    return AuthService.findUserByEmail(email);
  }

  /**
   * Find or create user from Google OAuth data
   */
  static async findOrCreateGoogleUser(
    googleData: GoogleUserData,
  ): Promise<AuthUser> {
    return AuthService.findOrCreateGoogleUser(googleData);
  }

  /**
   * Get all users
   */
  static async getAllUsers(): Promise<AuthUser[]> {
    return AuthService.getAllUsers();
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    id: string,
    updates: { name?: string; avatar?: string },
  ): Promise<AuthUser | null> {
    return AuthService.updateUserProfile(id, updates);
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string): Promise<boolean> {
    return AuthService.deleteUser(id);
  }
}

// Export as default for backward compatibility
export default UserService;
