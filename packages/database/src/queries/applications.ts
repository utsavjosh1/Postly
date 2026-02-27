import { eq, desc, and, ilike } from "drizzle-orm";
import { db } from "../index";
import { applications, jobs } from "../schema";
import type {
  ApplicationStatus,
  StatusHistoryEntry,
} from "@postly/shared-types";

export const applicationQueries = {
  async create(
    seekerId: string,
    jobId: string,
    resumeId?: string,
    coverLetter?: string,
  ) {
    const initialHistory: StatusHistoryEntry[] = [
      { status: "applied", timestamp: new Date().toISOString() },
    ];

    const [result] = await db
      .insert(applications)
      .values({
        seeker_id: seekerId,
        job_id: jobId,
        resume_id: resumeId,
        cover_letter: coverLetter,
        status: "applied",
        status_history: initialHistory,
      })
      .returning();

    return result;
  },

  async findById(id: string) {
    const [result] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));

    return result ?? null;
  },

  async findBySeeker(seekerId: string, limit = 100, offset = 0) {
    return db
      .select({
        application: applications,
        job: {
          title: jobs.title,
          company_name: jobs.company_name,
          location: jobs.location,
          remote: jobs.remote,
          source_url: jobs.source_url,
        },
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.job_id, jobs.id))
      .where(eq(applications.seeker_id, seekerId))
      .orderBy(desc(applications.applied_at))
      .limit(limit)
      .offset(offset);
  },

  // Enables the "Who is Company X? When did I apply?" prompt use-case.
  async findSeekerApplicationByCompany(seekerId: string, companyName: string) {
    return db
      .select({
        application: applications,
        job: {
          title: jobs.title,
          company_name: jobs.company_name,
          location: jobs.location,
          source_url: jobs.source_url,
        },
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.job_id, jobs.id))
      .where(
        and(
          eq(applications.seeker_id, seekerId),
          ilike(jobs.company_name, `%${companyName}%`),
        ),
      )
      .orderBy(desc(applications.applied_at));
  },

  // Get employer's full applicant pipeline for a job.
  async findByJob(jobId: string, limit = 200, offset = 0) {
    return db
      .select()
      .from(applications)
      .where(eq(applications.job_id, jobId))
      .orderBy(desc(applications.applied_at))
      .limit(limit)
      .offset(offset);
  },

  async updateStatus(id: string, status: ApplicationStatus, note?: string) {
    const [existing] = await db
      .select({ status_history: applications.status_history })
      .from(applications)
      .where(eq(applications.id, id));

    if (!existing) return null;

    const history = (
      Array.isArray(existing.status_history) ? existing.status_history : []
    ) as StatusHistoryEntry[];

    const newEntry: StatusHistoryEntry = {
      status,
      timestamp: new Date().toISOString(),
      ...(note && { note }),
    };

    const [result] = await db
      .update(applications)
      .set({
        status,
        status_history: [...history, newEntry],
        updated_at: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    return result ?? null;
  },

  async updateNotes(id: string, seekerId: string, notes: string) {
    const [result] = await db
      .update(applications)
      .set({ notes, updated_at: new Date() })
      .where(and(eq(applications.id, id), eq(applications.seeker_id, seekerId)))
      .returning();

    return result ?? null;
  },

  async updateMatchScore(
    id: string,
    matchScore: number,
    aiExplanation?: string,
  ) {
    await db
      .update(applications)
      .set({
        match_score: matchScore.toString(),
        ai_explanation: aiExplanation,
        updated_at: new Date(),
      })
      .where(eq(applications.id, id));
  },

  async delete(id: string, seekerId: string) {
    const [result] = await db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.seeker_id, seekerId)))
      .returning({ id: applications.id });

    return !!result;
  },
};
