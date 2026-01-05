import { pool } from '../pool';
import type { Job, CreateJobInput, JobSearchFilters, JobSource } from '@postly/shared-types';

interface ScrapedJobInput {
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
  embedding?: number[];
}

export const jobQueries = {
  async create(input: CreateJobInput, employerId?: string): Promise<Job> {
    const result = await pool.query<Job>(
      `INSERT INTO jobs (
        title, company_name, description, location, salary_min, salary_max,
        job_type, remote, source, skills_required, experience_required, expires_at, employer_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        input.title,
        input.company_name,
        input.description,
        input.location,
        input.salary_min,
        input.salary_max,
        input.job_type,
        input.remote || false,
        employerId ? 'company_direct' : 'indeed',
        JSON.stringify(input.skills_required || []),
        input.experience_required,
        input.expires_at,
        employerId,
      ]
    );
    return result.rows[0];
  },

  async findBySourceUrl(sourceUrl: string): Promise<Job | null> {
    const result = await pool.query<Job>(
      `SELECT * FROM jobs WHERE source_url = $1`,
      [sourceUrl]
    );
    return result.rows[0] || null;
  },

  async upsertFromScraper(input: ScrapedJobInput): Promise<Job> {
    // Check if job already exists by source_url
    const existing = await this.findBySourceUrl(input.source_url);
    if (existing) {
      // Update existing job
      const result = await pool.query<Job>(
        `UPDATE jobs SET
          title = $1, description = $2, location = $3, salary_min = $4, salary_max = $5,
          job_type = $6, remote = $7, skills_required = $8, experience_required = $9,
          embedding = $10, updated_at = NOW()
        WHERE source_url = $11
        RETURNING *`,
        [
          input.title,
          input.description,
          input.location,
          input.salary_min,
          input.salary_max,
          input.job_type,
          input.remote || false,
          JSON.stringify(input.skills_required || []),
          input.experience_required,
          input.embedding ? JSON.stringify(input.embedding) : null,
          input.source_url,
        ]
      );
      return result.rows[0];
    }

    // Insert new job
    const result = await pool.query<Job>(
      `INSERT INTO jobs (
        title, company_name, description, location, salary_min, salary_max,
        job_type, remote, source, source_url, skills_required, experience_required,
        posted_at, embedding
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        input.title,
        input.company_name,
        input.description,
        input.location,
        input.salary_min,
        input.salary_max,
        input.job_type,
        input.remote || false,
        input.source,
        input.source_url,
        JSON.stringify(input.skills_required || []),
        input.experience_required,
        input.posted_at,
        input.embedding ? JSON.stringify(input.embedding) : null,
      ]
    );
    return result.rows[0];
  },

  async findActive(filters?: JobSearchFilters, limit = 50, offset = 0): Promise<Job[]> {
    let query = `SELECT * FROM jobs WHERE is_active = true`;
    const values: unknown[] = [];
    let paramIndex = 1;

    if (filters?.location) {
      query += ` AND location ILIKE $${paramIndex}`;
      values.push(`%${filters.location}%`);
      paramIndex++;
    }

    if (filters?.job_type) {
      query += ` AND job_type = $${paramIndex}`;
      values.push(filters.job_type);
      paramIndex++;
    }

    if (filters?.remote !== undefined) {
      query += ` AND remote = $${paramIndex}`;
      values.push(filters.remote);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query<Job>(query, values);
    return result.rows;
  },

  async findById(id: string): Promise<Job | null> {
    const result = await pool.query<Job>(`SELECT * FROM jobs WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async findMatchingByEmbedding(embedding: number[], limit = 20): Promise<(Job & { similarity: number })[]> {
    const result = await pool.query<Job & { similarity: number }>(
      `SELECT *, 1 - (embedding <=> $1::vector) as similarity
       FROM jobs
       WHERE is_active = true AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [JSON.stringify(embedding), limit]
    );
    return result.rows;
  },

  async countActive(): Promise<number> {
    const result = await pool.query<{ count: string }>('SELECT COUNT(*) FROM jobs WHERE is_active = true');
    return parseInt(result.rows[0].count, 10);
  },
};
