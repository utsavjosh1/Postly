import Link from "ioredis";
import { Redis } from "ioredis";

// Singleton container
let redisInstance: Redis | null = null;

export const getRedisConnection = (): Redis => {
  if (!redisInstance) {
    const redisHost = process.env.REDIS_HOST || "localhost";
    const redisPort = parseInt(process.env.REDIS_PORT || "6379");

    console.log(
      `[RedisFactory] Initializing new Redis connection to ${redisHost}:${redisPort}`,
    );

    redisInstance = new Link({
      host: redisHost,
      port: redisPort,
      maxRetriesPerRequest: null, // Critical for BullMQ
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redisInstance.on("error", (err) => {
      console.error("[RedisFactory] Redis error:", err);
    });

    redisInstance.on("connect", () => {
      console.log("[RedisFactory] Connected to Redis");
    });
  }

  return redisInstance;
};

// Shutdown handling
export const closeRedisConnection = async () => {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
    console.log("[RedisFactory] Redis connection closed");
  }
};
