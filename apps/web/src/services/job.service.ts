import { apiClient } from "../lib/api-client";
import type {
  Job,
  JobMatch,
  ApiResponse,
  JobSearchFilters,
} from "@postly/shared-types";

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

interface MatchedJob extends Job {
  match_score: number;
  ai_explanation?: string;
}

export const jobService = {
  async getJobs(
    filters?: JobSearchFilters,
    limit = 50,
    offset = 0,
  ): Promise<JobsResponse> {
    const params = new URLSearchParams();
    if (filters?.location) params.append("location", filters.location);
    if (filters?.job_type) params.append("job_type", filters.job_type);
    if (filters?.remote !== undefined)
      params.append("remote", String(filters.remote));
    params.append("limit", String(limit));
    params.append("offset", String(offset));

    const response = await apiClient.get<ApiResponse<JobsResponse>>(
      `/jobs?${params.toString()}`,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || "Failed to get jobs");
    }

    return response.data.data;
  },

  async getJobById(id: string): Promise<Job> {
    const response = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || "Failed to get job");
    }

    return response.data.data;
  },

  async getMatches(
    resumeId: string,
    withExplanations = false,
    limit = 20,
  ): Promise<MatchedJob[]> {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    if (withExplanations) params.append("with_explanations", "true");

    const response = await apiClient.get<ApiResponse<MatchedJob[]>>(
      `/jobs/matches/${resumeId}?${params.toString()}`,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || "Failed to get matches");
    }

    return response.data.data;
  },

  async saveJob(
    jobId: string,
    resumeId: string,
    matchScore: number,
    explanation?: string,
  ): Promise<JobMatch> {
    const response = await apiClient.post<ApiResponse<JobMatch>>(
      `/jobs/matches/${jobId}/save`,
      {
        resume_id: resumeId,
        match_score: matchScore,
        explanation,
      },
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || "Failed to save job");
    }

    return response.data.data;
  },

  async unsaveJob(jobId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/jobs/matches/${jobId}/save`,
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to unsave job");
    }
  },

  async getSavedJobs(): Promise<(JobMatch & { job: Job })[]> {
    const response =
      await apiClient.get<ApiResponse<(JobMatch & { job: Job })[]>>(
        "/jobs/saved",
      );

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.error?.message || "Failed to get saved jobs",
      );
    }

    return response.data.data;
  },

  async markAsApplied(jobId: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/jobs/matches/${jobId}/apply`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to mark as applied",
      );
    }
  },
};
