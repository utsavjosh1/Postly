import { Request, Response, NextFunction } from "express";
import { Redis } from "ioredis";
import { REDIS_URL, NODE_ENV } from "../config/secrets.js";
import type { JwtPayload } from "./auth.js";

// Initialize Redis client
const redis = new Redis(REDIS_URL || "redis://localhost:6379");

interface RateLimitConfig {
  windowMs: number;
  max: number | ((req: Request) => number | Promise<number>);
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
      // Allow development and test environments to bypass limits
      if (NODE_ENV !== "production") {
        next();
        return;
      }

      const user = req.user as JwtPayload | undefined;
      if (!user?.id) {
        res.status(401).json({
          success: false,
          error: { message: "Authentication required for rate limiting" },
        });
        return;
      }

      const userId = user.id;
      const key = `${config.keyPrefix}:${userId}`;

      // Get dynamic max limit
      let maxLimit: number;
      if (typeof config.max === "function") {
        const dynamicMax = await config.max(req);
        maxLimit = dynamicMax ?? 3;
      } else {
        maxLimit = config.max ?? 3;
      }

      // Get current count
      const currentCount = await redis.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      if (count >= maxLimit && maxLimit !== Infinity) {
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
      if (!currentCount) {
        await redis.set(key, 1, "EX", Math.ceil(config.windowMs / 1000));
      } else {
        await redis.incr(key);
      }

      next();
    } catch (error) {
      console.error("Rate limiting error:", error);
      // Fail open to avoid blocking users on redis error
      next();
    }
  };
};

const isDev = NODE_ENV !== "production";

export const chatRateLimiter = createStrictRateLimiter({
  windowMs: isDev ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  max: async (req: Request) => {
    if (isDev) return 10000;

    const user = req.user as JwtPayload | undefined;
    if (!user) return 3;

    if (user.role === "admin") return Infinity;
    if (user.role === "employer") return 50;

    return 3;
  },
  keyPrefix: "rate_limit:ai_chat",
  message: "Weekly AI limit reached. Upgrade to Premium for more.",
});
