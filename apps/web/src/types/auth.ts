export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  userType: "job_seeker" | "employer";
}

export interface User {
  id: string;
  name: string;
  email: string;
  userType: "job_seeker" | "employer";
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
