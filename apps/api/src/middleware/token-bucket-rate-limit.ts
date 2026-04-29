import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/secrets.js";
import { Redis } from "ioredis";

interface RateLimitConfig {
  maxTokens: number;
  refillRateSec: number;
  keyPrefix?: string;
}

interface RedisWithTokenBucket extends Redis {
  consumeTokenBucket(
    key: string,
    maxTokens: number,
    refillRateSec: number,
    nowMs: number,
    requested: number,
  ): Promise<[number, string]>;
}

// Token Bucket algorithm using Redis Lua script to prevent race conditions.
// KEYS[1] = bucket key
// ARGV[1] = max capacity
// ARGV[2] = refill rate per second
// ARGV[3] = current time in ms
// ARGV[4] = requested tokens
const tokenBucketScript = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local refill_rate_per_sec = tonumber(ARGV[2])
  local now_ms = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4])
  
  local bucket = redis.call("HMGET", key, "tokens", "last_refill")
  local tokens = tonumber(bucket[1])
  local last_refill = tonumber(bucket[2])
  
  if not tokens then
    tokens = capacity
    last_refill = now_ms
  else
    local time_passed_ms = math.max(0, now_ms - last_refill)
    local accrued = (time_passed_ms / 1000) * refill_rate_per_sec
    tokens = math.min(capacity, tokens + accrued)
  end
  
  local granted = 0
  if tokens >= requested then
    tokens = tokens - requested
    granted = 1
  end
  
  redis.call("HMSET", key, "tokens", tostring(tokens), "last_refill", tostring(now_ms))
  -- TTL is enough time for bucket to refill completely
  local ttl = math.ceil(capacity / refill_rate_per_sec) + 1
  redis.call("EXPIRE", key, ttl)
  
  return { granted, tostring(tokens) }
`;

// Register the Lua script.
// ioredis adds it to the client instance as 'consumeTokenBucket'.
redis.defineCommand("consumeTokenBucket", {
  numberOfKeys: 1,
  lua: tokenBucketScript,
});

/**
 * Token Bucket API Rate Limiting Middleware
 *
 * - Algorithm: Token Bucket mapping directly to tokens refilled per second
 * - Identifier: Decoded JWT User ID for authenticated users, falling back to IP Address.
 * - Concurrency: Handled atomically via Redis Lua script.
 * - Fail-Safe: If Redis is down, it fails open (allows traffic).
 *
 * @param config { RateLimitConfig }
 */
export const tokenBucketRateLimiter = (config: RateLimitConfig) => {
  const { maxTokens, refillRateSec, keyPrefix = "rl:tb" } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (redis.status !== "ready") {
        // Fail Open behavior if Redis is not connected
        return next();
      }

      // Identifier: Start with IP Address
      let identifier = req.ip || "unknown-ip";

      // Attempt to verify the JWT to use User ID as identifier.
      // We use jwt.verify() (NOT jwt.decode()) to prevent identity spoofing.
      // An attacker could craft a JWT with any user ID to bypass per-user rate limits.
      const authHeader = req.headers["authorization"];
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        if (token.length > 0 && token.length < 4096) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id?: string };
            if (
              decoded &&
              typeof decoded.id === "string" &&
              decoded.id.length > 0
            ) {
              identifier = decoded.id;
            }
          } catch {
            // Invalid or expired token — fallback to IP-based rate limiting
          }
        }
      }

      const key = `${keyPrefix}:${identifier}`;
      const nowMs = Date.now();
      const requested = 1;

      // Executing the predefined Lua Script
      const [grantedResult, currentTokensResult] = await (
        redis as RedisWithTokenBucket
      ).consumeTokenBucket(key, maxTokens, refillRateSec, nowMs, requested);

      const granted = grantedResult === 1;
      const currentTokens = parseFloat(currentTokensResult);
      const remaining = Math.max(0, Math.floor(currentTokens));

      // Calculate when the user will have at least 1 token again
      let resetMs = nowMs;
      if (!granted && currentTokens < 1) {
        const tokensNeeded = 1 - currentTokens;
        resetMs = nowMs + (tokensNeeded / refillRateSec) * 1000;
      }

      // Inject standard HTTP headers
      res.setHeader("X-RateLimit-Limit", maxTokens.toString());
      res.setHeader("X-RateLimit-Remaining", remaining.toString());
      // X-RateLimit-Reset is typically epoch timestamp in seconds
      res.setHeader("X-RateLimit-Reset", Math.ceil(resetMs / 1000).toString());

      if (granted) {
        return next();
      }

      // Bucket is empty, return HTTP 429 Too Many Requests
      return res.status(429).json({
        success: false,
        error: {
          code: "too_many_requests",
          message: "Too many requests. Please try again later.",
          limit: maxTokens,
          remaining: remaining,
          reset_at: Math.ceil(resetMs / 1000),
        },
      });
    } catch (err) {
      // Fail Open logic: Allow traffic if Lua script fails or Redis throws an error
      console.error("Token Bucket Rate Limiter Error:", err);
      // Ensure we haven't already sent headers
      if (!res.headersSent) {
        return next();
      }
    }
  };
};
