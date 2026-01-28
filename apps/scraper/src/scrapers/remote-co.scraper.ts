import * as cheerio from "cheerio";
import { BaseScraper, type ScrapedJob } from "./base.scraper.js";
import type { JobSource } from "@postly/shared-types";

const BASE_URL = "https://remote.co";

export class RemoteCoScraper extends BaseScraper {
  source: JobSource = "remote_co";

  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    const processedCategories = new Set<string>();

    try {
      // 1. Fetch the main remote jobs page to find all categories
      console.log(`[Remote.co] Fetching main page to find categories...`);
      const html = await this.fetchWithBrowser(`${BASE_URL}/remote-jobs/`);
      const $ = cheerio.load(html);

      // Extract all category links from the sidebar or main content
      // Typically they are in a list or grid
      const categoryLinks: string[] = [];

      $('a[href^="/remote-jobs/"]').each((_, element) => {
        const href = $(element).attr("href");
        if (
          href &&
          href !== "/remote-jobs/" &&
          !processedCategories.has(href)
        ) {
          // Basic filtering to ensure it's a category page
          // (Simple logic: if it starts with /remote-jobs/ and isn't the root)
          categoryLinks.push(href);
          processedCategories.add(href);
        }
      });

      console.log(
        `[Remote.co] Found ${categoryLinks.length} categories:`,
        categoryLinks,
      );

      // 2. Iterate through each category
      for (const category of categoryLinks) {
        try {
          // Additional check to skip if we want (e.g. specific ignored categories)

          const categoryJobs = await this.scrapeCategory(category);
          jobs.push(...categoryJobs);
        } catch (error) {
          console.error(
            `[Remote.co] Failed to scrape category ${category}:`,
            error,
          );
        }

        // Rate limiting
        await this.delay(2500);
      }
    } catch (e) {
      console.error("[Remote.co] Failed to fetch categories:", e);
      // Fallback to a few default categories if main page fails
      const defaultCategories = [
        "/remote-jobs/developer/",
        "/remote-jobs/design/",
        "/remote-jobs/customer-service/",
      ];
      for (const category of defaultCategories) {
        try {
          const categoryJobs = await this.scrapeCategory(category);
          jobs.push(...categoryJobs);
        } catch (err) {
          console.error(err);
        }
      }
    }

    // Deduplicate
    const uniqueJobs = new Map<string, ScrapedJob>();
    for (const job of jobs) {
      if (!uniqueJobs.has(job.source_url)) {
        uniqueJobs.set(job.source_url, job);
      }
    }

    return Array.from(uniqueJobs.values());
  }

  private async scrapeCategory(category: string): Promise<ScrapedJob[]> {
    const url = `${BASE_URL}${category}`;
    console.log(`[Remote.co] Fetching ${url}`);

    const html = await this.fetchWithBrowser(url, ".job_listings", {
      timeout: 60000,
    });
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];
    const jobUrls: string[] = [];

    // Remote.co uses job_listing class for job cards
    $(".job_listing").each((_, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('a[href*="/job/"]').first();
        const href = $link.attr("href");

        if (!href) return;

        const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        if (jobUrls.includes(fullUrl)) return;
        jobUrls.push(fullUrl);

        // Extract job info
        const title = $el
          .find(".position h2, .job-title, h2, h3")
          .first()
          .text()
          .trim();
        const company = $el
          .find(".company strong, .job-company, .company")
          .first()
          .text()
          .trim();
        const location = $el
          .find(".location, .job-location")
          .first()
          .text()
          .trim();
        const dateText = $el
          .find(".date, time, .posted-date")
          .first()
          .text()
          .trim();

        if (!title || !company) return;

        const postedAt = this.parsePostedDate(dateText);

        const job: ScrapedJob = {
          title,
          company_name: company,
          description: `${title} position at ${company}. Remote opportunity from Remote.co.`,
          location: location || "Remote",
          remote: true,
          source_url: fullUrl,
          job_type: this.inferJobType(title),
          posted_at: postedAt,
        };

        jobs.push(job);
      } catch (error) {
        console.warn("[Remote.co] Failed to parse job element:", error);
      }
    });

    // Alternative structure for some pages
    $('[class*="card"], .listing-card, article').each((_, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('a[href*="/job/"]');
        const href = $link.attr("href");

        if (!href) return;

        const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        if (jobUrls.includes(fullUrl)) return;
        jobUrls.push(fullUrl);

        const title = $el.find("h2, h3, .title").first().text().trim();
        const company = $el
          .find('.company, [class*="company"]')
          .first()
          .text()
          .trim();

        if (!title || !company) return;

        const job: ScrapedJob = {
          title,
          company_name: company,
          description: `${title} position at ${company}. Remote opportunity.`,
          location: "Remote",
          remote: true,
          source_url: fullUrl,
          job_type: this.inferJobType(title),
        };

        jobs.push(job);
      } catch (error) {
        console.warn("[Remote.co] Failed to parse card element:", error);
      }
    });

    console.log(`[Remote.co] Found ${jobs.length} jobs in ${category}`);

    // Fetch details for each job
    const detailedJobs: ScrapedJob[] = [];
    for (const job of jobs.slice(0, 15)) {
      // Limit to first 15 per category
      try {
        const detailed = await this.scrapeJobDetails(job);
        detailedJobs.push(detailed);
        await this.delay(2000); // Rate limit
      } catch (error) {
        console.warn(
          `[Remote.co] Failed to get details for ${job.title}:`,
          error,
        );
        detailedJobs.push(job);
      }
    }

    return detailedJobs;
  }

  private async scrapeJobDetails(job: ScrapedJob): Promise<ScrapedJob> {
    try {
      const html = await this.fetchWithBrowser(
        job.source_url,
        ".job_description",
        { timeout: 60000 },
      );
      const $ = cheerio.load(html);

      // Get full description
      const description =
        $(".job_description").text().trim() ||
        $(".entry-content, .job-content, article").text().trim();

      // Look for company info
      // const companyLocation = $('.company_location, .job-meta').text().trim();

      // Look for salary
      const salaryText = $('[class*="salary"], .compensation, .job-salary')
        .text()
        .trim();
      const salary = this.parseSalary(salaryText);

      // Extract skills
      const skills = this.extractSkills(description);

      // Get posted date if available
      const dateText = $(".date, .posted-date, time").first().text().trim();
      const postedAt = this.parsePostedDate(dateText) || job.posted_at;

      return {
        ...job,
        description: description.substring(0, 5000) || job.description,
        skills_required: skills.length > 0 ? skills : undefined,
        salary_min: salary.min,
        salary_max: salary.max,
        posted_at: postedAt,
      };
    } catch (error) {
      console.warn(`[Remote.co] Error fetching job details: ${error}`);
      return job;
    }
  }
}
