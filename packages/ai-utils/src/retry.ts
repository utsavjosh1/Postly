/**
 * retry.ts
 * Shared exponential-backoff retry helper used by both voyage.ts and openai.ts.
 */

interface RetryableError {
  message?: string;
  status?: number;
  code?: string;
}

const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

/**
 * Retry an async operation with exponential backoff.
 *
 * @param operation  - The async operation to attempt
 * @param delays     - Delay in ms between retries (default: [1s, 2s, 4s, 8s])
 * @param label      - Label used in warning logs (e.g. "voyage", "openai")
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  delays: number[] = [1000, 2000, 4000, 8000],
  label = "ai",
): Promise<T> {
  let lastError: RetryableError | undefined;

  for (let i = 0; i <= delays.length; i++) {
    try {
      return await operation();
    } catch (err: unknown) {
      const error = err as RetryableError;
      lastError = error;

      const isRetryable =
        !error.status || RETRYABLE_STATUS_CODES.includes(error.status);

      if (!isRetryable || i === delays.length) throw error;

      console.warn(
        `[${label}] retry ${i + 1}/${delays.length} in ${delays[i]}ms — ${error.message || String(error)}`,
      );
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }

  throw lastError;
}
