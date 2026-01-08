import { BaseScraper, type ScrapedJob } from "./base.scraper.js";
import type { JobSource } from "@postly/shared-types";

const API_URL = "https://remoteok.com/api";

interface RemoteOKJob {
  id: string;
  epoch: number;
  date: string;
  company: string;
  company_logo: string;
  position: string;
  tags: string[];
  logo: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
  apply_url?: string;
}

export class RemoteOKScraper extends BaseScraper {
  source: JobSource = "remote_ok";

  async scrape(): Promise<ScrapedJob[]> {
    console.log(`[RemoteOK] Fetching jobs from API...`);

    try {
      // RemoteOK has a public JSON API
      const response = await fetch(API_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // First element is metadata, rest are jobs
      const rawJobs: RemoteOKJob[] = Array.isArray(data) ? data.slice(1) : [];

      console.log(`[RemoteOK] Found ${rawJobs.length} jobs from API`);

      const jobs: ScrapedJob[] = [];

      for (const rawJob of rawJobs) {
        try {
          // Skip if no position or company
          if (!rawJob.position || !rawJob.company) continue;

          // Parse the date
          const postedAt = rawJob.epoch
            ? new Date(rawJob.epoch * 1000)
            : this.parsePostedDate(rawJob.date);

          // Skip jobs older than 1 year
          if (this.isJobTooOld(postedAt)) {
            continue;
          }

          // Build source URL
          const sourceUrl =
            rawJob.url || `https://remoteok.com/remote-jobs/${rawJob.id}`;

          // Clean up description (remove HTML)
          const description = this.cleanDescription(rawJob.description || "");

          // Extract skills from tags and description
          const skills = [
            ...(rawJob.tags || []).slice(0, 10),
            ...this.extractSkills(description),
          ]
            .filter((skill, index, self) => self.indexOf(skill) === index)
            .slice(0, 15);

          const job: ScrapedJob = {
            title: rawJob.position,
            company_name: rawJob.company,
            description:
              description ||
              `${rawJob.position} position at ${rawJob.company}. Remote opportunity.`,
            location: rawJob.location || "Remote",
            remote: true,
            source_url: sourceUrl,
            job_type: this.inferJobType(rawJob.position),
            posted_at: postedAt,
            skills_required: skills.length > 0 ? skills : undefined,
            salary_min: rawJob.salary_min,
            salary_max: rawJob.salary_max,
          };

          jobs.push(job);
        } catch (error) {
          console.warn(`[RemoteOK] Failed to parse job:`, error);
        }
      }

      console.log(`[RemoteOK] Processed ${jobs.length} valid jobs`);
      return jobs;
    } catch (error) {
      console.error(`[RemoteOK] API fetch failed:`, error);
      // Fall back to browser scraping if API fails
      return this.scrapeFallback();
    }
  }

  private cleanDescription(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, " ");
    // Decode HTML entities
    // Decode HTML entities safely in a single pass to avoid double-unescaping
    const entities: Record<string, string> = {
      "&nbsp;": " ",
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
    };
    text = text.replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (entity) => entities[entity] || entity);
    // Clean up whitespace
    text = text.replace(/\s+/g, " ").trim();
    // Limit length
    return text.substring(0, 5000);
  }

  private async scrapeFallback(): Promise<ScrapedJob[]> {
    console.log(`[RemoteOK] Falling back to browser scraping...`);

    try {
      const html = await this.fetchWithBrowser(
        "https://remoteok.com/remote-dev-jobs",
        ".job",
      );
      const jobs: ScrapedJob[] = [];

      // Simple regex-based extraction as fallback
      const jobMatches = html.matchAll(
        /data-id="(\d+)"[^>]*>[\s\S]*?company[^>]*>([^<]+)<[\s\S]*?position[^>]*>([^<]+)</gi,
      );

      for (const match of jobMatches) {
        const [, id, company, position] = match;
        if (position && company) {
          jobs.push({
            title: position.trim(),
            company_name: company.trim(),
            description: `${position.trim()} position at ${company.trim()}. Remote opportunity.`,
            location: "Remote",
            remote: true,
            source_url: `https://remoteok.com/remote-jobs/${id}`,
            job_type: this.inferJobType(position),
          });
        }
      }

      console.log(`[RemoteOK] Fallback found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      console.error(`[RemoteOK] Fallback scraping failed:`, error);
      return [];
    }
  }
}
