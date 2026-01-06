import type { JobSource, JobType } from '@postly/shared-types';
import { generateEmbedding } from '@postly/ai-utils';
import { jobQueries } from '@postly/database';
import { fetchWithBrowser, delay } from '../utils/browser';

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
    retries = 3
  ): Promise<string> {
    return fetchWithBrowser(url, { waitForSelector, retries });
  }

  // Generate embedding for job matching
  protected async generateJobEmbedding(job: ScrapedJob): Promise<number[]> {
    const text = `${job.title} at ${job.company_name}. ${job.description.substring(0, 1000)}. Skills: ${job.skills_required?.join(', ') || 'Not specified'}. Location: ${job.location || 'Not specified'}`;
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
    if (lowerText.includes('just now') || lowerText === 'today' || lowerText.includes('just posted')) {
      return now;
    }

    // Handle "yesterday"
    if (lowerText === 'yesterday') {
      const date = new Date(now);
      date.setDate(date.getDate() - 1);
      return date;
    }

    // Match patterns like "2 days ago", "1 week ago", "3 months ago"
    const match = lowerText.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i);
    if (match) {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      const date = new Date(now);

      switch (unit) {
        case 'second':
          date.setSeconds(date.getSeconds() - amount);
          break;
        case 'minute':
          date.setMinutes(date.getMinutes() - amount);
          break;
        case 'hour':
          date.setHours(date.getHours() - amount);
          break;
        case 'day':
          date.setDate(date.getDate() - amount);
          break;
        case 'week':
          date.setDate(date.getDate() - amount * 7);
          break;
        case 'month':
          date.setMonth(date.getMonth() - amount);
          break;
        case 'year':
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
    if (lowerTitle.includes('intern')) return 'internship';
    if (lowerTitle.includes('contract') || lowerTitle.includes('contractor')) return 'contract';
    if (lowerTitle.includes('part-time') || lowerTitle.includes('part time')) return 'part-time';
    return 'full-time';
  }

  // Parse salary from text
  protected parseSalary(text: string): { min?: number; max?: number } {
    if (!text) return {};

    // Remove common prefixes and clean up
    const cleaned = text.replace(/[,$]/g, '').toLowerCase();

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
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'golang', 'rust', 'ruby',
      'php', 'swift', 'kotlin', 'scala', 'r', 'sql', 'nosql', 'html', 'css', 'sass', 'less',
      'react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt', 'gatsby',
      'node.js', 'nodejs', 'express', 'fastify', 'nest.js', 'nestjs', 'django', 'flask', 'fastapi',
      'spring', 'rails', 'laravel', 'asp.net', '.net',
      'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'vercel', 'netlify',
      'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'ci/cd',
      'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
      'graphql', 'rest', 'api', 'microservices', 'serverless',
      'git', 'github', 'gitlab', 'bitbucket', 'jira', 'agile', 'scrum',
      'figma', 'sketch', 'adobe xd', 'ui/ux', 'tailwind', 'bootstrap', 'material-ui',
      'machine learning', 'ml', 'ai', 'deep learning', 'nlp', 'computer vision',
      'data science', 'data engineering', 'etl', 'spark', 'hadoop', 'kafka',
      'linux', 'unix', 'bash', 'shell', 'devops', 'sre',
    ];

    const lowerDesc = description.toLowerCase();
    const foundSkills: string[] = [];

    for (const skill of commonSkills) {
      // Use word boundary to avoid partial matches
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
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
  async scrapeAndSave(): Promise<{ saved: number; updated: number; errors: number; skipped: number }> {
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
          const expiresAt = job.expires_at || this.calculateExpiresAt(job.posted_at);

          // Generate embedding for the job
          let embedding: number[] | undefined;
          try {
            embedding = await this.generateJobEmbedding(job);
          } catch (embError) {
            console.warn(`[${this.source}] Failed to generate embedding for job: ${job.title}`, embError);
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
          console.error(`[${this.source}] Failed to save job: ${job.title}`, jobError);
          stats.errors++;
        }
      }

      console.log(
        `[${this.source}] Completed - Saved: ${stats.saved}, Updated: ${stats.updated}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`
      );
    } catch (error) {
      console.error(`[${this.source}] Scraping failed:`, error);
      throw error;
    }

    return stats;
  }
}
