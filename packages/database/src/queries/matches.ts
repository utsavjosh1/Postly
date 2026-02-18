import { eq, desc } from "drizzle-orm";
import { db } from "../index";
import { job_matches, jobs } from "../schema";
import type { JobMatch, Job } from "@postly/shared-types";

export const matchQueries = {
  /**
   * Create or update a job match (upserts on user_id + job_id)
   */
  async create(
    userId: string,
    resumeId: string,
    jobId: string,
    matchScore: number,
    aiExplanation: string,
  ): Promise<JobMatch> {
    const [result] = await db
      .insert(job_matches)
      .values({
        user_id: userId,
        resume_id: resumeId,
        job_id: jobId,
        match_score: matchScore.toString(),
        ai_explanation: aiExplanation,
        is_saved: false,
      })
      .onConflictDoUpdate({
        target: [job_matches.user_id, job_matches.job_id],
        set: {
          match_score: matchScore.toString(),
          ai_explanation: aiExplanation,
          created_at: new Date(),
        },
      })
      .returning();

    return result as unknown as JobMatch;
  },

  /**
   * Get matches for a user with joined job data
   */
  async findByUser(userId: string, limit = 20): Promise<JobMatch[]> {
    const results = await db
      .select({
        match: job_matches,
        job: {
          title: jobs.title,
          company_name: jobs.company_name,
          location: jobs.location,
          remote: jobs.remote,
        },
      })
      .from(job_matches)
      .innerJoin(jobs, eq(job_matches.job_id, jobs.id))
      .where(eq(job_matches.user_id, userId))
      .orderBy(desc(job_matches.match_score), desc(job_matches.created_at))
      .limit(limit);

    return results.map(({ match, job }) => ({
      ...match,
      job: job as unknown as Job,
    })) as unknown as JobMatch[];
  },

  /**
   * Toggle the saved status of a match
   */
  async markSaved(matchId: string, isSaved: boolean): Promise<void> {
    await db
      .update(job_matches)
      .set({ is_saved: isSaved })
      .where(eq(job_matches.id, matchId));
  },

  /**
   * Mark a match as applied
   */
  async markApplied(matchId: string): Promise<void> {
    await db
      .update(job_matches)
      .set({ applied: true })
      .where(eq(job_matches.id, matchId));
  },
};
