import { Queue } from "bullmq";
import { getRedisConnection } from "../infra/redis.js";
import "dotenv/config";

const connection = getRedisConnection();

// @ts-ignore
export const scrapingQueue = new Queue("scraping-queue", { connection });
// @ts-ignore
export const validationQueue = new Queue("validation-queue", { connection });

export const QUEUE_CONNECTION = connection;
