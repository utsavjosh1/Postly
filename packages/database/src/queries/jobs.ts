import { pool } from '../pool';
import type { Job, CreateJobInput, JobSearchFilters } from '@postly/shared-types';

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
};
