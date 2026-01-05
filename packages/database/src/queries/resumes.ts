import { pool } from '../pool';
import type { Resume } from '@postly/shared-types';

export const resumeQueries = {
  async create(userId: string, fileUrl: string): Promise<Resume> {
    const result = await pool.query<Resume>(
      `INSERT INTO resumes (user_id, file_url)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, fileUrl]
    );
    return result.rows[0];
  },

  async findByUserId(userId: string): Promise<Resume[]> {
    const result = await pool.query<Resume>(
      `SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findById(id: string): Promise<Resume | null> {
    const result = await pool.query<Resume>(
      `SELECT * FROM resumes WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async updateAnalysis(
    id: string,
    parsedText: string,
    skills: string[],
    experienceYears: number,
    education: unknown,
    embedding: number[]
  ): Promise<Resume | null> {
    const result = await pool.query<Resume>(
      `UPDATE resumes
       SET parsed_text = $2, skills = $3, experience_years = $4, education = $5, embedding = $6
       WHERE id = $1
       RETURNING *`,
      [id, parsedText, JSON.stringify(skills), experienceYears, JSON.stringify(education), JSON.stringify(embedding)]
    );
    return result.rows[0] || null;
  },
};
