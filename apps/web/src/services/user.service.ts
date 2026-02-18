import { apiClient } from "../lib/api-client";
import type { User, ApiResponse } from "@postly/shared-types";

export const userService = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>("/auth/me");
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to fetch profile",
      );
    }
    return response.data.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      "/users/profile",
      data,
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to update profile",
      );
    }
    return response.data.data;
  },
};
