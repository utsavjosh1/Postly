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
