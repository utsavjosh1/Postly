import { Redis } from "ioredis";
import { REDIS_URL } from "../config/secrets.js";
import { logger } from "@postly/logger";

/**
 * Shared Redis client for the API.
 *
 * Reuses the same connection pool for multiple features (rate limiting, health checks, etc.)
 * to keep the connection count low and stable.
 */
export const redis = new Redis(REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
});

redis.on("error", (err) => {
  // We log but don't crash — features should "fail open" if Redis is down
  logger.error("Shared Redis connection error", { error: err.message });
});

export default redis;
