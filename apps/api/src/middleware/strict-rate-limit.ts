import { Request, Response, NextFunction } from "express";
import { Redis } from "ioredis";
import { User } from "@postly/shared-types";

// ...

// Initialize Redis client
// Using the same connection config as the main app
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message: string;
}

/**
 * Creates a strict rate limiter middleware using Redis.
 * Persists limits across server restarts.
 */
export const createStrictRateLimiter = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (process.env.NODE_ENV === "development") {
        next();
        return;
      }

      const user = (req as Request & { user?: User }).user;
      if (!user?.id) {
        res.status(401).json({
          success: false,
          error: { message: "Authentication required for rate limiting" },
        });
        return;
      }

      const userId = user.id;
      const key = `${config.keyPrefix}:${userId}`;

      // Get current count
      const currentCount = await redis.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      console.log(
        `[RateLimit] User: ${userId}, Env: ${process.env.NODE_ENV}, Max: ${config.max}, Count: ${count}`,
      );

      if (count >= config.max) {
        // Get Time-to-Live to tell user when they can try again
        const ttl = await redis.ttl(key);
        const resetDate = new Date(Date.now() + ttl * 1000);

        res.status(429).json({
          success: false,
          error: {
            message: config.message,
            resetAt: resetDate.toISOString(),
          },
        });
        return;
      }

      // Increment count
      // If key doesn't exist, set it with expiry
      if (!currentCount) {
        await redis.set(key, 1, "EX", Math.ceil(config.windowMs / 1000));
      } else {
        await redis.incr(key);
      }

      next();
    } catch (error) {
      console.error("Rate limiting error:", error);
      // Fail open to avoid blocking users on redis error, but log it
      next();
    }
  };
};

// 1000 requests in dev, 3 in prod
const isDev = process.env.NODE_ENV === "development";

export const chatRateLimiter = createStrictRateLimiter({
  windowMs: isDev ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 1 hour in dev, 7 days in prod
  max: isDev ? 10000 : 3, // Unlimited-ish in dev
  keyPrefix: "rate_limit:ai_chat",
  message:
    "Weekly AI limit reached (3 requests/week). Upgrade to Premium for more.",
});
