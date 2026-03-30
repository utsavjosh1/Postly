import { apiClient } from "../lib/api-client";
import {
  User,
  SeekerProfile,
  EmployerProfile,
  ApiResponse,
} from "@postly/shared-types";

export const userService = {
  // Base Profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>("/users/profile");
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to fetch profile",
      );
    }
    return response.data.data;
  },

  async updateProfile(data: { full_name?: string }): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
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

  // Seeker Profile
  async getSeekerProfile(): Promise<SeekerProfile> {
    const response = await apiClient.get<ApiResponse<SeekerProfile>>(
      "/users/seeker-profile",
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to fetch seeker profile",
      );
    }
    return response.data.data;
  },

  async updateSeekerProfile(
    data: Partial<SeekerProfile>,
  ): Promise<SeekerProfile> {
    const response = await apiClient.patch<ApiResponse<SeekerProfile>>(
      "/users/seeker-profile",
      data,
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to update seeker profile",
      );
    }
    return response.data.data;
  },

  // Employer Profile
  async getEmployerProfile(): Promise<EmployerProfile> {
    const response = await apiClient.get<ApiResponse<EmployerProfile>>(
      "/users/employer-profile",
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to fetch employer profile",
      );
    }
    return response.data.data;
  },

  async updateEmployerProfile(
    data: Partial<EmployerProfile>,
  ): Promise<EmployerProfile> {
    const response = await apiClient.patch<ApiResponse<EmployerProfile>>(
      "/users/employer-profile",
      data,
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to update employer profile",
      );
    }
    return response.data.data;
  },

  // Security
  async changePassword(data: any): Promise<void> {
    const response = await apiClient.post<ApiResponse<any>>(
      "/users/change-password",
      data,
    );
    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to update password",
      );
    }
  },

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      "/users/upload-avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to upload avatar",
      );
    }
    return response.data.data.url;
  },
};
