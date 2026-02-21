import { eq, desc, and, sql, isNull, ilike } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { db } from "../index";
import { jobs } from "../schema";
import type {
  Job,
  CreateJobInput,
  ScrapedJobInput,
  JobSearchFilters,
} from "@postly/shared-types";

export const jobQueries = {
  /**
   * Create a new job posting (employer or direct)
   */
  async create(input: CreateJobInput, employerId?: string): Promise<Job> {
    const [result] = await db
      .insert(jobs)
      .values({
        title: input.title,
        company_name: input.company_name,
        description: input.description,
        location: input.location,
        salary_min: input.salary_min?.toString(),
        salary_max: input.salary_max?.toString(),
        job_type: input.job_type,
        remote: input.remote || false,
        source: employerId ? "company_direct" : "indeed",
        skills_required: input.skills_required || [],
        experience_required: input.experience_required,
        expires_at: input.expires_at,
        employer_id: employerId,
      })
      .returning();

    return result as unknown as Job;
  },

  /**
   * Find a job by its source URL (for dedup during scraping)
   */
  async findBySourceUrl(sourceUrl: string): Promise<Job | null> {
    const [result] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.source_url, sourceUrl));

    return (result as unknown as Job) || null;
  },

  /**
   * Upsert a scraped job — update if exists (by source_url), insert otherwise
   */
  async upsertFromScraper(input: ScrapedJobInput): Promise<Job> {
    const expiresAt =
      input.expires_at || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const existing = await this.findBySourceUrl(input.source_url);

    if (existing) {
      const [updated] = await db
        .update(jobs)
        .set({
          title: input.title,
          description: input.description,
          location: input.location,
          salary_min: input.salary_min?.toString(),
          salary_max: input.salary_max?.toString(),
          job_type: input.job_type,
          remote: input.remote || false,
          skills_required: input.skills_required || [],
          experience_required: input.experience_required,
          embedding: input.embedding,
          updated_at: new Date(),
          expires_at: expiresAt,
          is_active: true,
        })
        .where(eq(jobs.source_url, input.source_url))
        .returning();

      return updated as unknown as Job;
    }

    const [inserted] = await db
      .insert(jobs)
      .values({
        title: input.title,
        company_name: input.company_name,
        description: input.description,
        location: input.location,
        salary_min: input.salary_min?.toString(),
        salary_max: input.salary_max?.toString(),
        job_type: input.job_type,
        remote: input.remote || false,
        source: input.source,
        source_url: input.source_url,
        skills_required: input.skills_required || [],
        experience_required: input.experience_required,
        posted_at: input.posted_at,
        embedding: input.embedding,
        expires_at: expiresAt,
        is_active: true,
      })
      .returning();

    return inserted as unknown as Job;
  },

  /**
   * Find active jobs with optional filters and pagination
   */
  async findActive(
    filters?: JobSearchFilters,
    limit = 50,
    offset = 0,
  ): Promise<Job[]> {
    const conditions = [eq(jobs.is_active, true)];

    if (filters?.location) {
      conditions.push(ilike(jobs.location, `%${filters.location}%`));
    }
    if (filters?.job_type) {
      conditions.push(eq(jobs.job_type, filters.job_type));
    }
    if (filters?.remote !== undefined) {
      conditions.push(eq(jobs.remote, filters.remote));
    }

    const result = await db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.created_at))
      .limit(limit)
      .offset(offset);

    return result as unknown as Job[];
  },

  /**
   * Find job by ID
   */
  async findById(id: string): Promise<Job | null> {
    const [result] = await db.select().from(jobs).where(eq(jobs.id, id));

    return (result as unknown as Job) || null;
  },

  /**
   * Vector similarity search for matching jobs
   */
  async findMatchingByEmbedding(
    embedding: number[],
    limit = 20,
  ): Promise<(Job & { similarity: number })[]> {
    const similarity = sql<number>`1 - (${jobs.embedding} <=> ${JSON.stringify(embedding)}::vector)`;

    const result = await db
      .select({ ...getTableColumns(jobs), similarity })
      .from(jobs)
      .where(and(eq(jobs.is_active, true), sql`${jobs.embedding} IS NOT NULL`))
      .orderBy(sql`${jobs.embedding} <=> ${JSON.stringify(embedding)}::vector`)
      .limit(limit);

    return result as unknown as (Job & { similarity: number })[];
  },

  /**
   * Count total active jobs
   */
  async countActive(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(eq(jobs.is_active, true));

    return Number(result.count);
  },

  /**
   * Deactivate jobs that have expired
   */
  async deactivateExpiredJobs(): Promise<number> {
    const result = await db
      .update(jobs)
      .set({ is_active: false, updated_at: new Date() })
      .where(and(eq(jobs.is_active, true), sql`${jobs.expires_at} < NOW()`))
      .returning({ id: jobs.id });

    return result.length;
  },

  /**
   * Hard-delete jobs older than 1 year
   */
  async removeStaleJobs(): Promise<number> {
    const result = await db
      .delete(jobs)
      .where(sql`${jobs.created_at} < NOW() - INTERVAL '1 year'`)
      .returning({ id: jobs.id });

    return result.length;
  },

  /**
   * Mark a specific job as inactive by source URL
   */
  async markInactive(sourceUrl: string): Promise<void> {
    await db
      .update(jobs)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(jobs.source_url, sourceUrl));
  },

  /**
   * Mark a specific job as inactive by ID
   */
  async markInactiveById(id: string): Promise<void> {
    await db
      .update(jobs)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(jobs.id, id));
  },

  /**
   * Get random sample of active jobs for verification
   */
  async getRandomSample(limit = 10): Promise<Job[]> {
    const result = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.is_active, true), sql`${jobs.source_url} IS NOT NULL`))
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    return result as unknown as Job[];
  },

  /**
   * Get cleanup stats (total, active, expired, stale)
   */
  async getCleanupStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    expiredJobs: number;
    staleJobs: number;
  }> {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = true AND expires_at < NOW()) as expired,
        COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '1 year') as stale
      FROM jobs
    `);

    const row = result.rows[0] as Record<string, unknown>;
    return {
      totalJobs: Number(row.total),
      activeJobs: Number(row.active),
      expiredJobs: Number(row.expired),
      staleJobs: Number(row.stale),
    };
  },

  /**
   * Find active jobs that are missing embeddings
   */
  async findWithoutEmbeddings(limit = 100): Promise<Job[]> {
    const result = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.is_active, true), isNull(jobs.embedding)))
      .orderBy(desc(jobs.created_at))
      .limit(limit);

    return result as unknown as Job[];
  },

  /**
   * Update embedding for a specific job
   */
  async updateEmbedding(jobId: string, embedding: number[]): Promise<void> {
    await db
      .update(jobs)
      .set({ embedding, updated_at: new Date() })
      .where(eq(jobs.id, jobId));
  },

  /**
   * Vector search with optional filters
   */
  async vectorSearch(
    queryEmbedding: number[],
    limit = 20,
    filters?: JobSearchFilters,
  ): Promise<(Job & { similarity: number })[]> {
    const conditions = [
      eq(jobs.is_active, true),
      sql`${jobs.embedding} IS NOT NULL`,
    ];

    if (filters?.location) {
      conditions.push(ilike(jobs.location, `%${filters.location}%`));
    }
    if (filters?.job_type) {
      conditions.push(eq(jobs.job_type, filters.job_type));
    }
    if (filters?.remote !== undefined) {
      conditions.push(eq(jobs.remote, filters.remote));
    }

    const similarity = sql<number>`1 - (${jobs.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

    const result = await db
      .select({ ...getTableColumns(jobs), similarity })
      .from(jobs)
      .where(and(...conditions))
      .orderBy(
        sql`${jobs.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`,
      )
      .limit(limit);

    return result as unknown as (Job & { similarity: number })[];
  },
};
