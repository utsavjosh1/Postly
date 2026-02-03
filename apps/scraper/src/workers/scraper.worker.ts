import { Worker } from "bullmq";
import { getRedisConnection } from "../infra/redis.js";
import { LinkedInScraper } from "../scrapers/linkedin.scraper.js";
import { GenericScraper } from "../scrapers/generic.scraper.js";
import { WeWorkRemotelyScraper } from "../scrapers/weworkremotely.scraper.js";
import { BaseScraper } from "../scrapers/base.scraper.js";
import { jobQueries } from "@postly/database";

const scrapers: Record<string, BaseScraper> = {
  linkedin: new LinkedInScraper(),
  generic: new GenericScraper(),
  weworkremotely: new WeWorkRemotelyScraper(),
};

const worker = new Worker(
  "scraping-queue",
  async (job) => {
    const { provider } = job.data;
    console.log(
      `\n🧵 [Worker:${job.id}] Received job for provider: ${provider}`,
    );

    if (provider === "system-validation-dispatch") {
      console.log(
        "[ScraperWorker] Dispatching validation tasks for all active jobs...",
      );

      const jobsToValidate = await jobQueries.findActive({}, 1000);

      console.log(
        `[ScraperWorker] Found ${jobsToValidate.length} active jobs to validate.`,
      );

      // Dynamic import to avoid circular dependency issues if any
      const { validationQueue } = await import("../queue-manager.js");

      await validationQueue.addBulk(
        jobsToValidate
          .filter((j) => j.source_url)
          .map((j) => ({
            name: "validate",
            data: { jobId: j.id, url: j.source_url as string },
            opts: { removeOnComplete: true, removeOnFail: true },
          })),
      );

      console.log("[ScraperWorker] Dispatched all validation tasks.");
      return;
    }

    const scraper = scrapers[provider];
    if (!scraper) {
      if (job.data.url) {
        console.log(`[ScraperWorker] Using GenericScraper for ${job.data.url}`);
        const generic = new GenericScraper([job.data.url]);
        await generic.scrapeAndSave();
        return;
      }
      throw new Error(`Unknown provider: ${provider}`);
    }

    try {
      const stats = await scraper.scrapeAndSave();
      console.log(`[ScraperWorker] Finished. Stats: ${JSON.stringify(stats)}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);

      // Error Classification
      if (msg.includes("Selector Integrity Error")) {
        console.error(`🚨 [Selector Integrity] BROKEN SCRAPER: ${msg}`);
      } else if (msg.includes("Browser blocked") || msg.includes("HTTP")) {
        console.error(
          `🛡️ [Anti-Bot] BLOCKED: ${msg} - Suggest rotating proxy/UA.`,
        );
      } else {
        console.error(`💥 [System Failure] Unhandled error: ${msg}`);
      }

      console.error(`[ScraperWorker] Full Error Stack:`, error);
      throw error;
    }
  },
  {
    // @ts-ignore
    connection: getRedisConnection(),
    concurrency: 2,
  },
);

worker.on("completed", (job) => {
  console.log(`[ScraperWorker] Job ${job.id} completed!`);
});

worker.on("failed", (job, err) => {
  console.error(`[ScraperWorker] Job ${job?.id} failed: ${err.message}`);
});
