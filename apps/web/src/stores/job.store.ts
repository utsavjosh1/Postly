import { create } from 'zustand';
import type { Job, JobSearchFilters } from '@postly/shared-types';

interface MatchedJob extends Job {
  match_score: number;
  ai_explanation?: string;
}

interface JobState {
  jobs: Job[];
  matches: MatchedJob[];
  savedJobIds: Set<string>;
  selectedJob: Job | null;
  filters: JobSearchFilters;
  isLoading: boolean;
  isMatchLoading: boolean;
  totalJobs: number;
  currentPage: number;
  error: string | null;

  // Actions
  setJobs: (jobs: Job[], total: number) => void;
  setMatches: (matches: MatchedJob[]) => void;
  setSelectedJob: (job: Job | null) => void;
  setFilters: (filters: Partial<JobSearchFilters>) => void;
  clearFilters: () => void;
  saveJob: (jobId: string) => void;
  unsaveJob: (jobId: string) => void;
  setLoading: (loading: boolean) => void;
  setMatchLoading: (loading: boolean) => void;
  setPage: (page: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialFilters: JobSearchFilters = {};

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  matches: [],
  savedJobIds: new Set(),
  selectedJob: null,
  filters: initialFilters,
  isLoading: false,
  isMatchLoading: false,
  totalJobs: 0,
  currentPage: 1,
  error: null,

  setJobs: (jobs, total) => set({ jobs, totalJobs: total }),

  setMatches: (matches) => set({ matches }),

  setSelectedJob: (job) => set({ selectedJob: job }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1, // Reset page when filters change
    })),

  clearFilters: () => set({ filters: initialFilters, currentPage: 1 }),

  saveJob: (jobId) =>
    set((state) => ({
      savedJobIds: new Set(state.savedJobIds).add(jobId),
    })),

  unsaveJob: (jobId) =>
    set((state) => {
      const newSet = new Set(state.savedJobIds);
      newSet.delete(jobId);
      return { savedJobIds: newSet };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setMatchLoading: (loading) => set({ isMatchLoading: loading }),

  setPage: (page) => set({ currentPage: page }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      jobs: [],
      matches: [],
      savedJobIds: new Set(),
      selectedJob: null,
      filters: initialFilters,
      isLoading: false,
      isMatchLoading: false,
      totalJobs: 0,
      currentPage: 1,
      error: null,
    }),
}));
