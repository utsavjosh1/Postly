/**
 * embeddings.ts
 * High-level embedding utilities: batch processing with concurrency
 * control and cosine similarity.
 */

import {
  generateVoyageEmbedding,
  generateVoyageEmbeddings,
  type EmbeddingMetadata,
} from "./voyage";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BatchEmbeddingResult {
  embeddings: number[][];
  metadata: EmbeddingMetadata;
}

// ─── Batch Embedding ─────────────────────────────────────────────────────────

/**
 * Embed many texts using Voyage AI's native batching.
 * Preferred over the old per-item concurrency approach — sends
 * texts in 128-item batches, one API call per batch.
 *
 * @param texts - Array of texts to embed
 * @param inputType - "document" for indexing, "query" for search
 * @returns Embeddings in same order as input + aggregated metadata
 */
export async function generateBatchEmbeddings(
  texts: string[],
  inputType: "document" | "query" = "document",
): Promise<BatchEmbeddingResult> {
  const result = await generateVoyageEmbeddings(texts, inputType);
  return {
    embeddings: result.embeddings,
    metadata: result.metadata,
  };
}

/**
 * Embed a single text and return just the vector.
 * Convenience wrapper when you don't need metadata.
 */
export async function embedText(
  text: string,
  inputType: "document" | "query" = "document",
): Promise<number[]> {
  const result = await generateVoyageEmbedding(text, inputType);
  return result.embedding;
}

// ─── Similarity ──────────────────────────────────────────────────────────────

/**
 * Cosine similarity between two vectors.
 * Returns 0 for invalid / mismatched inputs.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  return magA === 0 || magB === 0 ? 0 : dot / (magA * magB);
}

/**
 * Find the top-K most similar embeddings to a query vector.
 * Returns indices sorted by descending similarity.
 */
export function findTopK(
  queryEmbedding: number[],
  candidates: number[][],
  k: number = 5,
): { index: number; score: number }[] {
  return candidates
    .map((vec, index) => ({
      index,
      score: cosineSimilarity(queryEmbedding, vec),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
