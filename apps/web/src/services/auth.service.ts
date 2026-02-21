import { apiClient } from "../lib/api-client";
import type {
  LoginInput,
  RegisterRequest,
  AuthResponse,
  User,
  ResetPasswordRequest,
} from "../types/auth";
import { ApiResponse } from "@postly/shared-types";

export const authService = {
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      data,
    );
    const authData = response.data.data;

    if (!authData) throw new Error("No data received");

    // Store token in localStorage
    if (authData.access_token) {
      localStorage.setItem("access_token", authData.access_token);
    }

    return authData;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Map frontend specific fields to backend expected format if needed
    // The shared type CreateUserInput expects: email, password, full_name, role
    const payload = {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role: data.role,
    };

    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      payload,
    );
    const authData = response.data.data;

    if (!authData) throw new Error("No data received");

    // Store token in localStorage
    if (authData.access_token) {
      localStorage.setItem("access_token", authData.access_token);
    }

    return authData;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post("/auth/forgot-password", { email });
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post("/auth/reset-password", {
      token: data.token,
      password: data.password,
    });
  },

  logout(): void {
    localStorage.removeItem("access_token");
  },

  getToken(): string | null {
    return localStorage.getItem("access_token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>("/auth/me");
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || "Failed to fetch user");
    }
    return response.data.data;
  },
};
