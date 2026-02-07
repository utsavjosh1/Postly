import { z } from "zod";

export const JobTypeSchema = z.enum([
  "full-time",
  "part-time",
  "contract",
  "internship",
]);

export const ScrapedJobSchema = z.object({
  title: z.string().min(1),
  company_name: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  job_type: JobTypeSchema.optional(),
  remote: z.boolean().default(false),
  source_url: z.string().url(),
  skills_required: z.array(z.string()).optional(),
  experience_required: z.string().optional(),
  posted_at: z.coerce.date().optional(),
  expires_at: z.coerce.date().optional(),
});

export type ScrapedJob = z.infer<typeof ScrapedJobSchema>;

// Optimized job match schema for UI-ready responses
export const JobSourceSchema = z.enum([
  "indeed",
  "linkedin",
  "company_direct",
  "remote_co",
  "remote_ok",
  "weworkremotely",
  "google_jobs",
  "generic",
]);

export const OptimizedJobMatchSchema = z.object({
  id: z.string(),
  display_info: z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    logo_url: z.string().optional(),
    source: JobSourceSchema,
  }),
  matching_data: z.object({
    match_score: z.number().min(0).max(100),
    ai_explanation: z.string().optional(),
    key_skills: z.array(z.string()),
  }),
  meta: z.object({
    posted_at: z.string().optional(),
    apply_url: z.string().optional(),
    remote: z.boolean(),
    salary_range: z.string().optional(),
  }),
});

export type OptimizedJobMatchType = z.infer<typeof OptimizedJobMatchSchema>;
