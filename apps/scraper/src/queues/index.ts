import { Queue } from "bullmq";
import { getRedisConnection } from "../infra/redis.js";
import "dotenv/config";

const connection = getRedisConnection();

// @ts-expect-error ioredis version mismatch
export const scrapingQueue = new Queue("scraping-queue", { connection });
// @ts-expect-error ioredis version mismatch
export const validationQueue = new Queue("validation-queue", { connection });

export const QUEUE_CONNECTION = connection;
