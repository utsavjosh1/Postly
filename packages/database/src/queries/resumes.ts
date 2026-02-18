import { eq, desc, and } from "drizzle-orm";
import { db } from "../index";
import { resumes } from "../schema";
import type { Resume } from "@postly/shared-types";

export const resumeQueries = {
  async create(userId: string, fileUrl: string): Promise<Resume> {
    const [result] = await db
      .insert(resumes)
      .values({
        user_id: userId,
        file_url: fileUrl,
      })
      .returning();
    return result as any as Resume;
  },

  async findByUserId(userId: string): Promise<Resume[]> {
    const result = await db
      .select()
      .from(resumes)
      .where(eq(resumes.user_id, userId))
      .orderBy(desc(resumes.created_at));
    return result as any as Resume[];
  },

  async findById(id: string): Promise<Resume | null> {
    const [result] = await db.select().from(resumes).where(eq(resumes.id, id));
    return (result as any as Resume) || null;
  },

  async updateAnalysis(
    id: string,
    parsedText: string,
    skills: string[],
    experienceYears: number,
    education: unknown,
    embedding: number[],
  ): Promise<Resume | null> {
    const [result] = await db
      .update(resumes)
      .set({
        parsed_text: parsedText,
        skills: skills,
        experience_years: experienceYears,
        education: education,
        embedding: embedding,
      })
      .where(eq(resumes.id, id))
      .returning();
    return (result as any as Resume) || null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const [result] = await db
      .delete(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.user_id, userId)))
      .returning({ id: resumes.id });
    return !!result;
  },

  async findByIdWithUser(id: string, userId: string): Promise<Resume | null> {
    const [result] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.user_id, userId)));
    return (result as any as Resume) || null;
  },
};
