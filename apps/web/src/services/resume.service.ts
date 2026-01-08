import { apiClient } from "../lib/api-client";
import type { Resume, ApiResponse } from "@postly/shared-types";

export const resumeService = {
  async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append("resume", file);

    const response = await apiClient.post<ApiResponse<Resume>>(
      "/resumes/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to upload resume",
      );
    }

    return response.data.data;
  },

  async getResumes(): Promise<Resume[]> {
    const response = await apiClient.get<ApiResponse<Resume[]>>("/resumes");

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || "Failed to get resumes");
    }

    return response.data.data;
  },

  async getResumeById(id: string): Promise<Resume> {
    const response = await apiClient.get<ApiResponse<Resume>>(`/resumes/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || "Failed to get resume");
    }

    return response.data.data;
  },

  async deleteResume(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/resumes/${id}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to delete resume",
      );
    }
  },

  async reanalyzeResume(id: string): Promise<Resume> {
    const response = await apiClient.post<ApiResponse<Resume>>(
      `/resumes/${id}/reanalyze`,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to reanalyze resume",
      );
    }

    return response.data.data;
  },
};
