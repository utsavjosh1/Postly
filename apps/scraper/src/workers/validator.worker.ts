import { Worker } from "bullmq";
import { getRedisConnection } from "../infra/redis.js";
import { jobQueries } from "@postly/database";
import * as cheerio from "cheerio";

const worker = new Worker(
  "validation-queue",
  async (job) => {
    const { jobId, url } = job.data;
    console.log(`[ValidatorWorker] Validating job ${jobId} at ${url}`);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "PostlyBot/1.0" },
      });

      let isExpired = false;

      if (response.status === 404) {
        isExpired = true;
      } else if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        const textLower = $.text().toLowerCase();

        if (
          textLower.includes("job closed") ||
          textLower.includes("no longer accepting applications") ||
          textLower.includes("this listing has expired")
        ) {
          isExpired = true;
        }
      }

      if (isExpired) {
        console.log(`[ValidatorWorker] Job ${jobId} is EXPIRED. Updating DB.`);
        await jobQueries.markInactiveById(jobId);
      }
    } catch (error) {
      console.error(
        `[ValidatorWorker] Error validating job ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
  {
    // @ts-ignore
    connection: getRedisConnection(),
    concurrency: 20,
  },
);

worker.on("failed", (job, err) => {
  console.error(`[ValidatorWorker] Job ${job?.id} failed: ${err.message}`);
});
