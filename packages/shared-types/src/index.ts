// User types
export type UserRole = "job_seeker" | "employer" | "admin";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_verified: boolean;
  password_reset_token?: string;
  password_reset_expires_at?: Date;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
}

/** DB-level input for creating a user (password already hashed) */
export interface CreateUserDbInput {
  email: string;
  password_hash: string;
  full_name?: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, "password_hash">;
  access_token: string;
  refresh_token?: string;
}

// Resume types
export interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  parsed_text?: string;
  skills?: string[];
  experience_years?: number;
  education?: EducationEntry[];
  embedding?: number[] | string;
  created_at: Date;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year?: number;
  field_of_study?: string;
}

export interface ResumeAnalysis {
  skills: string[];
  experience_years: number;
  education: EducationEntry[];
  summary: string;
}

// Job types
export type JobType = "full-time" | "part-time" | "contract" | "internship";
export type JobSource =
  | "indeed"
  | "linkedin"
  | "company_direct"
  | "remote_co"
  | "remote_ok"
  | "weworkremotely"
  | "google_jobs"
  | "generic";
export type JobStatus = "active" | "expired" | "filled";

export interface Job {
  id: string;
  title: string;
  company_name: string;
  description: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: JobType;
  remote: boolean;
  source: JobSource;
  source_url?: string;
  skills_required?: string[];
  experience_required?: string;
  posted_at?: Date;
  expires_at?: Date;
  is_active: boolean;
  employer_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateJobInput {
  title: string;
  company_name: string;
  description: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: JobType;
  remote?: boolean;
  skills_required?: string[];
  experience_required?: string;
  expires_at?: Date;
}

/** Input from web scrapers — used by the scraper service to upsert jobs */
export interface ScrapedJobInput {
  title: string;
  company_name: string;
  description: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  remote?: boolean;
  source: JobSource;
  source_url: string;
  skills_required?: string[];
  experience_required?: string;
  posted_at?: Date;
  expires_at?: Date;
  embedding?: number[];
}

// Job Match types
export interface JobMatch {
  id: string;
  user_id: string;
  resume_id: string;
  job_id: string;
  match_score: number;
  ai_explanation: string;
  is_saved: boolean;
  applied: boolean;
  created_at: Date;
  job?: Job;
}

// Optimized Job Match for UI (no embeddings, grouped for scannability)
export interface OptimizedJobMatch {
  id: string;
  display_info: {
    title: string;
    company: string;
    location: string;
    logo_url?: string;
    source: JobSource;
  };
  matching_data: {
    match_score: number;
    ai_explanation?: string;
    key_skills: string[];
  };
  meta: {
    posted_at?: string; // ISO 8601
    apply_url?: string;
    remote: boolean;
    salary_range?: string;
  };
}

export interface MatchJobsInput {
  resume_id: string;
  filters?: JobSearchFilters;
  limit?: number;
}

export interface JobSearchFilters {
  location?: string;
  job_type?: JobType;
  remote?: boolean;
  salary_min?: number;
  skills?: string[];
}

// Bot Subscription types
export type CommunityType = "discord" | "reddit";
export type SubscriptionTier = "basic" | "premium";

export interface BotSubscription {
  id: string;
  community_type: CommunityType;
  community_id: string;
  admin_user_id: string;
  filter_criteria?: JobSearchFilters;
  is_active: boolean;
  subscription_tier: SubscriptionTier;
  expires_at?: Date;
  created_at: Date;
}

// Scraping types
export type ScrapingStatus = "pending" | "running" | "completed" | "failed";

export interface ScrapingJob {
  id: string;
  source: JobSource;
  status: ScrapingStatus;
  jobs_scraped: number;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

// AI Chat types
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  resume_id?: string;
}

export interface ChatResponse {
  message: string;
  suggestions?: JobMatch[];
  resume_feedback?: ResumeFeedback;
}

export interface ResumeFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  ats_score: number;
}

// Enhanced Chat types for persistence
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  resume_id: string | null;
  model?: string;
  is_archived: boolean;
  state?: ConversationState;
  last_message_at: Date;
  created_at: Date;
  updated_at: Date;
}

export type ConversationState =
  | "idle"
  | "typing"
  | "thinking"
  | "streaming"
  | "completed"
  | "error"
  | "interrupted";

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;

  /** Self-referencing — forms a message tree for branching */
  parent_message_id?: string | null;
  /** Edit version number (1 = original, 2+ = edits) */
  version: number;
  /** Only the active branch is rendered in the UI */
  is_active: boolean;
  /** Streaming lifecycle: sending → streaming → completed / cancelled / error */
  status: MessageStreamStatus;

  metadata?: MessageMetadata;
  created_at: Date;
}

/** Streaming lifecycle status stored in DB */
export type MessageStreamStatus =
  | "sending"
  | "streaming"
  | "completed"
  | "cancelled"
  | "error";

/** @deprecated Use MessageStreamStatus instead */
export type MessageStatus = "sending" | "sent" | "delivered" | "error";

export interface MessageMetadata {
  job_matches?: OptimizedJobMatch[];
  resume_feedback?: ResumeFeedback;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  timing?: {
    start: number;
    end: number;
    duration: number;
  };
}

export interface CreateConversationRequest {
  resume_id?: string;
  initial_message?: string;
}

export interface SendMessageRequest {
  message: string;
  conversation_id: string;
}

export interface StreamChatResponse {
  type: "chunk" | "complete" | "error" | "metadata";
  content?: string;
  metadata?: MessageMetadata;
  message_id?: string;
  error?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const AI_ERROR_CODES = {
  QUOTA_EXCEEDED: "AI_QUOTA_EXCEEDED",
  TIMEOUT: "AI_TIMEOUT",
  POLICY_VIOLATION: "AI_POLICY_VIOLATION",
  SERVER_ERROR: "AI_SERVER_ERROR",
  UNKNOWN: "AI_UNKNOWN_ERROR",
} as const;

export type AIErrorCode = (typeof AI_ERROR_CODES)[keyof typeof AI_ERROR_CODES];

export * from "./schemas.js";
