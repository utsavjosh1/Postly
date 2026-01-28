import dotenv from "dotenv";
import path from "path";
import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import {
  getScraper,
  getAllScrapers,
  AVAILABLE_SOURCES,
} from "./scrapers/index.js";
import { browserManager } from "./utils/browser.js";
import { runCleanup } from "./workers/cleanup.worker.js";
import type { JobSource } from "@postly/shared-types";

const isDev = process.env.NODE_ENV === "development";
const __dirname = path.resolve();
const root = isDev ? __dirname : path.resolve(__dirname, "../..");
// Load environment variables from root .env file
dotenv.config({ path: path.resolve(root, ".env") });

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");

const redisConnection = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
};

const redis = new Redis(redisConnection);

// Create queues for scheduling jobs
const scrapingQueue = new Queue("job-scraping", {
  connection: redisConnection,
});
const cleanupQueue = new Queue("job-cleanup", { connection: redisConnection });

// Scraping worker
const scrapingWorker = new Worker(
  "job-scraping",
  async (job) => {
    const { source, scrapeAll, targetUrl } = job.data as {
      source?: JobSource;
      scrapeAll?: boolean;
      targetUrl?: string; // For generic scraper dynamic targets
    };

    // Dispatcher Mode: If scrapeAll is true, dispatch individual jobs for parallelism
    if (scrapeAll) {
      console.log(`\n📢 [Dispatcher] Starting batch scrape for all sources...`);
      const scrapers = getAllScrapers();
      const jobs = scrapers.map((scraper) => ({
        name: `scrape-${scraper.source}`,
        data: { source: scraper.source },
        opts: { jobId: `${scraper.source}-${Date.now()}` },
      }));

      await scrapingQueue.addBulk(jobs);
      console.log(
        `✅ [Dispatcher] Queued ${jobs.length} source jobs for parallel processing.`,
      );
      return { dispatched: jobs.length };
    }

    // Worker Mode: Process specific source
    if (!source) {
      throw new Error("Job missing 'source' or 'scrapeAll' flag");
    }

    console.log(`Processing scraping job: ${job.id} (Source: ${source})`);

    try {
      // Initialize browser (lazy init if not already ready)
      await browserManager.initialize();

      let scraper;
      // Special handling for generic scraper to accept dynamic URLs
      if (source === "generic" && targetUrl) {
        const { GenericScraper } =
          await import("./scrapers/generic.scraper.js");
        scraper = new GenericScraper([targetUrl]);
      } else {
        scraper = getScraper(source);
      }

      if (!scraper) {
        throw new Error(`No scraper found for source: ${source}`);
      }

      const stats = await scraper.scrapeAndSave();

      // Rotate browser context between jobs to minimize fingerprinting
      if (Math.random() > 0.7) {
        // 30% chance to rotate after a job
        await browserManager.rotateContext();
      }

      return {
        source,
        ...stats,
      };
    } catch (error) {
      console.error(`❌ Job failed for source ${source}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Run up to 5 scrapers simultaneously
    limiter: {
      max: 10, // Limit to 10 jobs
      duration: 1000, // per second (though scrape jobs take longer, this throttles rapid dispatches)
    },
  },
);

// Cleanup worker
const cleanupWorker = new Worker(
  "job-cleanup",
  async (job) => {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Processing cleanup job: ${job.id}`);
    console.log(`${"=".repeat(50)}\n`);

    try {
      const result = await runCleanup();
      return result;
    } catch (error) {
      console.error("Cleanup job failed:", error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  },
);

scrapingWorker.on("completed", (job, result) => {
  console.log(`\n✅ Scraping job ${job.id} completed successfully`);
  console.log(`   Total Saved: ${result.totalSaved}`);
  console.log(`   Total Updated: ${result.totalUpdated}`);
  console.log(`   Total Skipped: ${result.totalSkipped}`);
  console.log(`   Total Errors: ${result.totalErrors}`);
});

scrapingWorker.on("failed", (job, err) => {
  console.error(`\n❌ Scraping job ${job?.id} failed:`, err.message);
});

cleanupWorker.on("completed", (job, result) => {
  console.log(`\n✅ Cleanup job ${job.id} completed`);
  console.log(`   Deactivated: ${result.deactivated}`);
  console.log(`   Deleted: ${result.deleted}`);
});

cleanupWorker.on("failed", (job, err) => {
  console.error(`\n❌ Cleanup job ${job?.id} failed:`, err.message);
});

// Setup scheduled jobs
async function setupScheduledJobs() {
  console.log("🕐 Setting up scheduled jobs...");

  // Clear any existing repeatable jobs
  const scrapingRepeatableJobs = await scrapingQueue.getRepeatableJobs();
  for (const job of scrapingRepeatableJobs) {
    await scrapingQueue.removeRepeatableByKey(job.key);
  }

  const cleanupRepeatableJobs = await cleanupQueue.getRepeatableJobs();
  for (const job of cleanupRepeatableJobs) {
    await cleanupQueue.removeRepeatableByKey(job.key);
  }

  // Schedule scraping every 4 hours
  await scrapingQueue.add(
    "scrape-all",
    { scrapeAll: true },
    {
      repeat: {
        pattern: "0 */4 * * *", // Every 4 hours
      },
      jobId: "scheduled-scrape-all",
    },
  );
  console.log('   ✓ Scheduled "scrape-all" to run every 4 hours');

  // Schedule cleanup daily at 3 AM
  await cleanupQueue.add(
    "daily-cleanup",
    {},
    {
      repeat: {
        pattern: "0 3 * * *", // Daily at 3 AM
      },
      jobId: "scheduled-cleanup",
    },
  );
  console.log('   ✓ Scheduled "cleanup" to run daily at 3 AM');

  // Add an immediate initial scrape job if no active jobs
  const existingJobs = await scrapingQueue.getJobs(["waiting", "active"]);
  if (existingJobs.length === 0) {
    await scrapingQueue.add(
      "initial-scrape",
      { scrapeAll: true },
      { jobId: "initial-scrape" },
    );
    console.log("   ✓ Added initial scrape job");
  }
}

// CLI commands
async function handleCommand(command: string) {
  const args = command.split(" ");
  const cmd = args[0];

  switch (cmd) {
    case "scrape-now":
      console.log("Adding immediate scrape job...");
      await scrapingQueue.add(
        "manual-scrape",
        { scrapeAll: true },
        { jobId: `manual-${Date.now()}` },
      );
      break;

    case "scrape": {
      const source = args[1] as JobSource;
      const targetUrl = args[2];

      if (source && AVAILABLE_SOURCES.includes(source)) {
        console.log(`Adding ${source} scrape job...`);
        // Pass targetUrl in job data if present (only used by generic scraper)
        await scrapingQueue.add(
          `manual-${source}`,
          { source, targetUrl },
          { jobId: `${source}-${Date.now()}` },
        );
      } else {
        console.log(
          `Unknown source. Available: ${AVAILABLE_SOURCES.join(", ")}`,
        );
      }
      break;
    }

    case "cleanup": {
      console.log("Adding immediate cleanup job...");
      await cleanupQueue.add(
        "manual-cleanup",
        {},
        { jobId: `cleanup-${Date.now()}` },
      );
      break;
    }

    case "status": {
      const scrapingWaiting = await scrapingQueue.getWaitingCount();
      const scrapingActive = await scrapingQueue.getActiveCount();
      const scrapingCompleted = await scrapingQueue.getCompletedCount();
      const scrapingFailed = await scrapingQueue.getFailedCount();

      const cleanupWaiting = await cleanupQueue.getWaitingCount();
      const cleanupActive = await cleanupQueue.getActiveCount();

      console.log(`\nScraping Queue Status:`);
      console.log(`  Waiting: ${scrapingWaiting}`);
      console.log(`  Active: ${scrapingActive}`);
      console.log(`  Completed: ${scrapingCompleted}`);
      console.log(`  Failed: ${scrapingFailed}`);

      console.log(`\nCleanup Queue Status:`);
      console.log(`  Waiting: ${cleanupWaiting}`);
      console.log(`  Active: ${cleanupActive}`);
      break;
    }

    case "sources":
      console.log(`\nAvailable sources: ${AVAILABLE_SOURCES.join(", ")}`);
      break;

    case "help":
      console.log(`
Available commands:
  scrape-now          - Trigger immediate scrape of all sources
  scrape <source>     - Scrape specific source (${AVAILABLE_SOURCES.join(", ")})
  cleanup             - Trigger immediate cleanup
  status              - Show queue status
  sources             - List available sources
  help                - Show this help message
      `);
      break;

    default:
      console.log('Unknown command. Type "help" for available commands.');
  }
}

// Main startup
async function main() {
  console.log("🔍 Scraper service starting...");
  console.log(`📍 Connecting to Redis at ${redisHost}:${redisPort}`);
  console.log(`📋 Available sources: ${AVAILABLE_SOURCES.join(", ")}`);

  // Initialize browser on startup
  console.log("🌐 Initializing browser...");
  await browserManager.initialize();

  await setupScheduledJobs();

  console.log("\n🚀 Scraper service started and ready!");
  console.log('   Type "help" for available commands\n');

  // Handle stdin commands (for manual triggering)
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", async (data) => {
    const command = data.toString().trim();
    if (command) {
      await handleCommand(command);
    }
  });

  // Handle command line arguments (e.g. npm start -- scrape generic https://...)
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const command = args.join(" ");
    console.log(`\n📦 Processing CLI command: ${command}`);
    // Wait a bit for initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await handleCommand(command);
  }
}

main().catch(console.error);

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down...`);

  // Close browser
  await browserManager.close();

  // Close workers
  await scrapingWorker.close();
  await cleanupWorker.close();

  // Close queues
  await scrapingQueue.close();
  await cleanupQueue.close();

  // Close Redis
  await redis.quit();

  console.log("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
