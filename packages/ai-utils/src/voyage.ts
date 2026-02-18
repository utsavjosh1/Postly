/**
 * voyage.ts
 * Voyage AI embedding generation with metadata tracking,
 * batching, rate-limiting, and retry logic.
 *
 * Model: voyage-4-large (1024 dims default, 32K context, MoE)
 */

import { VOYAGE_API_KEY, VOYAGE_MODEL } from "@postly/config";

// ─── Constants ───────────────────────────────────────────────────────────────

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MAX_BATCH_SIZE = 128;
const VOYAGE_MAX_RPM = 300;
const VOYAGE_DIMENSION = 1024;
const MAX_INPUT_CHARS = 30_000; // ~7.5K tokens

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmbeddingMetadata {
  model: string;
  dimension: number;
  totalTokens: number;
  inputCount: number;
  batchCount: number;
  latencyMs: number;
  inputType: "document" | "query";
}

export interface EmbeddingResult {
  embeddings: number[][];
  metadata: EmbeddingMetadata;
}

export interface SingleEmbeddingResult {
  embedding: number[];
  metadata: EmbeddingMetadata;
}

interface VoyageResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    total_tokens: number;
  };
  model: string;
}

interface VoyageError {
  message?: string;
  status?: number;
  code?: string;
}

// ─── Retry ───────────────────────────────────────────────────────────────────

const RETRY_DELAYS = [1000, 2000, 4000];

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_DELAYS.length,
): Promise<T> {
  let lastError: VoyageError | undefined;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (err: unknown) {
      const error = err as VoyageError;
      lastError = error;

      const isRetryable =
        !error.status || [429, 500, 502, 503, 504].includes(error.status);

      if (!isRetryable || i === maxRetries) throw error;

      console.warn(
        `[voyage] retry ${i + 1}/${maxRetries} in ${RETRY_DELAYS[i]}ms — ${error.message || String(error)}`,
      );
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[i]));
    }
  }

  throw lastError;
}

// ─── Core API ────────────────────────────────────────────────────────────────

/**
 * Generate a single embedding with metadata.
 *
 * @param text - Text to embed (truncated to ~30K chars / ~7.5K tokens)
 * @param inputType - "document" for indexing, "query" for search (affects optimization)
 * @returns Embedding vector + metadata (tokens, latency, model)
 */
export async function generateVoyageEmbedding(
  text: string,
  inputType: "document" | "query" = "document",
): Promise<SingleEmbeddingResult> {
  const result = await generateVoyageEmbeddings([text], inputType);
  return {
    embedding: result.embeddings[0] || [],
    metadata: result.metadata,
  };
}

/**
 * Generate embeddings for multiple texts with automatic batching.
 * Returns embeddings in the same order as input texts.
 *
 * @param texts - Array of texts to embed
 * @param inputType - "document" or "query"
 * @returns Embeddings array + aggregated metadata
 */
export async function generateVoyageEmbeddings(
  texts: string[],
  inputType: "document" | "query" = "document",
): Promise<EmbeddingResult> {
  const startTime = Date.now();

  if (texts.length === 0) {
    return {
      embeddings: [],
      metadata: {
        model: VOYAGE_MODEL,
        dimension: VOYAGE_DIMENSION,
        totalTokens: 0,
        inputCount: 0,
        batchCount: 0,
        latencyMs: 0,
        inputType,
      },
    };
  }

  // Truncate long texts to avoid API errors
  const sanitised = texts.map((t) => t.slice(0, MAX_INPUT_CHARS));

  const allEmbeddings: number[][] = new Array(sanitised.length);
  let totalTokens = 0;
  let batchCount = 0;

  for (let i = 0; i < sanitised.length; i += VOYAGE_MAX_BATCH_SIZE) {
    const batch = sanitised.slice(i, i + VOYAGE_MAX_BATCH_SIZE);
    batchCount++;

    const response = await withRetry(async () => {
      const res = await fetch(VOYAGE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({
          model: VOYAGE_MODEL,
          input: batch,
          input_type: inputType,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
          code?: string;
        };
        const error: VoyageError = {
          message: body.message || `HTTP ${res.status}`,
          status: res.status,
          code: body.code,
        };
        throw error;
      }

      return res.json() as Promise<VoyageResponse>;
    });

    totalTokens += response.usage?.total_tokens ?? 0;

    for (const item of response.data) {
      allEmbeddings[i + item.index] = item.embedding;
    }
  }

  return {
    embeddings: allEmbeddings,
    metadata: {
      model: VOYAGE_MODEL,
      dimension: VOYAGE_DIMENSION,
      totalTokens,
      inputCount: sanitised.length,
      batchCount,
      latencyMs: Date.now() - startTime,
      inputType,
    },
  };
}

// ─── Text Preparation Helpers ────────────────────────────────────────────────

/**
 * Prepare weighted text for job embedding.
 * Emphasises important fields (title, skills) for better retrieval.
 */
export function prepareJobTextForEmbedding(job: {
  job_title?: string;
  job_description?: string;
  skills_required?: string[];
  company_name?: string;
  industry?: string;
}): string {
  const parts: string[] = [];

  // Title (30% weight — repeat 3×)
  if (job.job_title) parts.push(job.job_title, job.job_title, job.job_title);

  // Skills (25% weight — repeat 2×)
  if (job.skills_required?.length) {
    const skills = job.skills_required.join(", ");
    parts.push(skills, skills);
  }

  // Description (30% weight — truncated)
  if (job.job_description) parts.push(job.job_description.slice(0, 3000));

  // Industry (10%)
  if (job.industry) parts.push(job.industry);

  // Company (5%)
  if (job.company_name) parts.push(job.company_name);

  return parts.join("\n").slice(0, MAX_INPUT_CHARS);
}

/**
 * Prepare weighted text for resume embedding.
 * Emphasises skills and experience for job matching.
 */
export function prepareResumeTextForEmbedding(resume: {
  headline?: string;
  summary?: string;
  skills?: string[];
  experience?: string;
  education?: string;
}): string {
  const parts: string[] = [];

  if (resume.headline) parts.push(resume.headline, resume.headline);
  if (resume.skills?.length) {
    const skills = resume.skills.join(", ");
    parts.push(skills, skills, skills);
  }
  if (resume.experience) parts.push(resume.experience.slice(0, 5000));
  if (resume.summary) parts.push(resume.summary);
  if (resume.education) parts.push(resume.education);

  return parts.join("\n").slice(0, MAX_INPUT_CHARS);
}

// ─── Exported Config ─────────────────────────────────────────────────────────

export const VOYAGE_CONFIG = {
  model: VOYAGE_MODEL,
  dimension: VOYAGE_DIMENSION,
  maxBatchSize: VOYAGE_MAX_BATCH_SIZE,
  maxRpm: VOYAGE_MAX_RPM,
  maxInputChars: MAX_INPUT_CHARS,
} as const;
