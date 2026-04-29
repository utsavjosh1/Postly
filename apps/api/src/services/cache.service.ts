import { redis } from "../lib/redis.js";
import { logger } from "@postly/logger";

/**
 * Standardized Cache Service
 * Provides generic cache-aside wrapping with graceful degradation.
 */
export class CacheService {
  private static readonly APP_NAME = "postly";
  private static readonly VERSION = "v1";

  /**
   * Generates a namespaced, standardized key to prevent collisions.
   * Format: app_name:version:entity:id
   *
   * @example
   * CacheService.generateKey('user', '123') // => "postly:v1:user:123"
   */
  public static generateKey(entity: string, id: string | number): string {
    return `${this.APP_NAME}:${this.VERSION}:${entity}:${id}`;
  }

  /**
   * Generic Cache-Aside Wrapper (Fail-Open)
   *
   * Attempts to fetch data from the KV store. On miss or redis error,
   * falls back to the provided `fetchFunction`, caches the result,
   * and returns the data.
   *
   * @param key Fully qualified cache key (use `generateKey` for consistency).
   * @param ttlSeconds Time-to-live in seconds.
   * @param fetchFunction Async function to execute on cache miss (e.g. DB query).
   * @returns The cached or freshly fetched data.
   */
  public static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetchFunction: () => Promise<T>,
  ): Promise<T> {
    try {
      // 1. Check Redis for existing data
      const cachedData = await redis.get(key);
      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }
    } catch (error) {
      // Log warning but DO NOT crash (Graceful Degradation)
      logger.warn("Redis GET failed", { key, error: String(error) });
    }

    // 2. On miss (or Redis failure), execute the source DB query
    const freshData = await fetchFunction();

    // 3. Attempt to save the fresh data to the cache
    try {
      // Only cache non-null/non-undefined results
      if (freshData !== undefined && freshData !== null) {
        // Run SET asynchronously to not block returning the response
        redis.setex(key, ttlSeconds, JSON.stringify(freshData)).catch((err) => {
          logger.warn("Background Redis SETEX failed", {
            key,
            error: String(err),
          });
        });
      }
    } catch (error) {
      logger.warn("Redis SETEX synchronous error", {
        key,
        error: String(error),
      });
    }

    // 4. Return data immediately
    return freshData;
  }

  /**
   * Invalidates a specific key.
   */
  public static async invalidate(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.warn("Redis DEL failed", { key, error: String(error) });
    }
  }

  /**
   * Invalidates all keys matching a pattern using a non-blocking SCAN operation.
   *
   * @example CacheService.invalidatePattern('postly:v1:user:*')
   */
  public static async invalidatePattern(pattern: string): Promise<void> {
    try {
      let cursor = "0";
      do {
        // Scan in chunks of 100 to avoid blocking the Redis event loop
        const [nextCursor, matchingKeys] = await redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          "100",
        );
        cursor = nextCursor;
        if (matchingKeys.length > 0) {
          await redis.del(...matchingKeys);
        }
      } while (cursor !== "0");
    } catch (error) {
      logger.warn("Redis pattern invalidation failed", {
        pattern,
        error: String(error),
      });
    }
  }
}
