import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Lazy initialization - only create client when first used
let genAI: GoogleGenerativeAI | null = null;
let geminiModelInstance: GenerativeModel | null = null;
let geminiEmbeddingModelInstance: GenerativeModel | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function getGeminiModel(): GenerativeModel {
  if (!geminiModelInstance) {
    geminiModelInstance = getGenAI().getGenerativeModel({
      model: 'gemini-pro',
    });
  }
  return geminiModelInstance;
}

function getGeminiEmbeddingModel(): GenerativeModel {
  if (!geminiEmbeddingModelInstance) {
    geminiEmbeddingModelInstance = getGenAI().getGenerativeModel({
      model: 'text-embedding-004',
    });
  }
  return geminiEmbeddingModelInstance;
}

// Export getters for backward compatibility
export const geminiModel = {
  get instance() {
    return getGeminiModel();
  },
  generateContent: (prompt: string) => getGeminiModel().generateContent(prompt),
  generateContentStream: (prompt: string) => getGeminiModel().generateContentStream(prompt),
};

export const geminiEmbeddingModel = {
  get instance() {
    return getGeminiEmbeddingModel();
  },
  embedContent: (content: string) => getGeminiEmbeddingModel().embedContent(content),
};

export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export async function streamText(prompt: string): Promise<AsyncIterable<string>> {
  const model = getGeminiModel();
  const result = await model.generateContentStream(prompt);

  async function* streamGenerator() {
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  }

  return streamGenerator();
}
