import { AI_CONFIG } from "./config";

interface VoyageResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    total_tokens: number;
  };
}

interface VoyageError {
  message?: string;
  status?: number;
  code?: string;
}

// Lazy-loaded API key
let voyageApiKey: string | null = null;

function getApiKey(): string {
  if (!voyageApiKey) {
    voyageApiKey = AI_CONFIG.voyage.apiKey;
  }
  return voyageApiKey;
}

/**
 * Retry logic with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  const delays = [1000, 2000, 4000];
  let lastError: VoyageError | undefined;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (err: unknown) {
      const error = err as VoyageError;
      lastError = error;

      const isRetryable =
        !error.status || [429, 500, 502, 503, 504].includes(error.status);

      if (!isRetryable || i === maxRetries) {
        throw error;
      }

      console.warn(
        `Voyage AI operation failed, retrying in ${delays[i]}ms...`,
        error.message || String(error),
      );
      await new Promise((resolve) => setTimeout(resolve, delays[i]));
    }
  }

  throw lastError;
}

/**
 * Generate a single embedding using Voyage AI.
 *
 * @param text - Text to embed
 * @param inputType - "document" or "query" (affects optimization)
 * @returns 1024-dimensional embedding vector
 */
export async function generateVoyageEmbedding(
  text: string,
  inputType: "document" | "query" = "document",
): Promise<number[]> {
  const embeddings = await generateVoyageEmbeddings([text], inputType);
  return embeddings[0] || [];
}

/**
 * Generate embeddings for multiple texts in a single request.
 * Automatically handles batching for large inputs.
 *
 * @param texts - Array of texts to embed
 * @param inputType - "document" or "query"
 * @returns Array of 1024-dimensional embedding vectors
 */
export async function generateVoyageEmbeddings(
  texts: string[],
  inputType: "document" | "query" = "document",
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const apiKey = getApiKey();
  const allEmbeddings: number[][] = new Array(texts.length);

  // Process in batches
  const maxBatchSize = AI_CONFIG.voyage.maxBatchSize;
  for (let i = 0; i < texts.length; i += maxBatchSize) {
    const batch = texts.slice(i, i + maxBatchSize);

    const response = await withRetry(async () => {
      const res = await fetch(AI_CONFIG.voyage.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.voyage.model,
          input: batch,
          input_type: inputType,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        const error: VoyageError = {
          message: errorData.message || `HTTP ${res.status}`,
          status: res.status,
          code: (errorData as any).code,
        };
        throw error;
      }

      return res.json() as Promise<VoyageResponse>;
    });

    // Map embeddings back to original positions
    for (const item of response.data) {
      allEmbeddings[i + item.index] = item.embedding;
    }
  }

  return allEmbeddings;
}

/**
 * Prepare weighted text for job embedding.
 * Emphasizes important fields like title and skills.
 *
 * @param job - Job object with title, description, skills, etc.
 * @returns Combined weighted text for embedding
 */
export function prepareJobTextForEmbedding(job: {
  job_title?: string;
  job_description?: string;
  skills_required?: string[];
  company_name?: string;
  industry?: string;
}): string {
  const parts: string[] = [];

  // Job title (30% weight - repeat 3x)
  if (job.job_title) {
    parts.push(job.job_title, job.job_title, job.job_title);
  }

  // Skills (25% weight - repeat 2x)
  if (job.skills_required?.length) {
    const skillsText = job.skills_required.join(", ");
    parts.push(skillsText, skillsText);
  }

  // Description (30% weight - truncate to 3000 chars)
  if (job.job_description) {
    parts.push(job.job_description.slice(0, 3000));
  }

  // Industry (10% weight)
  if (job.industry) {
    parts.push(job.industry);
  }

  // Company (5% weight)
  if (job.company_name) {
    parts.push(job.company_name);
  }

  // Truncate final result to ~30k chars
  return parts.join("\n").slice(0, 30000);
}

/**
 * Voyage AI embedding configuration
 */
export const VOYAGE_CONFIG = {
  get model() {
    return AI_CONFIG.voyage.model;
  },
  dimension: 1024,
  get maxBatchSize() {
    return AI_CONFIG.voyage.maxBatchSize;
  },
  get maxRpm() {
    return AI_CONFIG.voyage.maxRpm;
  },
} as const;
