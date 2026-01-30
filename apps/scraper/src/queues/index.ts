import { Queue } from "bullmq";
import { getRedisConnection } from "../infra/redis.js";
import "dotenv/config";

const connection = getRedisConnection();

export const scrapingQueue = new Queue("scraping-queue", { connection });
export const validationQueue = new Queue("validation-queue", { connection });

export const QUEUE_CONNECTION = connection;
