/**
 * openai.ts
 * ChatGPT text generation via LangChain with LangSmith tracing.
 *
 * Model: gpt-4o-mini (default)
 *
 * All public functions return a result object with `text` + `metadata`
 * (model, tokens, latency) so callers can log and monitor usage.
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { OPENAI_API_KEY, OPENAI_MODEL } from "@postly/config";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMetadata {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

export interface ChatResult {
  text: string;
  metadata: ChatMetadata;
}

export interface ChatStreamResult {
  stream: AsyncIterable<string>;
  /** Populated after stream is fully consumed. */
  getMetadata: () => ChatMetadata;
}

// ─── Internals ───────────────────────────────────────────────────────────────

let chatModel: ChatOpenAI | null = null;

const RETRY_DELAYS = [1000, 2000, 4000, 8000];
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 4096;

interface APIError {
  message?: string;
  status?: number;
  code?: string;
}

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

      if (!isRetryable || i === RETRY_DELAYS.length) throw error;

      console.warn(
        `[openai] retry ${i + 1}/${RETRY_DELAYS.length} in ${RETRY_DELAYS[i]}ms — ${error.message || String(error)}`,
      );
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[i]));
    }
  }

  throw lastError;
}

function getClient(): ChatOpenAI {
  if (!chatModel) {
    chatModel = new ChatOpenAI({
      modelName: OPENAI_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      openAIApiKey: OPENAI_API_KEY,
      maxTokens: DEFAULT_MAX_TOKENS,
      // LangSmith tracing auto-enabled via env:
      //   LANGCHAIN_TRACING_V2=true
      //   LANGCHAIN_API_KEY=<key>
    });
  }
  return chatModel;
}

function buildMessages(
  prompt: string,
  systemPrompt?: string,
): (SystemMessage | HumanMessage)[] {
  const msgs: (SystemMessage | HumanMessage)[] = [];
  if (systemPrompt) msgs.push(new SystemMessage(systemPrompt));
  msgs.push(new HumanMessage(prompt));
  return msgs;
}

function emptyMeta(): ChatMetadata {
  return {
    model: OPENAI_MODEL,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    latencyMs: 0,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a text completion using ChatGPT.
 *
 * @param prompt - User prompt
 * @param systemPrompt - Optional system message
 * @returns `{ text, metadata }` — generated text + token/latency info
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string,
): Promise<ChatResult> {
  const client = getClient();
  const messages = buildMessages(prompt, systemPrompt);
  const start = Date.now();

  const response = (await withRetry(() => client.invoke(messages))) as {
    content: string | unknown[];
    usage_metadata?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  };

  const text =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  const usage = response.usage_metadata;

  return {
    text,
    metadata: {
      model: OPENAI_MODEL,
      promptTokens: usage?.input_tokens ?? 0,
      completionTokens: usage?.output_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
      latencyMs: Date.now() - start,
    },
  };
}

/**
 * Stream a text completion. Metadata is available after the stream
 * is fully consumed via `result.getMetadata()`.
 *
 * @param prompt - User prompt
 * @param systemPrompt - Optional system message
 */
export async function streamText(
  prompt: string,
  systemPrompt?: string,
): Promise<ChatStreamResult> {
  const client = getClient();
  const parser = new StringOutputParser();
  const messages = buildMessages(prompt, systemPrompt);

  const stream = await client.pipe(parser).stream(messages);
  const start = Date.now();
  let charCount = 0;

  const meta = emptyMeta();

  async function* tracked(): AsyncGenerator<string> {
    for await (const chunk of stream) {
      charCount += chunk.length;
      yield chunk;
    }
    // Rough estimate when no real token counts available
    meta.completionTokens = Math.ceil(charCount / 4);
    meta.totalTokens = meta.promptTokens + meta.completionTokens;
    meta.latencyMs = Date.now() - start;
  }

  return {
    stream: tracked(),
    getMetadata: () => meta,
  };
}

/**
 * Generate a response grounded in RAG context.
 *
 * @param query - User question
 * @param context - Retrieved context from vector search
 * @param systemPrompt - Optional custom system prompt
 */
export async function generateWithRAG(
  query: string,
  context: string,
  systemPrompt?: string,
): Promise<ChatResult> {
  const defaultSystem = `You are a helpful assistant that answers questions based on the provided context.
Only use information from the context to answer. If the context doesn't contain relevant information, say so.
Cite specific details from the context when possible.`;

  const ragPrompt = `Context:\n${context}\n\n---\n\nUser Question: ${query}\n\nAnswer based on the context above:`;

  return generateText(ragPrompt, systemPrompt || defaultSystem);
}

// ─── Exported Config ─────────────────────────────────────────────────────────

export const OPENAI_CONFIG = {
  model: OPENAI_MODEL,
  streamingSupported: true,
  maxTokens: DEFAULT_MAX_TOKENS,
  temperature: DEFAULT_TEMPERATURE,
} as const;
