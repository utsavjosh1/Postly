import { apiClient } from "../lib/api-client";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from "../types/auth";
import { ApiResponse } from "@postly/shared-types";

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", data);
    const authData = response.data.data;

    if (!authData) throw new Error("No data received");

    // Store token in localStorage
    if (authData.access_token) {
      localStorage.setItem("access_token", authData.access_token);
    }

    return authData;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", data);
    const authData = response.data.data;

    if (!authData) throw new Error("No data received");

    // Store token in localStorage
    if (authData.access_token) {
      localStorage.setItem("access_token", authData.access_token);
    }

    return authData;
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
    const response = await apiClient.get<{ data: User }>("/users/profile");
    return response.data.data!;
  },
};

