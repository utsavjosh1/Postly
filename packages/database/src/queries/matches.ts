import { pool } from '../pool';
import type { JobMatch } from '@postly/shared-types';

export const matchQueries = {
  async create(
    userId: string,
    resumeId: string,
    jobId: string,
    matchScore: number,
    aiExplanation: string
  ): Promise<JobMatch> {
    const result = await pool.query<JobMatch>(
      `INSERT INTO job_matches (user_id, resume_id, job_id, match_score, ai_explanation)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, job_id) DO UPDATE
       SET match_score = $4, ai_explanation = $5, created_at = NOW()
       RETURNING *`,
      [userId, resumeId, jobId, matchScore, aiExplanation]
    );
    return result.rows[0];
  },

  async findByUser(userId: string, limit = 20): Promise<JobMatch[]> {
    const result = await pool.query<JobMatch>(
      `SELECT m.*, j.title, j.company_name, j.location, j.remote
       FROM job_matches m
       JOIN jobs j ON m.job_id = j.id
       WHERE m.user_id = $1
       ORDER BY m.match_score DESC, m.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async markSaved(matchId: string, isSaved: boolean): Promise<void> {
    await pool.query(
      `UPDATE job_matches SET is_saved = $2 WHERE id = $1`,
      [matchId, isSaved]
    );
  },

  async markApplied(matchId: string): Promise<void> {
    await pool.query(
      `UPDATE job_matches SET applied = true WHERE id = $1`,
      [matchId]
    );
  },
};
