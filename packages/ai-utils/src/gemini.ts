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
        lastError.message,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[i]));
    }
  }

  throw lastError;
}

function getClient(): GoogleGenAI {
  if (!genAI) {
    // The SDK automatically reads GEMINI_API_KEY from env if not provided
    // but explicit is better for our error handling
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
  const result = await withRetry(() =>
    client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })
  );
  
  if (result.text) {
      return result.text;
  }
  
  // Fallback or empty if something goes wrong
  return "";
}

export async function streamText(
  prompt: string,
): Promise<AsyncIterable<string>> {
  const client = getClient();
  const result = await withRetry(() =>
    client.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    })
  );

  async function* streamGenerator() {
    for await (const chunk of result) {
      if (chunk.text) {
         yield chunk.text;
      }
    }
  }

  return streamGenerator();
}

// Helper for embeddings
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getClient();
  const result = await withRetry(() => 
      client.models.embedContent({
          model: "text-embedding-004",
          contents: text
      })
  );
  
  if (result.embeddings && result.embeddings[0] && result.embeddings[0].values) {
      return result.embeddings[0].values;
  }
  return [];
}

