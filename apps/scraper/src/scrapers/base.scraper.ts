import type { JobSource, JobType } from '@postly/shared-types';
import { generateEmbedding } from '@postly/ai-utils';
import { jobQueries } from '@postly/database';

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
}

export abstract class BaseScraper {
  abstract source: JobSource;
  abstract scrape(): Promise<ScrapedJob[]>;

  protected async generateJobEmbedding(job: ScrapedJob): Promise<number[]> {
    const text = `${job.title} at ${job.company_name}. ${job.description.substring(0, 1000)}. Skills: ${job.skills_required?.join(', ') || 'Not specified'}. Location: ${job.location || 'Not specified'}`;
    return generateEmbedding(text);
  }

  async scrapeAndSave(): Promise<{ saved: number; updated: number; errors: number }> {
    const stats = { saved: 0, updated: 0, errors: 0 };

    console.log(`[${this.source}] Starting scrape...`);

    try {
      const jobs = await this.scrape();
      console.log(`[${this.source}] Found ${jobs.length} jobs`);

      for (const job of jobs) {
        try {
          // Check if job already exists
          const existing = await jobQueries.findBySourceUrl(job.source_url);

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
          });

          if (existing) {
            stats.updated++;
          } else {
            stats.saved++;
          }
        } catch (jobError) {
          console.error(`[${this.source}] Failed to save job: ${job.title}`, jobError);
          stats.errors++;
        }
      }

      console.log(`[${this.source}] Completed - Saved: ${stats.saved}, Updated: ${stats.updated}, Errors: ${stats.errors}`);
    } catch (error) {
      console.error(`[${this.source}] Scraping failed:`, error);
      throw error;
    }

    return stats;
  }
}
