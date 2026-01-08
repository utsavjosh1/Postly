import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// Lazy initialization - only create client when first used
let genAI: GoogleGenerativeAI | null = null;
let geminiModelInstance: GenerativeModel | null = null;
let geminiEmbeddingModelInstance: GenerativeModel | null = null;

const RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Exponential backoff delays in ms

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= RETRY_DELAYS.length; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry if it's a permanent error (like checking safety ratings)
      // Only retry 500s, 503s, or 429s (Rate Limit) if identified
      const isRetryable =
        !error.response ||
        [429, 500, 503, 504].includes(error.response?.status);

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

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function getGeminiModel(): GenerativeModel {
  if (!geminiModelInstance) {
    geminiModelInstance = getGenAI().getGenerativeModel({
      model: "gemini-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }
  return geminiModelInstance;
}

function getGeminiEmbeddingModel(): GenerativeModel {
  if (!geminiEmbeddingModelInstance) {
    geminiEmbeddingModelInstance = getGenAI().getGenerativeModel({
      model: "text-embedding-004",
    });
  }
  return geminiEmbeddingModelInstance;
}

// Export getters for backward compatibility
export const geminiModel = {
  get instance() {
    return getGeminiModel();
  },
  generateContent: (prompt: string) =>
    withRetry(() => getGeminiModel().generateContent(prompt)),
  generateContentStream: (prompt: string) =>
    withRetry(() => getGeminiModel().generateContentStream(prompt)),
};

export const geminiEmbeddingModel = {
  get instance() {
    return getGeminiEmbeddingModel();
  },
  embedContent: (content: string) =>
    withRetry(() => getGeminiEmbeddingModel().embedContent(content)),
};

export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel();
  const result = await withRetry(() => model.generateContent(prompt));
  const response = result.response;
  return response.text();
}

export async function streamText(
  prompt: string,
): Promise<AsyncIterable<string>> {
  const model = getGeminiModel();
  const result = await withRetry(() => model.generateContentStream(prompt));

  async function* streamGenerator() {
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  }

  return streamGenerator();
}
