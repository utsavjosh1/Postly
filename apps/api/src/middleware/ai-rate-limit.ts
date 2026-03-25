import { Request, Response, NextFunction } from "express";
import { NODE_ENV } from "../config/secrets.js";
import { redis } from "../lib/redis.js";
import type { JwtPayload } from "./auth.js";

interface AIRateLimitConfig {
  /** Max AI calls per window */
  maxCalls: number;
  /** Window duration in seconds (default: 86400 = 24 hours) */
  windowSeconds: number;
  /** Key prefix for Redis */
  keyPrefix: string;
}

const DEFAULT_CONFIG: AIRateLimitConfig = {
  maxCalls: 50,
  windowSeconds: 86400, // 24 hours
  keyPrefix: "ai:ratelimit",
};

/**
 * Check if a user has exceeded their AI call rate limit.
 * Returns true if the user is within limits, false if exceeded.
 */
export async function checkAIRateLimit(
  userId: string,
  config: Partial<AIRateLimitConfig> = {},
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const { maxCalls, windowSeconds, keyPrefix } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const key = `${keyPrefix}:${userId}`;
  const count = await redis.incr(key);

  // Set TTL on first increment
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);
  const resetAt = new Date(Date.now() + ttl * 1000);

  return {
    allowed: count <= maxCalls,
    remaining: Math.max(0, maxCalls - count),
    resetAt,
  };
}

/**
 * Express middleware that enforces per-user AI rate limiting.
 *
 * Usage:
 *   router.post("/ai/analyze", authenticate, aiRateLimitMiddleware(), handler);
 *   router.post("/ai/embed", authenticate, aiRateLimitMiddleware({ maxCalls: 100 }), handler);
 */
export function aiRateLimitMiddleware(config: Partial<AIRateLimitConfig> = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip in development
    if (NODE_ENV !== "production") {
      next();
      return;
    }

    const user = req.user as JwtPayload | undefined;
    if (!user?.id) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
      return;
    }

    try {
      const { allowed, remaining, resetAt } = await checkAIRateLimit(
        user.id,
        config,
      );

      // Set AI specific rate limit headers to prevent collision with global API limits
      res.setHeader("X-AI-RateLimit-Limit", config.maxCalls || 50);
      res.setHeader("X-AI-RateLimit-Remaining", remaining);
      res.setHeader("X-AI-RateLimit-Reset", resetAt.toISOString());

      if (!allowed) {
        res.status(429).json({
          success: false,
          error: {
            message:
              "Daily AI usage limit reached. Upgrade your plan for more.",
            resetAt: resetAt.toISOString(),
            remaining: 0,
          },
        });
        return;
      }

      next();
    } catch (error) {
      // Fail open — don't block users if Redis is down
      console.error("AI rate limiting error:", error);
      next();
    }
  };
}
