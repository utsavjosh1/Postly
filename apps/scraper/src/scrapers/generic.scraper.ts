import { BaseScraper, type ScrapedJob } from "./base.scraper.js";
import type { JobSource } from "@postly/shared-types";

export class GenericScraper extends BaseScraper {
  source: JobSource = "generic";
  // Ideally, add 'generic' to JobSource type, but using a fallback for now.

  private targetUrls: string[] = [
    // Example target (Y Combinator jobs)
    "https://www.ycombinator.com/jobs",
    // We can add more here dynamically or via config
  ];

  constructor(urls?: string[]) {
    super();
    if (urls) {
      this.targetUrls = urls;
    }
  }

  async scrape(): Promise<ScrapedJob[]> {
    console.log(
      `[GenericScraper] Starting scrape of ${this.targetUrls.length} targets...`,
    );
    const allJobs: ScrapedJob[] = [];

    for (const url of this.targetUrls) {
      try {
        console.log(`[GenericScraper] Fetching ${url}...`);
        // We wait for body to ensure basic load
        const html = await this.fetchWithBrowser(url, "body");

        // Use AI to extract
        const jobs = await this.extractJobsFromHtml(html);

        // Post-process URLs to ensure they are absolute
        const processedJobs = jobs.map((job) => {
          if (job.source_url && !job.source_url.startsWith("http")) {
            try {
              const baseUrl = new URL(url);
              job.source_url = new URL(
                job.source_url,
                baseUrl.origin,
              ).toString();
} catch {
              // keep as is if invalid
            }
          }
          // Fallback source URL if missing
          if (!job.source_url) {
            job.source_url = url;
          }
          return job;
        });

        console.log(
          `[GenericScraper] Extracted ${processedJobs.length} jobs from ${url}`,
        );
        allJobs.push(...processedJobs);
      } catch (error) {
        console.error(`[GenericScraper] Failed to process ${url}:`, error);
      }
    }

    return allJobs;
  }
}
