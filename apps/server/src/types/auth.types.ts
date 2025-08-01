export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  created_at: string;
  updated_at?: string;
  role?: string;
  provider?: "email" | "google";
}

export interface AuthResponse {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  } | null;
  error?: string;
}

export interface GoogleAuthResponse {
  user: User | null;
  success: boolean;
  error?: string;
  redirect_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export type UserRole = "admin" | "user" | "moderator";

export interface TokenPayload {
  sub: string;
  user_id: string;
  email: string;
  role: UserRole;
  provider?: "email" | "google";
  iat?: number;
  exp?: number;
}
