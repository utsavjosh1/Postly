import * as cheerio from "cheerio";
import { BaseScraper, type ScrapedJob } from "./base.scraper.js";
import type { JobSource } from "@postly/shared-types";

const BASE_URL = "https://weworkremotely.com";

export class WeWorkRemotelyScraper extends BaseScraper {
  source: JobSource = "weworkremotely";

  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    // Scrape multiple categories
    const categories = [
      "/categories/remote-programming-jobs",
      "/categories/remote-design-jobs",
      "/categories/remote-devops-sysadmin-jobs",
      "/categories/remote-data-jobs",
    ];

    for (const category of categories) {
      try {
        const categoryJobs = await this.scrapeCategory(category);
        jobs.push(...categoryJobs);
      } catch (error) {
        console.error(`[WWR] Failed to scrape category ${category}:`, error);
      }

      // Rate limiting - wait between requests
      await this.delay(2000);
    }

    // Deduplicate by source_url
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
    console.log(`[WWR] Fetching ${url}`);

    const html = await this.fetchWithBrowser(url, "section.jobs");
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];
    const jobUrls: string[] = [];

    // WWR uses <li> elements inside job sections
    $("section.jobs li").each((_, element) => {
      try {
        const $el = $(element);

        // Skip view-all links
        if ($el.hasClass("view-all")) return;

        const $link = $el.find('a[href*="/remote-jobs/"]').first();
        const href = $link.attr("href");

        if (!href || !href.includes("/remote-jobs/")) return;

        const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

        // Avoid duplicates in this batch
        if (jobUrls.includes(fullUrl)) return;
        jobUrls.push(fullUrl);

        // Get basic info from listing
        const title = $el.find(".title").text().trim();
        const company =
          $el.find(".company span.company").text().trim() ||
          $el.find(".company").first().text().trim().split("\n")[0].trim();
        const region = $el.find(".region").text().trim();
        const dateText = $el.find(".listing-date__date, time").text().trim();

        if (!title || !company) return;

        const postedAt = this.parsePostedDate(dateText);

        const job: ScrapedJob = {
          title,
          company_name: company,
          description: `${title} position at ${company}. ${region ? `Location: ${region}.` : ""} Remote opportunity from WeWorkRemotely.`,
          location: region || "Remote",
          remote: true,
          source_url: fullUrl,
          job_type: this.inferJobType(title),
          posted_at: postedAt,
        };

        jobs.push(job);
      } catch (error) {
        console.warn("[WWR] Failed to parse job element:", error);
      }
    });

    // Also try alternative structure
    $("article.job, .job-listing").each((_, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('a[href*="/remote-jobs/"]').first();
        const href = $link.attr("href");

        if (!href) return;

        const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        if (jobUrls.includes(fullUrl)) return;
        jobUrls.push(fullUrl);

        const title = $el.find(".title, h3, h2").first().text().trim();
        const company = $el.find(".company").text().trim();

        if (!title || !company) return;

        const job: ScrapedJob = {
          title,
          company_name: company,
          description: `${title} position at ${company}. Remote opportunity from WeWorkRemotely.`,
          location: "Remote",
          remote: true,
          source_url: fullUrl,
          job_type: this.inferJobType(title),
        };

        jobs.push(job);
      } catch (error) {
        console.warn("[WWR] Failed to parse article element:", error);
      }
    });

    console.log(`[WWR] Found ${jobs.length} jobs in ${category}`);

    // Fetch details for each job (with rate limiting)
    const detailedJobs: ScrapedJob[] = [];
    for (const job of jobs.slice(0, 20)) {
      // Limit to first 20 per category
      try {
        const detailed = await this.scrapeJobDetails(job);
        detailedJobs.push(detailed);
        await this.delay(1500); // Rate limit
      } catch (error) {
        console.warn(`[WWR] Failed to get details for ${job.title}:`, error);
        detailedJobs.push(job); // Use basic info if detail fetch fails
      }
    }

    return detailedJobs;
  }

  private async scrapeJobDetails(job: ScrapedJob): Promise<ScrapedJob> {
    try {
      const html = await this.fetchWithBrowser(
        job.source_url,
        ".listing-container",
      );
      const $ = cheerio.load(html);

      // Get full description
      const description =
        $(".listing-container .listing-description, .job-description")
          .text()
          .trim() || $(".listing-container").text().trim();

      // Get company info
      // const companyInfo = $('.company-card, .listing-logo-container').text().trim();

      // Look for salary info
      const salaryText = $('[class*="salary"], .compensation').text().trim();
      const salary = this.parseSalary(salaryText);

      // Extract skills from description
      const skills = this.extractSkills(description);

      // Get more precise location
      const location =
        $('.listing-location, .location, [class*="region"]')
          .first()
          .text()
          .trim() || job.location;

      return {
        ...job,
        description: description || job.description,
        skills_required: skills.length > 0 ? skills : undefined,
        salary_min: salary.min,
        salary_max: salary.max,
        location,
      };
    } catch (error) {
      console.warn(`[WWR] Error fetching job details: ${error}`);
      return job;
    }
  }
}
