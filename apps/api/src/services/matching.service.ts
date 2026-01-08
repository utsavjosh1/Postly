import { generateText, generateEmbedding } from "@postly/ai-utils";
import { resumeQueries, jobQueries } from "@postly/database";
import type { Job, JobMatch, Resume, EducationEntry } from "@postly/shared-types";
import { pool } from "@postly/database";

interface MatchedJob extends Job {
  match_score: number;
  ai_explanation?: string;
}

export class MatchingService {
  /**
   * Find jobs matching a resume using vector similarity
   */
  async findMatchingJobs(
    resumeId: string,
    userId: string,
    limit = 20,
  ): Promise<MatchedJob[]> {
    // Get resume with embedding
    const resume = await resumeQueries.findByIdWithUser(resumeId, userId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    // If resume doesn't have embedding, generate one
    let embedding: number[];
    if (resume.embedding) {
      // Parse embedding if stored as JSON string
      embedding =
        typeof resume.embedding === "string"
          ? JSON.parse(resume.embedding)
          : resume.embedding;
    } else if (resume.parsed_text) {
      // Generate embedding from parsed text
      const embeddingText = `Skills: ${resume.skills?.join(", ") || "Not specified"}. Experience: ${resume.experience_years || 0} years. ${resume.parsed_text.substring(0, 1000)}`;
      embedding = await generateEmbedding(embeddingText);
    } else {
      throw new Error("Resume has no content to match against");
    }

    // Find matching jobs using vector similarity
    const matchedJobs = await jobQueries.findMatchingByEmbedding(
      embedding,
      limit,
    );

    // Convert similarity to percentage score
    return matchedJobs.map((job: any) => ({
      ...job,
      match_score: Math.round(job.similarity * 100),
    }));
  }

  /**
   * Get matches with AI explanations for top jobs
   */
  async getMatchesWithExplanations(
    resumeId: string,
    userId: string,
    limit = 10,
  ): Promise<MatchedJob[]> {
    const matches = await this.findMatchingJobs(resumeId, userId, limit);

    // Get resume for context
    const resume = await resumeQueries.findByIdWithUser(resumeId, userId);
    if (!resume) return matches;

    // Generate explanations for top 5 matches
    const topMatches = matches.slice(0, 5);
    const matchesWithExplanations = await Promise.all(
      topMatches.map(async (job) => {
        try {
          const explanation = await this.generateMatchExplanation(resume, job);
          return { ...job, ai_explanation: explanation };
        } catch (error) {
          console.error(
            `Failed to generate explanation for job ${job.id}:`,
            error,
          );
          return job;
        }
      }),
    );

    // Combine with remaining matches
    return [...matchesWithExplanations, ...matches.slice(5)];
  }

  /**
   * Generate AI explanation for why a job matches a resume
   */
  private async generateMatchExplanation(
    resume: Resume,
    job: Job,
  ): Promise<string> {
    const prompt = `You are a career advisor. Briefly explain (2-3 sentences) why this job might be a good match for the candidate.

Candidate Profile:
- Skills: ${resume.skills?.join(", ") || "Not specified"}
- Experience: ${resume.experience_years || 0} years
- Education: ${resume.education?.map((e: EducationEntry) => `${e.degree} from ${e.institution}`).join(", ") || "Not specified"}

Job:
- Title: ${job.title}
- Company: ${job.company_name}
- Required Skills: ${job.skills_required?.join(", ") || "Not specified"}
- Experience Required: ${job.experience_required || "Not specified"}

Keep your response concise and actionable.`;

    const explanation = await generateText(prompt);
    return explanation.trim();
  }

  /**
   * Save a job match for a user
   */
  async saveMatch(
    userId: string,
    resumeId: string,
    jobId: string,
    matchScore: number,
    explanation?: string,
  ): Promise<JobMatch> {
    const result = await pool.query<JobMatch>(
      `INSERT INTO job_matches (user_id, resume_id, job_id, match_score, ai_explanation, is_saved)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (user_id, job_id) DO UPDATE SET is_saved = true, match_score = $4
       RETURNING *`,
      [userId, resumeId, jobId, matchScore, explanation],
    );
    return result.rows[0];
  }

  /**
   * Get saved job matches for a user
   */
  async getSavedMatches(userId: string): Promise<(JobMatch & { job: Job })[]> {
    const result = await pool.query<JobMatch & { job: Job }>(
      `SELECT jm.*,
              row_to_json(j.*) as job
       FROM job_matches jm
       JOIN jobs j ON j.id = jm.job_id
       WHERE jm.user_id = $1 AND jm.is_saved = true
       ORDER BY jm.match_score DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * Unsave a job match
   */
  async unsaveMatch(userId: string, jobId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE job_matches SET is_saved = false WHERE user_id = $1 AND job_id = $2`,
      [userId, jobId],
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Mark a job as applied
   */
  async markAsApplied(userId: string, jobId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE job_matches SET applied = true WHERE user_id = $1 AND job_id = $2`,
      [userId, jobId],
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const matchingService = new MatchingService();
