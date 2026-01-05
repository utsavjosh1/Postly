import { create } from 'zustand';
import type { Resume } from '@postly/shared-types';

interface ResumeState {
  resumes: Resume[];
  activeResume: Resume | null;
  isUploading: boolean;
  uploadProgress: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setResumes: (resumes: Resume[]) => void;
  addResume: (resume: Resume) => void;
  setActiveResume: (resume: Resume | null) => void;
  removeResume: (id: string) => void;
  updateResume: (resume: Resume) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  resumes: [],
  activeResume: null,
  isUploading: false,
  uploadProgress: 0,
  isLoading: false,
  error: null,

  setResumes: (resumes) => set({ resumes }),

  addResume: (resume) =>
    set((state) => ({
      resumes: [resume, ...state.resumes],
      activeResume: resume,
    })),

  setActiveResume: (resume) => set({ activeResume: resume }),

  removeResume: (id) =>
    set((state) => ({
      resumes: state.resumes.filter((r) => r.id !== id),
      activeResume: state.activeResume?.id === id ? null : state.activeResume,
    })),

  updateResume: (resume) =>
    set((state) => ({
      resumes: state.resumes.map((r) => (r.id === resume.id ? resume : r)),
      activeResume: state.activeResume?.id === resume.id ? resume : state.activeResume,
    })),

  setUploading: (uploading) => set({ isUploading: uploading }),

  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      resumes: [],
      activeResume: null,
      isUploading: false,
      uploadProgress: 0,
      isLoading: false,
      error: null,
    }),
}));
