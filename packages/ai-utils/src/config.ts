/**
 * config.ts
 * Centralized configuration for AI Utils.
 * Validates environment variables and provides typed config.
 */

export const AI_CONFIG = {
  openai: {
    get apiKey() {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        throw new Error("OPENAI_API_KEY is not set in environment variables");
      }
      return key;
    },
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.7,
  },
  voyage: {
    get apiKey() {
      const key = process.env.VOYAGE_API_KEY;
      if (!key) {
        throw new Error("VOYAGE_API_KEY is not set in environment variables");
      }
      return key;
    },
    model: process.env.VOYAGE_MODEL || "voyage-3.5-lite",
    apiUrl: "https://api.voyageai.com/v1/embeddings",
    maxRpm: 300,
    maxBatchSize: 128,
  },
} as const;
