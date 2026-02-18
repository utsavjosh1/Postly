/**
 * openai.ts
 * ChatGPT text generation via LangChain with LangSmith tracing.
 *
 * Provides:
 * - generateText() - ChatGPT completion
 * - streamText() - Streaming response
 * - generateWithRAG() - RAG with embedded context
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Lazy initialization
let chatModel: ChatOpenAI | null = null;

const RETRY_DELAYS = [1000, 2000, 4000, 8000];

interface APIError {
  message?: string;
  status?: number;
  code?: string;
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: APIError | undefined;

  for (let i = 0; i <= RETRY_DELAYS.length; i++) {
    try {
      return await operation();
    } catch (err: unknown) {
      const error = err as APIError;
      lastError = error;

      const isRetryable =
        !error.status || [429, 500, 502, 503, 504].includes(error.status);

      if (!isRetryable || i === RETRY_DELAYS.length) {
        throw error;
      }

      console.warn(
        `OpenAI operation failed, retrying in ${RETRY_DELAYS[i]}ms...`,
        lastError?.message || String(lastError),
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[i]));
    }
  }

  throw lastError;
}

import { AI_CONFIG } from "./config";

/**
 * Get or create ChatOpenAI client with LangSmith tracing
 */
function getClient(): ChatOpenAI {
  if (!chatModel) {
    chatModel = new ChatOpenAI({
      modelName: AI_CONFIG.openai.model,
      temperature: AI_CONFIG.openai.temperature,
      openAIApiKey: AI_CONFIG.openai.apiKey,
      // LangSmith tracing is auto-enabled via env vars:
      // LANGCHAIN_TRACING_V2=true
      // LANGCHAIN_API_KEY=<key>
    });
  }
  return chatModel;
}

/**
 * Generate text completion using ChatGPT
 *
 * @param prompt - User prompt
 * @param systemPrompt - Optional system message
 * @returns Generated text response
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const client = getClient();

  const messages: (SystemMessage | HumanMessage)[] = [];
  if (systemPrompt) {
    messages.push(new SystemMessage(systemPrompt));
  }
  messages.push(new HumanMessage(prompt));

  const response = (await withRetry(() => client.invoke(messages))) as {
    content: string | unknown[];
  };

  return typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);
}

/**
 * Stream text completion using ChatGPT
 *
 * @param prompt - User prompt
 * @param systemPrompt - Optional system message
 * @returns Async iterable of text chunks
 */
export async function streamText(
  prompt: string,
  systemPrompt?: string,
): Promise<AsyncIterable<string>> {
  const client = getClient();
  const parser = new StringOutputParser();

  const messages: (SystemMessage | HumanMessage)[] = [];
  if (systemPrompt) {
    messages.push(new SystemMessage(systemPrompt));
  }
  messages.push(new HumanMessage(prompt));

  const stream = await client.pipe(parser).stream(messages);

  return stream;
}

/**
 * Stream text with metadata (usage info)
 */
export async function streamTextWithMeta(
  prompt: string,
  systemPrompt?: string,
): Promise<AsyncIterable<{ text?: string; usage?: Record<string, unknown> }>> {
  const client = getClient();

  const messages: (SystemMessage | HumanMessage)[] = [];
  if (systemPrompt) {
    messages.push(new SystemMessage(systemPrompt));
  }
  messages.push(new HumanMessage(prompt));

  const stream = await client.stream(messages);

  async function* generator() {
    for await (const chunk of stream) {
      if (chunk.content) {
        yield {
          text:
            typeof chunk.content === "string"
              ? chunk.content
              : JSON.stringify(chunk.content),
        };
      }
      if (chunk.usage_metadata) {
        yield { usage: chunk.usage_metadata as Record<string, unknown> };
      }
    }
  }

  return generator();
}

/**
 * Generate response using RAG with embedded context
 *
 * @param query - User query
 * @param context - Retrieved context from vector search
 * @param systemPrompt - Optional custom system prompt
 * @returns Generated response grounded in context
 */
export async function generateWithRAG(
  query: string,
  context: string,
  systemPrompt?: string,
): Promise<string> {
  const defaultSystem = `You are a helpful assistant that answers questions based on the provided context.
Only use information from the context to answer. If the context doesn't contain relevant information, say so.
Cite specific details from the context when possible.`;

  const ragPrompt = `Context:
${context}

---

User Question: ${query}

Answer based on the context above:`;

  return generateText(ragPrompt, systemPrompt || defaultSystem);
}

/**
 * OpenAI configuration
 */
export const OPENAI_CONFIG = {
  model: AI_CONFIG.openai.model,
  streamingSupported: true,
  maxTokens: 4096,
} as const;
