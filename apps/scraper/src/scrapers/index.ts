import { BaseScraper } from "./base.scraper.js";
import { WeWorkRemotelyScraper } from "./weworkremotely.scraper.js";
import { RemoteCoScraper } from "./remote-co.scraper.js";
import type { JobSource } from "@postly/shared-types";

import { GenericScraper } from "./generic.scraper.js";
import { LinkedInScraper } from "./linkedin.scraper.js";

export { BaseScraper, type ScrapedJob } from "./base.scraper.js";
export { WeWorkRemotelyScraper } from "./weworkremotely.scraper.js";
export { RemoteCoScraper } from "./remote-co.scraper.js";
export { GenericScraper } from "./generic.scraper.js";
export { LinkedInScraper } from "./linkedin.scraper.js";

const scrapers: Record<string, new () => BaseScraper> = {
  weworkremotely: WeWorkRemotelyScraper,
  remote_co: RemoteCoScraper,
  generic: GenericScraper,
  linkedin: LinkedInScraper,
};

export function getScraper(source: JobSource): BaseScraper {
  const ScraperClass = scrapers[source];
  if (!ScraperClass) {
    throw new Error(`Unknown scraper source: ${source}`);
  }
  return new ScraperClass();
}

export function getAllScrapers(): BaseScraper[] {
  return Object.values(scrapers).map((Scraper) => new Scraper());
}

export const AVAILABLE_SOURCES: JobSource[] = Object.keys(
  scrapers,
) as JobSource[];
