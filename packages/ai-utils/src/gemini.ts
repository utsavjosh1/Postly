import { GoogleGenAI } from "@google/genai";

// Lazy initialization
let genAI: GoogleGenAI | null = null;

const RETRY_DELAYS = [1000, 2000, 4000, 8000];

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= RETRY_DELAYS.length; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      // 429 = Too Many Requests
      const isRetryable =
        !error.status || [429, 500, 503, 504].includes(error.status);

      if (!isRetryable || i === RETRY_DELAYS.length) {
        throw error;
      }

      console.warn(
        `AI Operation failed, retrying in ${RETRY_DELAYS[i]}ms...`,
        lastError?.message || String(lastError),
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[i]));
    }
  }

  throw lastError;
}

function getClient(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// Helper to get text generation
export async function generateText(prompt: string): Promise<string> {
  const client = getClient();
  const response = await withRetry(() =>
    client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    }),
  );

  // Safely access text response
  if (response.text?.length) {
    return response.text;
  }

  if (response.candidates && response.candidates.length > 0) {
    const part = response.candidates[0].content?.parts?.[0];
    if (part && "text" in part) {
      return part.text as string;
    }
  }

  return "";
}

export async function streamText(
  prompt: string,
): Promise<AsyncIterable<string>> {
  const client = getClient();
  const response = await withRetry(() =>
    client.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    }),
  );

  async function* streamGenerator() {
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  return streamGenerator();
}

export async function streamTextWithMeta(
  prompt: string,
): Promise<AsyncIterable<{ text?: string; usage?: any }>> {
  const client = getClient();
  const response = await withRetry(() =>
    client.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    }),
  );

  async function* streamGenerator() {
    for await (const chunk of response) {
      if (chunk.text && chunk.text.length > 0) {
        yield { text: chunk.text };
      }
      if (chunk.usageMetadata) {
        yield { usage: chunk.usageMetadata };
      }
    }
  }

  return streamGenerator();
}

// Helper for embeddings

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getClient();

  try {
    const response = await withRetry(() =>
      client.models.embedContent({
        model: "gemini-embedding-001",
        contents: [{ parts: [{ text }] }],
        config: {
          outputDimensionality: 768,
        },
      }),
    );

    if (response.embeddings?.[0]?.values) {
      return response.embeddings[0].values;
    }
  } catch (error: any) {
    console.warn(
      "Embedding generation failed, trying fallback...",
      error?.message || String(error),
    );
    // If the error is a 404 (Model Not Found), try the legacy model silently
    if (error.status === 404 || error.message?.includes("not found")) {
      const fallbackResponse = await withRetry(() =>
        client.models.embedContent({
          model: "embedding-001",
          contents: [{ parts: [{ text }] }],
        }),
      );

      if (fallbackResponse.embeddings?.[0]?.values) {
        return fallbackResponse.embeddings[0].values;
      }
    }

    throw error;
  }

  return [];
}
