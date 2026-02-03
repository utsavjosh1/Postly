import { BaseScraper, type ScrapedJob } from "./base.scraper.js";
import { JobSource } from "@postly/shared-types";
import * as cheerio from "cheerio";

const RESULTS_SELECTOR = ".jobs-search__results-list";

export class LinkedInScraper extends BaseScraper {
  source: JobSource = "linkedin";

  async scrape(): Promise<ScrapedJob[]> {
    console.log(`[LinkedIn] Starting scrape...`);
    const jobs: ScrapedJob[] = [];

    try {
      // Use smartFetch? No, LinkedIn needs browser interaction usually.
      // BaseScraper has fetchWithBrowser.
      // But we might want to manage the page directly.
      // BaseScraper doesn't expose the browser page easily, it returns HTML string.
      // But fetchWithBrowser in `base.scraper.ts` calls `../utils/browser.js`.
      // Let's assume consistent usage. We'll use fetchWithBrowser to get HTML of search page.

      // Scrape diverse categories to ensure "all sorts of jobs"
      const categories = [
        "Sales",
        "Marketing",
        "Customer Support",
        "Product Manager",
        "Finance",
        "HR",
        "Operations",
        "Software Engineer",
        "Designer",
        "Writer",
      ];

      // Pick a random category to keep it dynamic and avoid same search every time,
      // or we could loop all (might take too long for one job execution).
      // Let's pick 3 random ones per run to get a mix.
      const selected = categories.sort(() => 0.5 - Math.random()).slice(0, 3);
      console.log(`[LinkedIn] Scraping categories: ${selected.join(", ")}`);

      for (const keyword of selected) {
        try {
          console.log(`[LinkedIn] Searching for: ${keyword}`);
          const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=Remote&f_WT=2&f_TPR=r86400`;

          const html = await this.fetchWithBrowser(searchUrl, RESULTS_SELECTOR);

          // Verify Selector Integrity
          const $ = cheerio.load(html);
          if ($(RESULTS_SELECTOR).length === 0) {
            throw new Error(
              `Selector Integrity Error: "${RESULTS_SELECTOR}" missing on ${searchUrl}`,
            );
          }

          const extracted = await this.extractJobsFromHtml(html, searchUrl);
          console.log(
            `[LinkedIn] Found ${extracted.length} jobs for ${keyword}`,
          );
          jobs.push(...extracted);

          // Short delay between searches
          await this.delay(2000);
        } catch (err) {
          console.error(`[LinkedIn] Failed category ${keyword}:`, err);
        }
      }
    } catch (error) {
      console.error(`[LinkedIn] Scrape failed:`, error);
    }

    return jobs;
  }
}
