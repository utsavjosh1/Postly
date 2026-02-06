import { Queue, QueueEvents } from "bullmq";
import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);

const connection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const SCRAPER_QUEUE_NAME = "scraper-queue";

export const scraperQueue = new Queue(SCRAPER_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

export const scraperQueueEvents = new QueueEvents(SCRAPER_QUEUE_NAME, {
  connection,
});

export const queueService = {
  /**
   * Add a scraping job to the queue
   */
  async addScrapeJob(
    urls: string[],
    priority: "high" | "medium" | "low" = "medium",
  ) {
    return scraperQueue.add(
      "scrape-job",
      { urls, priority },
      {
        priority: priority === "high" ? 1 : priority === "medium" ? 2 : 3,
      },
    );
  },

  /**
   * Schedule a recurring scrape job
   */
  async scheduleRecurringScrape(
    urls: string[],
    cron: string,
    jobId: string,
    priority: "high" | "medium" | "low" = "medium",
  ) {
    return scraperQueue.add(
      "scrape-job",
      { urls, priority },
      {
        repeat: { pattern: cron },
        jobId, // Ensures we don't duplicate schedules
        priority: priority === "high" ? 1 : priority === "medium" ? 2 : 3,
      },
    );
  },

  /**
   * Get queue status
   */
  async getStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      scraperQueue.getWaitingCount(),
      scraperQueue.getActiveCount(),
      scraperQueue.getCompletedCount(),
      scraperQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  },

  /**
   * Close the queue
   */
  async close() {
    await scraperQueue.close();
    await scraperQueueEvents.close();
  },
};
