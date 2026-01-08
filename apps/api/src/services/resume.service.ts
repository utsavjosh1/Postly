import { generateText, generateEmbedding } from "@postly/ai-utils";
import { resumeQueries } from "@postly/database";
import type {
  Resume,
  ResumeAnalysis,
  EducationEntry,
} from "@postly/shared-types";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export class ResumeService {
  /**
   * Parse file content based on type
   */
  async parseFile(buffer: Buffer, mimetype: string): Promise<string> {
    if (mimetype === "application/pdf") {
      return this.parsePDF(buffer);
    } else if (
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword"
    ) {
      return this.parseDOCX(buffer);
    }
    throw new Error(`Unsupported file type: ${mimetype}`);
  }

  /**
   * Parse PDF file
   */
  private async parsePDF(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  /**
   * Parse DOCX file
   */
  private async parseDOCX(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  /**
   * Analyze resume text using Gemini AI
   */
  async analyzeResume(text: string): Promise<ResumeAnalysis> {
    const prompt = `Analyze the following resume and extract structured information.
Return a valid JSON object with these exact fields:
- skills: array of technical and soft skills mentioned (strings)
- experience_years: estimated total years of professional experience (number)
- education: array of education entries, each with: degree, institution, year (optional), field_of_study (optional)
- summary: a 2-3 sentence professional summary

Resume text:
${text.substring(0, 8000)}

Return ONLY the JSON object, no markdown formatting or explanation.`;

    const response = await generateText(prompt);

    try {
      // Clean up response - remove markdown code blocks if present
      let cleanJson = response.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.slice(7);
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.slice(3);
      }
      if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.slice(0, -3);
      }
      cleanJson = cleanJson.trim();

      const parsed = JSON.parse(cleanJson);

      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience_years:
          typeof parsed.experience_years === "number"
            ? parsed.experience_years
            : 0,
        education: Array.isArray(parsed.education)
          ? parsed.education.map((e: Partial<EducationEntry>) => ({
              degree: e.degree || "Unknown",
              institution: e.institution || "Unknown",
              year: e.year,
              field_of_study: e.field_of_study,
            }))
          : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
      };
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      // Return default analysis if parsing fails
      return {
        skills: [],
        experience_years: 0,
        education: [],
        summary: "Unable to analyze resume. Please try again.",
      };
    }
  }

  /**
   * Process uploaded resume: parse, analyze, generate embedding, and save
   */
  async processResume(
    userId: string,
    fileUrl: string,
    fileBuffer: Buffer,
    mimetype: string,
  ): Promise<Resume> {
    // 1. Create initial resume record
    const resume = await resumeQueries.create(userId, fileUrl);

    try {
      // 2. Parse file content
      const parsedText = await this.parseFile(fileBuffer, mimetype);

      // 3. Analyze resume with AI
      const analysis = await this.analyzeResume(parsedText);

      // 4. Generate embedding for vector search
      const embeddingText = `${analysis.summary} Skills: ${analysis.skills.join(", ")} Experience: ${analysis.experience_years} years`;
      const embedding = await generateEmbedding(embeddingText);

      // 5. Update resume with analysis
      const updatedResume = await resumeQueries.updateAnalysis(
        resume.id,
        parsedText,
        analysis.skills,
        analysis.experience_years,
        analysis.education,
        embedding,
      );

      return updatedResume || resume;
    } catch (error) {
      console.error("Error processing resume:", error);
      // Return the basic resume if processing fails
      // The user can retry analysis later
      return resume;
    }
  }

  /**
   * Get all resumes for a user
   */
  async getUserResumes(userId: string): Promise<Resume[]> {
    return resumeQueries.findByUserId(userId);
  }

  /**
   * Get a specific resume by ID
   */
  async getResumeById(id: string, userId: string): Promise<Resume | null> {
    return resumeQueries.findByIdWithUser(id, userId);
  }

  /**
   * Delete a resume
   */
  async deleteResume(id: string, userId: string): Promise<boolean> {
    return resumeQueries.delete(id, userId);
  }

  /**
   * Re-analyze an existing resume
   */
  async reanalyzeResume(id: string, userId: string): Promise<Resume | null> {
    const resume = await resumeQueries.findByIdWithUser(id, userId);
    if (!resume || !resume.parsed_text) {
      return null;
    }

    const analysis = await this.analyzeResume(resume.parsed_text);
    const embeddingText = `${analysis.summary} Skills: ${analysis.skills.join(", ")} Experience: ${analysis.experience_years} years`;
    const embedding = await generateEmbedding(embeddingText);

    return resumeQueries.updateAnalysis(
      id,
      resume.parsed_text,
      analysis.skills,
      analysis.experience_years,
      analysis.education,
      embedding,
    );
  }
}

export const resumeService = new ResumeService();
