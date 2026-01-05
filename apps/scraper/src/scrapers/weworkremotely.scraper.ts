import * as cheerio from 'cheerio';
import { BaseScraper, type ScrapedJob } from './base.scraper';
import type { JobSource, JobType } from '@postly/shared-types';

const BASE_URL = 'https://weworkremotely.com';

export class WeWorkRemotelyScraper extends BaseScraper {
  source: JobSource = 'weworkremotely';

  async scrape(): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    // Scrape programming category
    const categories = [
      '/remote-jobs/search?term=developer',
      '/remote-jobs/search?term=engineer',
      '/remote-jobs/search?term=software',
    ];

    for (const category of categories) {
      try {
        const categoryJobs = await this.scrapeCategory(category);
        jobs.push(...categoryJobs);
      } catch (error) {
        console.error(`[WWR] Failed to scrape category ${category}:`, error);
      }

      // Rate limiting - wait between requests
      await this.delay(1000);
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

    // WWR uses <article> elements for job listings
    $('article.job').each((_, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('a').first();
        const href = $link.attr('href');

        if (!href) return;

        const title = $el.find('.title').text().trim();
        const company = $el.find('.company').text().trim();
        const region = $el.find('.region').text().trim();

        if (!title || !company) return;

        const job: ScrapedJob = {
          title,
          company_name: company,
          description: `${title} position at ${company}. ${region ? `Location: ${region}.` : ''} Remote opportunity from WeWorkRemotely.`,
          location: region || 'Remote',
          remote: true,
          source_url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          job_type: this.inferJobType(title),
        };

        jobs.push(job);
      } catch (error) {
        console.warn('[WWR] Failed to parse job element:', error);
      }
    });

    // Also try alternative selector for some pages
    $('li.feature').each((_, element) => {
      try {
        const $el = $(element);
        const $link = $el.find('a[href*="/remote-jobs/"]');
        const href = $link.attr('href');

        if (!href) return;

        const title = $el.find('.title').text().trim() || $link.text().trim();
        const company = $el.find('.company').text().trim();

        if (!title || !company) return;

        const sourceUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

        // Skip if we already have this job
        if (jobs.some(j => j.source_url === sourceUrl)) return;

        const job: ScrapedJob = {
          title,
          company_name: company,
          description: `${title} position at ${company}. Remote opportunity from WeWorkRemotely.`,
          location: 'Remote',
          remote: true,
          source_url: sourceUrl,
          job_type: this.inferJobType(title),
        };

        jobs.push(job);
      } catch (error) {
        console.warn('[WWR] Failed to parse feature element:', error);
      }
    });

    console.log(`[WWR] Found ${jobs.length} jobs in ${category}`);
    return jobs;
  }

  private inferJobType(title: string): JobType {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('intern')) return 'internship';
    if (lowerTitle.includes('contract') || lowerTitle.includes('contractor')) return 'contract';
    if (lowerTitle.includes('part-time') || lowerTitle.includes('part time')) return 'part-time';
    return 'full-time';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
