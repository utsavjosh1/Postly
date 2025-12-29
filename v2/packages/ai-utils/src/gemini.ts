import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-pro',
});

export const geminiEmbeddingModel = genAI.getGenerativeModel({
  model: 'text-embedding-004',
});

export async function generateText(prompt: string): Promise<string> {
  const result = await geminiModel.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export async function streamText(prompt: string): Promise<AsyncIterable<string>> {
  const result = await geminiModel.generateContentStream(prompt);

  async function* streamGenerator() {
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  }

  return streamGenerator();
}
