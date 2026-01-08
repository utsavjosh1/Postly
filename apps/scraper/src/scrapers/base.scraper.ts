import type { JobSource, JobType } from "@postly/shared-types";
import { generateEmbedding, geminiModel } from "@postly/ai-utils";
import { jobQueries } from "@postly/database";
import * as cheerio from "cheerio";
import { fetchWithBrowser, delay } from "../utils/browser.js";

export interface ScrapedJob {
  title: string;
  company_name: string;
  description: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: JobType;
  remote: boolean;
  source_url: string;
  skills_required?: string[];
  experience_required?: string;
  posted_at?: Date;
  expires_at?: Date;
}

export abstract class BaseScraper {
  abstract source: JobSource;
  abstract scrape(): Promise<ScrapedJob[]>;

  // Fetch page using Playwright with retry
  protected async fetchWithBrowser(
    url: string,
    waitForSelector?: string,
    retries = 3,
  ): Promise<string> {
    return fetchWithBrowser(url, { waitForSelector, retries });
  }

  // Generate embedding for job matching
  protected async generateJobEmbedding(job: ScrapedJob): Promise<number[]> {
    const text = `${job.title} at ${job.company_name}. ${job.description.substring(0, 1000)}. Skills: ${job.skills_required?.join(", ") || "Not specified"}. Location: ${job.location || "Not specified"}`;
    return generateEmbedding(text);
  }

  // Calculate expiration date (default 90 days from posted, max 1 year)
  protected calculateExpiresAt(postedAt?: Date): Date {
    const base = postedAt || new Date();
    const expiresAt = new Date(base);
    expiresAt.setDate(expiresAt.getDate() + 90); // Default 90 days

    // Cap at 1 year from now
    const maxExpiry = new Date();
    maxExpiry.setFullYear(maxExpiry.getFullYear() + 1);

    return expiresAt < maxExpiry ? expiresAt : maxExpiry;
  }

  // Check if job is too old (> 1 year)
  protected isJobTooOld(postedAt?: Date): boolean {
    if (!postedAt) return false;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return postedAt < oneYearAgo;
  }

  // Parse relative date strings like "2 days ago", "1 week ago"
  protected parsePostedDate(text: string): Date | undefined {
    if (!text) return undefined;

    const now = new Date();
    const lowerText = text.toLowerCase().trim();

    // Handle "just now", "today"
    if (
      lowerText.includes("just now") ||
      lowerText === "today" ||
      lowerText.includes("just posted")
    ) {
      return now;
    }

    // Handle "yesterday"
    if (lowerText === "yesterday") {
      const date = new Date(now);
      date.setDate(date.getDate() - 1);
      return date;
    }

    // Match patterns like "2 days ago", "1 week ago", "3 months ago"
    const match = lowerText.match(
      /(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i,
    );
    if (match) {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      const date = new Date(now);

      switch (unit) {
        case "second":
          date.setSeconds(date.getSeconds() - amount);
          break;
        case "minute":
          date.setMinutes(date.getMinutes() - amount);
          break;
        case "hour":
          date.setHours(date.getHours() - amount);
          break;
        case "day":
          date.setDate(date.getDate() - amount);
          break;
        case "week":
          date.setDate(date.getDate() - amount * 7);
          break;
        case "month":
          date.setMonth(date.getMonth() - amount);
          break;
        case "year":
          date.setFullYear(date.getFullYear() - amount);
          break;
      }

      return date;
    }

    // Try to parse as ISO date or common formats
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return undefined;
  }

  // Infer job type from title
  protected inferJobType(title: string): JobType {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("intern")) return "internship";
    if (lowerTitle.includes("contract") || lowerTitle.includes("contractor"))
      return "contract";
    if (lowerTitle.includes("part-time") || lowerTitle.includes("part time"))
      return "part-time";
    return "full-time";
  }

  // Parse salary from text
  protected parseSalary(text: string): { min?: number; max?: number } {
    if (!text) return {};

    // Remove common prefixes and clean up
    const cleaned = text.replace(/[,$]/g, "").toLowerCase();

    // Match ranges like "80k-120k", "80000 - 120000"
    const rangeMatch = cleaned.match(/(\d+)k?\s*[-–to]\s*(\d+)k?/i);
    if (rangeMatch) {
      let min = parseInt(rangeMatch[1], 10);
      let max = parseInt(rangeMatch[2], 10);

      // If values are small, assume they're in thousands
      if (min < 1000) min *= 1000;
      if (max < 1000) max *= 1000;

      return { min, max };
    }

    // Match single value like "100k", "100000"
    const singleMatch = cleaned.match(/(\d+)k?/i);
    if (singleMatch) {
      let value = parseInt(singleMatch[1], 10);
      if (value < 1000) value *= 1000;
      return { min: value };
    }

    return {};
  }

  // Extract skills from job description
  protected extractSkills(description: string): string[] {
    const commonSkills = [
      "javascript",
      "typescript",
      "python",
      "java",
      "c++",
      "c#",
      "go",
      "golang",
      "rust",
      "ruby",
      "php",
      "swift",
      "kotlin",
      "scala",
      "r",
      "sql",
      "nosql",
      "html",
      "css",
      "sass",
      "less",
      "react",
      "vue",
      "angular",
      "svelte",
      "next.js",
      "nextjs",
      "nuxt",
      "gatsby",
      "node.js",
      "nodejs",
      "express",
      "fastify",
      "nest.js",
      "nestjs",
      "django",
      "flask",
      "fastapi",
      "spring",
      "rails",
      "laravel",
      "asp.net",
      ".net",
      "aws",
      "azure",
      "gcp",
      "google cloud",
      "heroku",
      "vercel",
      "netlify",
      "docker",
      "kubernetes",
      "k8s",
      "terraform",
      "ansible",
      "jenkins",
      "ci/cd",
      "postgresql",
      "mysql",
      "mongodb",
      "redis",
      "elasticsearch",
      "dynamodb",
      "cassandra",
      "graphql",
      "rest",
      "api",
      "microservices",
      "serverless",
      "git",
      "github",
      "gitlab",
      "bitbucket",
      "jira",
      "agile",
      "scrum",
      "figma",
      "sketch",
      "adobe xd",
      "ui/ux",
      "tailwind",
      "bootstrap",
      "material-ui",
      "machine learning",
      "ml",
      "ai",
      "deep learning",
      "nlp",
      "computer vision",
      "data science",
      "data engineering",
      "etl",
      "spark",
      "hadoop",
      "kafka",
      "linux",
      "unix",
      "bash",
      "shell",
      "devops",
      "sre",
    ];

    const lowerDesc = description.toLowerCase();
    const foundSkills: string[] = [];

    for (const skill of commonSkills) {
      // Use explicit boundaries to handle both words and symbols (e.g. C++, .NET) correctly
      // This also resolves CodeQL "Missing regular expression anchor" warnings by being explicit about boundaries
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `(?:^|[^a-zA-Z0-9_])${escapedSkill}(?![a-zA-Z0-9_])`,
        "i",
      );
      if (regex.test(lowerDesc)) {
        // Normalize skill name
        const normalized = skill.charAt(0).toUpperCase() + skill.slice(1);
        if (!foundSkills.includes(normalized)) {
          foundSkills.push(normalized);
        }
      }
    }

    return foundSkills.slice(0, 15); // Limit to 15 skills
  }

  // Delay helper for rate limiting
  protected delay(ms: number): Promise<void> {
    return delay(ms);
  }

  // Main method to scrape and save jobs
  async scrapeAndSave(): Promise<{
    saved: number;
    updated: number;
    errors: number;
    skipped: number;
  }> {
    const stats = { saved: 0, updated: 0, errors: 0, skipped: 0 };

    console.log(`[${this.source}] Starting scrape...`);

    try {
      const jobs = await this.scrape();
      console.log(`[${this.source}] Found ${jobs.length} jobs`);

      for (const job of jobs) {
        try {
          // Skip jobs older than 1 year
          if (this.isJobTooOld(job.posted_at)) {
            console.log(`[${this.source}] Skipping old job: ${job.title}`);
            stats.skipped++;
            continue;
          }

          // Check if job already exists
          const existing = await jobQueries.findBySourceUrl(job.source_url);

          // Calculate expiration date if not set
          const expiresAt =
            job.expires_at || this.calculateExpiresAt(job.posted_at);

          // Generate embedding for the job
          let embedding: number[] | undefined;
          try {
            embedding = await this.generateJobEmbedding(job);
          } catch (embError) {
            console.warn(
              `[${this.source}] Failed to generate embedding for job: ${job.title}`,
              embError,
            );
          }

          // Save or update the job
          await jobQueries.upsertFromScraper({
            ...job,
            source: this.source,
            embedding,
            expires_at: expiresAt,
          });

          if (existing) {
            stats.updated++;
          } else {
            stats.saved++;
          }

          // Small delay between saves to avoid overwhelming the database
          await this.delay(100);
        } catch (jobError) {
          console.error(
            `[${this.source}] Failed to save job: ${job.title}`,
            jobError,
          );
          stats.errors++;
        }
      }

      console.log(
        `[${this.source}] Completed - Saved: ${stats.saved}, Updated: ${stats.updated}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`,
      );
    } catch (error) {
      console.error(`[${this.source}] Scraping failed:`, error);
      throw error;
    }

    return stats;
  }




  // Extract jobs from HTML using AI
  protected async extractJobsFromHtml(html: string): Promise<ScrapedJob[]> {
    if (!html) return [];

    console.log(`[${this.source}] extracting jobs using AI...`);

    // Use Cheerio to safely remove scripts, styles, and comments
    // This resolves CodeQL "Incomplete multi-character sanitization" alerts
    const $ = cheerio.load(html);
    $("script").remove();
    $("style").remove();
    $("noscript").remove(); 
    
    // Get text or cleaned HTML. For AI context, inner text/structure is often enough, 
    // but keeping some structure helps the LLM understand sections.
    // Let's keep the body HTML but it's now stripped of dangerous tags.
    let cleanHtml = $("body").html() || "";
    
    // Remove comments (Cheerio doesn't always remove them by default depending on config, but simple regex on valid DOM is safer)
    // Or better, just rely on the fact that we stripped executable tags. 
    // Let's do a simple whitespace cleanup on the result.
    cleanHtml = cleanHtml.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ");

    const truncatedHtml = cleanHtml.substring(0, 30000); // Limit to ~30k chars

    const prompt = `
      You are an expert data extractor. I have provided raw HTML from a job board or career page below.
      
      Your task is to extract all job postings found in the HTML into a structured JSON array.

      
      Rules:
      1. IGNORE navigation links, footers, and general site text. Only extract actual job listings.
      2. If a field is missing, use null or omit it.
      3. "remote" should be boolean true/false.
      4. "job_type" should be one of: 'full-time', 'part-time', 'contract', 'internship'. Infer if needed.
      5. "skills" should be a list of technologies mentioned (e.g., ["React", "Python"]).
      6. Return ONLY the valid JSON array. Do not include markdown formatting like \`\`\`json.

      Schema per job:
      {
        "title": string,
        "company_name": string (infer from context if missing),
        "description": string (short summary if full text not available),
        "location": string,
        "salary_min": number | null,
        "salary_max": number | null,
        "job_type": string,
        "remote": boolean,
        "source_url": string (absolute URL if possible, or relative),
        "skills_required": string[],
        "posted_at": string (ISO date if available, or "2 days ago")
      }

      HTML Content:
      ${truncatedHtml}
    `;

    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response
        .text()
        .replace(/[`\n]/g, "")
        .replace(/^json/, ""); // Cleanup markdown code blocks

      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        console.warn(`[${this.source}] AI returned non-array structure`);
        return [];
      }

      // Map to ScrapedJob interface
      return parsed.map((job: any) => ({
        title: job.title || "Unknown Job",
        company_name: job.company_name || "Unknown Company",
        description: job.description || job.title,
        location: job.location,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        job_type: this.inferJobType(job.job_type || job.title || ""),
        remote: job.remote ?? false,
        source_url: job.source_url || "",
        skills_required: job.skills_required,
        posted_at: this.parsePostedDate(job.posted_at) || new Date(),
        expires_at: this.calculateExpiresAt(
          this.parsePostedDate(job.posted_at),
        ),
      }));
    } catch (error) {
      console.error(`[${this.source}] AI extraction failed:`, error);
      return [];
    }
  }
}
