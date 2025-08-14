export type Route = "home" | "explore" | "upload" | "recruiters";

// Updated Job interface to match API response
export interface Job {
  id: string;
  title: string;
  coreTitle?: string;
  description?: string;
  requirements?: string;
  location?: string;
  workType: "REMOTE" | "ONSITE" | "HYBRID" | "FLEXIBLE" | "UNKNOWN";
  jobTypes: (
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "TEMPORARY"
    | "INTERNSHIP"
    | "FREELANCE"
    | "VOLUNTEER"
    | "SEASONAL"
    | "UNKNOWN"
  )[];
  experience?: string;
  managementExperience?: string;
  category?: string;
  roleType?:
    | "INDIVIDUAL_CONTRIBUTOR"
    | "PEOPLE_MANAGER"
    | "TECHNICAL_LEAD"
    | "EXECUTIVE"
    | "CONSULTANT"
    | "UNKNOWN";
  seniorityLevel?:
    | "INTERN"
    | "ENTRY_LEVEL"
    | "MID_LEVEL"
    | "SENIOR_LEVEL"
    | "STAFF_LEVEL"
    | "PRINCIPAL_LEVEL"
    | "DIRECTOR_LEVEL"
    | "VP_LEVEL"
    | "C_LEVEL"
    | "UNKNOWN";
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applyUrl?: string;
  postedDate?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    website?: string;
    industry?: string;
    employees?: number;
    logo?: string;
  };
  skills: {
    id: string;
    name: string;
    category?: string;
  }[];
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: {
    workType?: string;
    seniorityLevel?: string;
    category?: string;
    skills?: string;
    location?: string;
    salaryRange?: {
      min?: string;
      max?: string;
    };
  };
}

export interface JobStats {
  totalJobs: number;
  recentJobs: number;
  workTypeDistribution: Record<string, number>;
  seniorityDistribution: Record<string, number>;
  topCategories: {
    category: string;
    count: number;
  }[];
}

export interface Candidate {
  id: number;
  name: string;
  title: string;
  stack: string[];
  impact: string;
  lane: string;
}

export interface NavigationProps {
  onExplore: () => void;
  onUpload: () => void;
}

export interface ProjectItem {
  name: string;
  meta: string;
  tags: string[];
}

export type ViewMode = "grid" | "graph" | "kanban" | "table";

export interface FilterProps {
  title: string;
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
}
