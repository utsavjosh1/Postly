import type {
  LoginInput,
  CreateUserInput,
  AuthResponse,
  User,
  ApiResponse,
} from "@postly/shared-types";

// Re-export for convenience
export type { LoginInput, CreateUserInput, AuthResponse, User, ApiResponse };
export type LoginRequest = LoginInput;

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Frontend specific forms often need slightly different inputs (e.g. confirmPassword)
export interface RegisterRequest extends CreateUserInput {
  confirmPassword?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword?: string;
}
