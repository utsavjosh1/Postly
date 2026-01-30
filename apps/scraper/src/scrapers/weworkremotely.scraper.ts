import * as cheerio from "cheerio";
import { exec } from "child_process";
import { promisify } from "util";
import { ScrapedJob, BaseScraper } from "./base.scraper.js";
import type { JobSource } from "@postly/shared-types";

const execAsync = promisify(exec);
const BASE_URL = "https://weworkremotely.com";

export class WeWorkRemotelyScraper extends BaseScraper {
  name = "WeWorkRemotely";
  source: JobSource = "weworkremotely";

  private categories = [
    "/categories/remote-programming-jobs",
    "/categories/remote-design-jobs",
    "/categories/remote-devops-sysadmin-jobs",
    "/categories/remote-management-finance-jobs",
    "/categories/remote-product-jobs",
    "/categories/remote-customer-support-jobs",
    "/categories/remote-sales-marketing-jobs",
    "/categories/remote-copywriting-jobs",
    "/categories/remote-back-end-programming-jobs",
    "/categories/remote-front-end-programming-jobs",
    "/categories/remote-full-stack-programming-jobs",
  ];

  async scrape(): Promise<ScrapedJob[]> {
    console.log(`\n🚀 Starting ${this.name} scraper (RSS via Curl)...`);
    const allJobs: ScrapedJob[] = [];

    // Process categories in parallel chunks
    const chunked = this.chunkArray(this.categories, 3);

    for (const chunk of chunked) {
      const promises = chunk.map((cat) => this.scrapeCategory(cat));
      const results = await Promise.all(promises);
      results.forEach((jobs) => allJobs.push(...jobs));
    }

    return allJobs;
  }

  private async scrapeCategory(category: string): Promise<ScrapedJob[]> {
    const url = `${BASE_URL}${category}`;
    console.log(`[WWR] Fetching RSS feed: ${url}`);

    try {
      // Use curl to bypass Node.js TLS fingerprinting which triggers Cloudflare
      const { stdout } = await execAsync(
        `curl -L -s --user-agent "curl/7.64.1" "${url}"`,
        { maxBuffer: 10 * 1024 * 1024 },
      );

      const xml = stdout;

      if (!xml.trim().startsWith("<?xml") && !xml.includes("<rss")) {
        console.warn(`[WWR] Response for ${url} does not look like RSS XML.`);
        // console.warn(`[WWR] Preview: ${xml.substring(0, 100)}...`);
        return [];
      }

      const $ = cheerio.load(xml, { xmlMode: true });
      const jobs: ScrapedJob[] = [];

      $("item").each((_, element) => {
        const item = $(element);
        const link = item.find("link").text().trim();
        const guid = item.find("guid").text().trim();
        const dateStr = item.find("pubDate").text().trim();

        const fullTitle = item.find("title").text().trim();
        let company = "Unknown";
        let title = fullTitle;

        if (fullTitle.includes(":")) {
          const parts = fullTitle.split(":");
          company = parts[0].trim();
          title = parts.slice(1).join(":").trim();
        }

        const descriptionHtml = item.find("description").text();
        const $desc = cheerio.load(descriptionHtml);
        const description = $desc.text().trim() || descriptionHtml;

        const job: ScrapedJob = {
          title,
          company_name: company,
          description: description,
          location: "Remote",
          salary_min: undefined,
          salary_max: undefined,
          job_type: undefined,
          remote: true,
          source_url: link || guid,
          posted_at: this.parsePostedDate(dateStr) || new Date(),
          skills_required: this.extractSkills(description + " " + title),
        };

        jobs.push(job);
      });

      console.log(`[WWR] Found ${jobs.length} jobs in ${category}`);
      return jobs;
    } catch (error) {
      console.error(`[WWR] Error scraping ${category}:`, error);
      return [];
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }
}
