import { apiClient } from '../lib/api-client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);

    // Store token in localStorage
    if (response.data.accessToken) {
      localStorage.setItem('access_token', response.data.accessToken);
    }

    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    // Store token in localStorage
    if (response.data.accessToken) {
      localStorage.setItem('access_token', response.data.accessToken);
    }

    return response.data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
