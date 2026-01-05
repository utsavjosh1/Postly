import { BaseScraper } from './base.scraper';
import { WeWorkRemotelyScraper } from './weworkremotely.scraper';
import { RemoteCoScraper } from './remote-co.scraper';
import type { JobSource } from '@postly/shared-types';

export { BaseScraper, type ScrapedJob } from './base.scraper';
export { WeWorkRemotelyScraper } from './weworkremotely.scraper';
export { RemoteCoScraper } from './remote-co.scraper';

const scrapers: Record<string, new () => BaseScraper> = {
  weworkremotely: WeWorkRemotelyScraper,
  remote_co: RemoteCoScraper,
};

export function getScraper(source: JobSource): BaseScraper {
  const ScraperClass = scrapers[source];
  if (!ScraperClass) {
    throw new Error(`Unknown scraper source: ${source}`);
  }
  return new ScraperClass();
}

export function getAllScrapers(): BaseScraper[] {
  return Object.values(scrapers).map(Scraper => new Scraper());
}

export const AVAILABLE_SOURCES: JobSource[] = Object.keys(scrapers) as JobSource[];
