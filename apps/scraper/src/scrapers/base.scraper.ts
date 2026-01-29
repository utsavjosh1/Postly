import type { JobSource, JobType } from "@postly/shared-types";
import { exec } from "child_process";
import { promisify } from "util";
import { generateEmbedding, generateText } from "@postly/ai-utils";
import { jobQueries } from "@postly/database";
import * as cheerio from "cheerio";
import { fetchWithBrowser, delay } from "../utils/browser.js";

const execAsync = promisify(exec);

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
    options: {
      retries?: number;
      retryDelay?: number;
      timeout?: number;
    } = {},
  ): Promise<string> {
    return fetchWithBrowser(url, { waitForSelector, ...options });
  }

  /**
   * Smart Fetch: Attempts to fetch content using multiple strategies.
   * Priority: Browser -> Curl (for Cloudflare bypass)
   */
  /**
   * Smart Fetch: Attempts to fetch content using multiple strategies.
   * Priority: HTTP (fastest) -> Browser (robust) -> Curl (impersonation)
   */
  protected async smartFetch(
    url: string,
    selector = "body",
  ): Promise<{ content: string; type: "html" | "rss" | "json" }> {
    // 1. Try HTTP first (Cheerio/Fetch) - Fastest & Cheapest
    try {
      console.log(`[${this.source}] smartFetch: Trying HTTP (fetch)...`);
      const { content, type } = await this.fetchWithHttp(url);

      if (!this.isBlocked(content)) {
        return { content, type };
      }
      console.warn(
        `[${this.source}] smartFetch: HTTP request likely blocked (soft block detected).`,
      );
    } catch (httpError) {
      console.warn(
        `[${this.source}] smartFetch: HTTP failed (${(httpError as Error).message}). Switching to Browser...`,
      );
    }

    // 2. Try Browser (Playwright) - More expensive but handles JS/Auth/Fingerprinting
    try {
      console.log(`[${this.source}] smartFetch: Trying browser...`);
      const html = await this.fetchWithBrowser(url, selector, {
        timeout: 45000,
        retries: 1,
      });

      if (
        html.trim().startsWith("<?xml") ||
        html.includes("<rss") ||
        html.includes("<feed")
      ) {
        return { content: html, type: "rss" };
      }
      // Basic check if browser also got blocked (though less likely with good steering)
      if (this.isBlocked(html)) {
        console.warn(
          `[${this.source}] smartFetch: Browser also seems blocked.`,
        );
        throw new Error("Browser blocked");
      }

      return { content: html, type: "html" };
    } catch {
      console.warn(
        `[${this.source}] smartFetch: Browser failed, trying curl (Cloudflare bypass)...`,
      );

      // 3. Try Curl (best for static sites protected by simple bot block or TLS fingerprinting)
      try {
        // Increased max-time and added compressed flag
        const { stdout } = await execAsync(
          `curl -L -s --compressed --max-time 30 --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"`,
          { maxBuffer: 10 * 1024 * 1024 },
        );

        if (
          stdout &&
          (stdout.trim().startsWith("<?xml") || stdout.includes("<rss"))
        ) {
          return { content: stdout, type: "rss" };
        }
        if (stdout && stdout.trim().startsWith("{")) {
          try {
            JSON.parse(stdout);
            return { content: stdout, type: "json" };
          } catch {
            // ignore
          }
        }

        return { content: stdout, type: "html" };
      } catch {
        console.error(
          `[${this.source}] smartFetch: All methods failed for ${url}`,
        );
        throw new Error(`Failed to fetch ${url}`);
      }
    }
  }

  /**
   * Fast HTTP fetch using Node's native fetch
   */
  protected async fetchWithHttp(
    url: string,
  ): Promise<{ content: string; type: "html" | "rss" | "json" }> {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (contentType.includes("application/json")) {
      return { content: text, type: "json" };
    }
    if (
      contentType.includes("xml") ||
      text.trim().startsWith("<?xml") ||
      text.includes("<rss")
    ) {
      return { content: text, type: "rss" };
    }

    return { content: text, type: "html" };
  }

  /**
   * Detects common "soft blocks" like Cloudflare challenges or "Enable JS" messages
   */
  protected isBlocked(html: string): boolean {
    if (!html) return true;
    const lower = html.toLowerCase();

    // Common block indicators
    const indicators = [
      "just a moment...",
      "enable javascript",
      "javascript is required",
      "captcha-delivery",
      "challenge-platform",
      "cloudflare-ray",
      "access denied",
      "security check",
      "verify you are human",
    ];

    // If content is very short (< 500 chars) AND contains one of these, it's likely a block/challenge page
    // Real job pages are usually larger.
    if (html.length < 2000 && indicators.some((ind) => lower.includes(ind))) {
      return true;
    }
    return false;
  }

  /**
   * Extracts data from standard formats (RSS, JSON-LD) to save AI tokens.
   */
  protected async extractResolvableData(
    content: string,
    type: "html" | "rss" | "json",
    baseUrl: string,
  ): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    // 1. RSS/Atom
    if (
      type === "rss" ||
      content.includes("<rss") ||
      content.includes("<feed")
    ) {
      const $ = cheerio.load(content, { xmlMode: true });
      $("item, entry").each((_, el) => {
        const $el = $(el);
        const title = $el.find("title").text().trim();
        const link =
          $el.find("link").text().trim() || $el.find("link").attr("href");
        const desc = $el.find("description, content, summary").text().trim();
        if (title && link) {
          jobs.push({
            title,
            company_name: "Unknown", // RSS rarely has clean company name without parsing title
            description: desc || title,
            location: "Remote",
            remote: true,
            source_url: link,
            posted_at: new Date(),
            skills_required: this.extractSkills(desc + " " + title),
          });
        }
      });
      if (jobs.length > 0) return jobs;
    }

    // 2. JSON-LD in HTML
    if (type === "html") {
      const $ = cheerio.load(content);
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || "{}");
          const items = Array.isArray(json) ? json : [json];

          for (const item of items) {
            if (item["@type"] === "JobPosting") {
              jobs.push({
                title: item.title,
                company_name: item.hiringOrganization?.name || "Unknown",
                description: item.description || "",
                location:
                  item.jobLocation?.address?.addressLocality || "Remote",
                remote: !!item.jobLocation?.address?.addressLocality
                  ?.toLowerCase()
                  .includes("remote"), // Heuristic
                source_url: item.url || baseUrl,
                posted_at: item.datePosted
                  ? new Date(item.datePosted)
                  : new Date(),
                skills_required: this.extractSkills(item.description || ""),
              });
            }
          }
        } catch {
          // ignore
        }
      });
    }

    return jobs;
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

    console.log(`\n📢 [${this.source}] Starting scrape process...`);

    try {
      const jobs = await this.scrape();
      console.log(
        `🔍 [${this.source}] Scrape phase finished. Found ${jobs.length} potential jobs.`,
      );

      if (jobs.length === 0) {
        console.warn(
          `⚠️ [${this.source}] No jobs found during scrape. Check selectors or network.`,
        );
      }

      for (const [index, job] of jobs.entries()) {
        try {
          // Progress log every 10 jobs
          if (index > 0 && index % 10 === 0) {
            console.log(
              `⏳ [${this.source}] Processed ${index}/${jobs.length} jobs...`,
            );
          }

          // Skip jobs older than 1 year
          if (this.isJobTooOld(job.posted_at)) {
            console.log(
              `⏩ [${this.source}] Skipping old job: "${job.title}" (${job.posted_at?.toISOString().split("T")[0]})`,
            );
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
              `⚠️ [${this.source}] Embedding generation failed for: "${job.title}"`,
            );
            // Non-critical, continue
          }

          // Save or update the job
          await jobQueries.upsertFromScraper({
            ...job,
            source: this.source,
            embedding,
            expires_at: expiresAt,
          });

          if (existing) {
            // console.log(`🔄 [${this.source}] Updated: "${job.title}"`);
            stats.updated++;
          } else {
            console.log(
              `✅ [${this.source}] Saved New: "${job.title}" at ${job.company_name}`,
            );
            stats.saved++;
          }

          // Small delay between saves to avoid overwhelming the database
          await this.delay(50);
        } catch (jobError) {
          console.error(
            `❌ [${this.source}] Failed to save job: "${job.title}"`,
            jobError,
          );
          stats.errors++;
        }
      }

      console.log(
        `🎉 [${this.source}] Cycle Complete. Results:
        - 🆕 Saved:   ${stats.saved}
        - 🔄 Updated: ${stats.updated}
        - ⏩ Skipped: ${stats.skipped}
        - ❌ Errors:  ${stats.errors}`,
      );
    } catch (error) {
      console.error(`💥 [${this.source}] Fatal Scraper Error:`, error);
      throw error;
    }

    return stats;
  }

  // Extract jobs from HTML using AI
  // Extract jobs from HTML using AI
  protected async extractJobsFromHtml(
    html: string,
    baseUrl: string = "",
  ): Promise<ScrapedJob[]> {
    if (!html) return [];

    // 0. Optimization: Check for structured data first to avoid AI costs/latency
    // In a real pipeline, we might pass the 'type' from smartFetch, but here we assume HTML if we are this deep.
    // If it was RSS, we would have caught it earlier in smartFetch flow.
    // But smartFetch returns {content, type}. The caller should handle that.
    // However, for backwards compatibility or direct calls, let's try to extract JSON-LD here too.
    const structuredJobs = await this.extractResolvableData(
      html,
      "html",
      baseUrl,
    );
    if (structuredJobs.length > 0) {
      console.log(
        `[${this.source}] Found ${structuredJobs.length} jobs via JSON-LD. Skipping AI.`,
      );
      return structuredJobs;
    }

    console.log(`[${this.source}] extracting jobs using AI...`);

    // Use Cheerio to safely remove scripts, styles, and comments
    const $ = cheerio.load(html);
    $("script").remove();
    $("style").remove();
    $("noscript").remove();
    $("nav").remove(); // Remove navs to reduce noise
    $("footer").remove(); // Remove footers

    // Remove comments
    $.root()
      .find("*")
      .contents()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((_, el: any) => el.type === "comment")
      .remove();

    let cleanHtml = $("body").html() || "";
    // Clean up whitespace
    cleanHtml = cleanHtml.replace(/\s+/g, " ");
    const truncatedHtml = cleanHtml.substring(0, 30000); // Limit to ~30k chars

    const prompt = `
    You are an expert data extractor. I have provided raw HTML from a job board below.
    Extract all job postings into a JSON array.

    Rules:
    1. IGNORE navigation, footers, headers. Only extract actual job listings.
    2. If a field is missing, use null.
    3. Output ONLY a valid JSON array. No markdown, no "Here is the JSON".
    4. "posted_at": Use YYYY-MM-DD or relative string (e.g. "2 days ago").

    Schema:
    [
      {
        "title": "Job Title",
        "company_name": "Company Name",
        "location": "Remote",
        "job_type": "full-time",
        "source_url": "Absolute URL",
        "description": "Short summary",
        "skills_required": ["Skill1", "Skill2"]
      }
    ]

    HTML:
    ${truncatedHtml}
  `;

    try {
      const text = await generateText(prompt);

      // Robust JSON extraction: Find [ ... ]
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      let jsonString = jsonMatch ? jsonMatch[0] : text;

      // Clean typical markdown chatter
      jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "");

      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        console.warn(`[${this.source}] AI returned non-array structure`);
        return [];
      }

      // Map to ScrapedJob interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parsed.map((job: any) => ({
        title: job.title || "Unknown Job",
        company_name: job.company_name || "Unknown Company",
        description: job.description || job.title,
        location: job.location || "Remote",
        job_type: this.inferJobType(job.job_type || job.title || ""),
        remote: job.remote !== false, // Default to true for this context usually
        source_url: this.normalizeUrl(job.source_url, baseUrl),
        skills_required: job.skills_required || [],
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

  private normalizeUrl(url: string, baseUrl: string): string {
    if (!url) return baseUrl;
    if (url.startsWith("http")) return url;
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }
}
