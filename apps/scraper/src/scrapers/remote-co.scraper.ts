import * as cheerio from 'cheerio';
import { BaseScraper, type ScrapedJob } from './base.scraper';
import type { JobSource, JobType } from '@postly/shared-types';

const BASE_URL = 'https://remote.co';

export class RemoteCoScraper extends BaseScraper {
  source: JobSource = 'remote_co';

  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    // Remote.co job categories
    const categories = [
      '/remote-jobs/developer',
      '/remote-jobs/design',
      '/remote-jobs/software',
    ];

    for (const category of categories) {
      try {
        const categoryJobs = await this.scrapeCategory(category);
        jobs.push(...categoryJobs);
      } catch (error) {
        console.error(`[Remote.co] Failed to scrape category ${category}:`, error);
      }

      // Rate limiting
      await this.delay(1500);
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

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const jobs: ScrapedJob[] = [];

    // Remote.co uses different selectors
    $('.job_listing, .job-listing').each((_, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('a[href*="/job/"]').first();
        const href = $link.attr('href');

        if (!href) return;

        const title = $el.find('.position, .job-title, h3, h2').first().text().trim();
        const company = $el.find('.company, .job-company').first().text().trim();
        const location = $el.find('.location, .job-location').first().text().trim();

        if (!title || !company) return;

        const job: ScrapedJob = {
          title,
          company_name: company,
          description: `${title} position at ${company}. Remote opportunity from Remote.co.`,
          location: location || 'Remote',
          remote: true,
          source_url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          job_type: this.inferJobType(title),
        };

        jobs.push(job);
      } catch (error) {
        console.warn('[Remote.co] Failed to parse job element:', error);
      }
    });

    // Alternative structure using card elements
    $('[class*="card"], .card').each((_, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('a[href*="/job/"]');
        const href = $link.attr('href');

        if (!href) return;

        const title = $el.find('h2, h3, .title').first().text().trim();
        const company = $el.find('.company, [class*="company"]').first().text().trim();

        if (!title || !company) return;

        const sourceUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

        // Skip duplicates
        if (jobs.some(j => j.source_url === sourceUrl)) return;

        const job: ScrapedJob = {
          title,
          company_name: company,
          description: `${title} position at ${company}. Remote opportunity.`,
          location: 'Remote',
          remote: true,
          source_url: sourceUrl,
          job_type: this.inferJobType(title),
        };

        jobs.push(job);
      } catch (error) {
        console.warn('[Remote.co] Failed to parse card element:', error);
      }
    });

    console.log(`[Remote.co] Found ${jobs.length} jobs in ${category}`);
    return jobs;
  }

  private inferJobType(title: string): JobType {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('intern')) return 'internship';
    if (lowerTitle.includes('contract')) return 'contract';
    if (lowerTitle.includes('part-time') || lowerTitle.includes('part time')) return 'part-time';
    return 'full-time';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
