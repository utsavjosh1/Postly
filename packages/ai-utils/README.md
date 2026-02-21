# @postly/ai-utils

Centralized AI utilities for the Postly monorepo, providing unified access to OpenAI (ChatGPT) and Voyage AI (Embeddings).

## Modules

### 1. OpenAI (`openai.ts`)

Handling text generation and streaming response using LangChain and OpenAI.

**Key Exports:**

- `generateText(prompt, systemPrompt?)`: Generates a single text response.
- `streamText(prompt, systemPrompt?)`: Streams text response chunks.
- `streamTextWithMeta(prompt, systemPrompt?)`: Streams text with token usage metadata (input/output/total tokens).
- `generateWithRAG(query, context, systemPrompt?)`: Generates a response based on retrieved context.

**Usage:**

```typescript
import { generateText, streamTextWithMeta } from "@postly/ai-utils";

// Simple generation
const response = await generateText("Hello world");

// Streaming with metadata
const stream = await streamTextWithMeta("Tell me a story");
for await (const chunk of stream) {
  if (chunk.text) console.log(chunk.text);
  if (chunk.usage) console.log(chunk.usage); // { input_tokens: 10, output_tokens: 20, ... }
}
```

### 2. Voyage AI (`voyage.ts`)

Handling vector embeddings using Voyage AI's `voyage-3.5-lite` model.

**Key Exports:**

- `generateVoyageEmbedding(text, inputType?)`: Generates a single embedding vector (1024-dim).
- `generateVoyageEmbeddings(texts, inputType?)`: Generates embeddings for a batch of texts.
- `prepareJobTextForEmbedding(job)`: Helper to format job data for optimal embedding.

**Usage:**

```typescript
import { generateVoyageEmbedding } from "@postly/ai-utils";

const vector = await generateVoyageEmbedding(
  "Software Engineer with 5 years experience",
);
```

### 3. RAG Utilities (`rag.ts`)

Helpers for Retrieval-Augmented Generation (SQL generation and context formatting).
_Note: Currently available but not actively used in the main flow._

**Key Exports:**

- `buildVectorSearchQuery(tableName, limit)`: Generates SQL for vector similarity search.
- `buildContextPrompt(query, results)`: Formats retrieved results into a context string for the LLM.

### 4. Batch Embeddings (`embeddings.ts`)

Utilities for handling large-scale batch embeddings with concurrency control.
_Note: Currently available but not actively used._

**Key Exports:**

- `generateBatchEmbeddings(texts, concurrency)`: Process large lists of texts with controlled concurrency.
- `cosineSimilarity(a, b)`: Calculate similarity between two vectors.

## Configuration

The package requires the following environment variables to be set:

```env
OPENAI_API_KEY=sk-...
VOYAGE_API_KEY=voy-...
# Optional for tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2-...
```
