import { BaseScraper, type ScrapedJob } from "./base.scraper.js";
// @ts-ignore
import type { JobSource } from "@postly/shared-types";

export class GenericScraper extends BaseScraper {
  source: JobSource = "generic";
  
  // Default targets, but can be overridden
  private targetUrls: string[] = [
    "https://www.ycombinator.com/jobs",
    "https://weworkremotely.com/categories/remote-programming-jobs", // Should trigger RSS detection
  ];

  constructor(urls?: string[]) {
    super();
    if (urls) {
      this.targetUrls = urls;
    }
  }

  async scrape(): Promise<ScrapedJob[]> {
    console.log(`\n🚀 Starting Universal Scraper (${this.targetUrls.length} targets)...`);
    const allJobs: ScrapedJob[] = [];

    for (const url of this.targetUrls) {
      try {
        console.log(`[Universal] Processing ${url}...`);
        
        // 1. Smart Fetch (Browser or Curl)
        const { content, type } = await this.smartFetch(url);
        console.log(`[Universal] Fetched ${content.length} bytes. Detected type: ${type}`);

        let jobs: ScrapedJob[] = [];

        // 2. Extract based on type
        if (type === "rss" || type === "json") {
             // Direct extraction for structured feeds
             jobs = await this.extractResolvableData(content, type, url);
             if (jobs.length === 0) {
                 console.warn(`[Universal] Structured extraction failed for ${type}, falling back to AI/HTML processing.`);
                 // Fallback: Treat as text/html for AI
                 jobs = await this.extractJobsFromHtml(content, url);
             }
        } else {
             // HTML: Parsing (JSON-LD) + AI Backup
             // extractJobsFromHtml now internally checks extractResolvableData(html, 'html') first!
             jobs = await this.extractJobsFromHtml(content, url);
        }

        console.log(`[Universal] Extracted ${jobs.length} jobs from ${url}`);
        allJobs.push(...jobs);

      } catch (error) {
        console.error(`[Universal] Failed to process ${url}:`, error);
      }
      
      // Be nice to servers
      await this.delay(2000);
    }

    return allJobs;
  }
}
