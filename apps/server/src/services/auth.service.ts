import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { supabaseAdmin, supabase } from "../config/supabase";
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

export class AuthService {
  // Register a new user
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const { email, password, full_name, username } = data;

      // Check if user already exists by email
      const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        return {
          user: null,
          session: null,
          error: "Failed to check existing users",
        };
      }

      const existingUser = userList.users.find(user => user.email === email);
      
      if (existingUser) {
        return {
          user: null,
          session: null,
          error: "User already exists with this email",
        };
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          username,
          role: "user",
        },
      });

      if (authError || !authData.user) {
        return {
          user: null,
          session: null,
          error: authError?.message || "Failed to create user",
        };
      }

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          email,
          full_name,
          username,
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // User is created but profile failed - this is recoverable
      }

      // Sign in the user to get session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.session) {
        return {
          user: null,
          session: null,
          error: "User created but failed to sign in",
        };
      }

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          full_name,
          username,
          created_at: authData.user.created_at,
          role: "user",
        },
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          expires_in: signInData.session.expires_in || 3600,
          token_type: signInData.session.token_type || "bearer",
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

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.session || !authData.user) {
        return {
          user: null,
          session: null,
          error: authError?.message || "Invalid credentials",
        };
      }

      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          full_name: profile?.full_name || authData.user.user_metadata?.full_name,
          username: profile?.username || authData.user.user_metadata?.username,
          avatar_url: profile?.avatar_url,
          website: profile?.website,
          created_at: authData.user.created_at,
          updated_at: profile?.updated_at,
          role: authData.user.user_metadata?.role || "user",
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in || 3600,
          token_type: authData.session.token_type || "bearer",
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
      const { error } = await supabaseAdmin.auth.admin.signOut(token);
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Internal server error during logout" };
    }
  }

  // Refresh token
  static async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    try {
      const { refresh_token } = data;

      const { data: authData, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error || !authData.session || !authData.user) {
        return {
          user: null,
          session: null,
          error: error?.message || "Failed to refresh token",
        };
      }

      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          full_name: profile?.full_name || authData.user.user_metadata?.full_name,
          username: profile?.username || authData.user.user_metadata?.username,
          avatar_url: profile?.avatar_url,
          website: profile?.website,
          created_at: authData.user.created_at,
          updated_at: profile?.updated_at,
          role: authData.user.user_metadata?.role || "user",
        },
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in || 3600,
          token_type: authData.session.token_type || "bearer",
        },
      };
    } catch (error) {
      console.error("Token refresh error:", error);
      return {
        user: null,
        session: null,
        error: "Internal server error during token refresh",
      };
    }
  }

  // Get user by token
  static async getUserByToken(token: string): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return {
        id: user.id,
        email: user.email!,
        full_name: profile?.full_name || user.user_metadata?.full_name,
        username: profile?.username || user.user_metadata?.username,
        avatar_url: profile?.avatar_url,
        website: profile?.website,
        created_at: user.created_at,
        updated_at: profile?.updated_at,
        role: user.user_metadata?.role || "user",
      };
    } catch (error) {
      console.error("Get user error:", error);
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

      // Update profile in database
      const { data: updatedProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          username,
          full_name,
          avatar_url,
          website,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (profileError) {
        return {
          user: null,
          error: profileError.message,
        };
      }

      // Update user metadata in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            username,
            full_name,
          },
        }
      );

      if (authError) {
        console.error("Auth metadata update error:", authError);
      }

      return {
        user: {
          id: userId,
          email: updatedProfile.email || authData.user?.email || "",
          full_name: updatedProfile.full_name,
          username: updatedProfile.username,
          avatar_url: updatedProfile.avatar_url,
          website: updatedProfile.website,
          created_at: updatedProfile.created_at,
          updated_at: updatedProfile.updated_at,
          role: authData.user?.user_metadata?.role || "user",
        },
      };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        user: null,
        error: "Internal server error during profile update",
      };
    }
  }

  // Change password
  static async changePassword(userId: string, data: ChangePasswordRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { new_password } = data;

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: new_password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

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

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Password reset request error:", error);
      return {
        success: false,
        error: "Internal server error during password reset request",
      };
    }
  }

  // Generate custom JWT token (for additional security layers)
  static generateCustomToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: "jobbot-api",
      audience: "jobbot-client",
    } as jwt.SignOptions);
  }

  // Verify custom JWT token
  static verifyCustomToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        issuer: "jobbot-api",
        audience: "jobbot-client",
      } as jwt.VerifyOptions) as TokenPayload;
    } catch (error) {
      console.error("Token verification error:", error);
      return null;
    }
  }
}
