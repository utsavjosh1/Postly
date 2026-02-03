import { Queue } from "bullmq";
import { getRedisConnection } from "./infra/redis.js";

// Re-using the singleton connection for queues
const connection = getRedisConnection();

// @ts-ignore
export const scrapingQueue = new Queue("scraping-queue", { connection });
// @ts-ignore
export const validationQueue = new Queue("validation-queue", { connection });

async function setupCronJobs() {
  console.log("[QueueManager] Setting up cron jobs...");

  // 1. Schedule LinkedIn Scrape (Every 6 hours)
  await scrapingQueue.add(
    "scrape-linkedin",
    { provider: "linkedin" },
    {
      repeat: {
        pattern: "0 */6 * * *", // Cron pattern: At minute 0 past every 6th hour
      },
      jobId: "cron-scrape-linkedin", // Singleton ID
    },
  );
  console.log("Scheduled: LinkedIn Scrape (0 */6 * * *)");

  // 2. Schedule RemoteOk Scrape (Every 6 hours offset)
  await scrapingQueue.add(
    "scrape-remoteok",
    { provider: "remoteok" },
    {
      repeat: {
        pattern: "30 */6 * * *", // Offset by 30 mins
      },
      jobId: "cron-scrape-remoteok",
    },
  );
  console.log("Scheduled: RemoteOk Scrape (30 */6 * * *)");

  // 3. Schedule Daily Validation Dispatch using a System Job
  // Instead of a worker handling dispatch, we can run a separate logic or use a scheduled job
  // that a dedicated processor handles.
  // For simplicity and robustness, we can just run a function here if this process stays alive,
  // OR schedule a job in a "system-queue" or re-use scrapingQueue with a special tag.
  // Let's use the scrapingQueue with 'system-validation-dispatch' as implemented in previous plan,
  // but we need to handle it in `scraper.worker.ts` OR a separate processor.
  // The user requested "queue-manager.ts" as orchestrator.
  // Let's Schedule it here.

  await scrapingQueue.add(
    "dispatch-validation",
    { provider: "system-validation-dispatch" },
    {
      repeat: {
        pattern: "0 0 * * *", // Every midnight
      },
      jobId: "cron-dispatch-validation",
    },
  );
  console.log("Scheduled: Validation Dispatch (Daily at 00:00)");
}

async function main() {
  await setupCronJobs();
  console.log("[QueueManager] Initialization complete. Orchestrator ready.");

  // In production, this script might run once to seed jobs, or run as a daemon.
  // If daemon, we keep it alive. If just seeder, we exit.
  // Given "The orchestrator that adds cron-jobs", a run-once seeder is typical for BullMQ repeatable jobs.
  // But if we want to also *listen* to events or manage queues, we might keep it running.
  // For now, I'll exit after seeding to be safe and simple.
  process.exit(0);
}

main().catch(console.error);
