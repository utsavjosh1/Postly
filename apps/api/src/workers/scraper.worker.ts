import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { SCRAPER_QUEUE_NAME } from "../services/queue.service.js";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const SCRAPER_SERVICE_URL =
  process.env.SCRAPER_SERVICE_URL || "http://scraper:8080";

const connection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

interface ScrapeJobData {
  urls: string[];
  priority: string;
}

export const setupScraperWorker = () => {
  console.log("👷 Initializing Scraper Worker...");

  const worker = new Worker<ScrapeJobData>(
    SCRAPER_QUEUE_NAME,
    async (job: Job<ScrapeJobData>) => {
      console.log(`[Job ${job.id}] Starting scrape for ${job.data.priority} priority sources`);

      try {
        const response = await fetch(`${SCRAPER_SERVICE_URL}/scrape`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            urls: job.data.urls,
            priority: job.data.priority,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Scraper service returned ${response.status}: ${errorText}`,
          );
        }

        const result = await response.json();
        console.log(`[Job ${job.id}] Scrape completed:`, result);
        return result;
      } catch (error) {
        console.error(`[Job ${job.id}] Failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 1, // Process one scrape job at a time to avoid overwhelming the browser
      limiter: {
        max: 10,
        duration: 1000,
      },
    },
  );

  worker.on("completed", (job) => {
    console.log(`[Job ${job.id}] Completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Job ${job.id}] Failed with error: ${err.message}`);
  });

  return worker;
};
