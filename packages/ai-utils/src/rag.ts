/**
 * rag.ts
 * RAG utilities: vector search query builder and context prompt formatter.
 */

import type { VectorSearchResult } from "@postly/shared-types";

export type { VectorSearchResult } from "@postly/shared-types";

// ─── Vector Search ────────────────────────────────────────────────────────────

/**
 * Build a parameterised SQL query for pgvector ANN search.
 *
 * Assumes the target table has an `embedding` vector column.
 * Usage: `client.query(sql, [embeddingVector])`
 */
export function buildVectorSearchQuery(tableName: string, limit = 5): string {
  return `
    SELECT *,
           1 - (embedding <=> $1) AS similarity
    FROM ${tableName}
    ORDER BY embedding <=> $1
    LIMIT ${limit};
  `;
}

// ─── Context Prompt ───────────────────────────────────────────────────────────

/**
 * Format RAG results into a structured prompt context block.
 *
 * @param query      - The original user question
 * @param results    - Retrieved vector search results
 * @param contentKey - The key whose value is used as the result content
 */
export function buildContextPrompt(
  query: string,
  results: VectorSearchResult[],
  contentKey = "description",
): string {
  if (!results || results.length === 0) {
    return `User Query: "${query}"

Context:
No relevant information found in the database.

Instructions:
Answer the user's query to the best of your ability using general knowledge, but mention that you couldn't find specific internal data.`.trim();
  }

  const contextStr = results
    .map((r, i) => {
      const content =
        r[contentKey] !== undefined ? String(r[contentKey]) : "N/A";
      return `[Result ${i + 1}] (Similarity: ${(r.similarity * 100).toFixed(1)}%)\n${content}`;
    })
    .join("\n\n");

  return `User Query: "${query}"

Retrieved Context (from high-to-low relevance):
------------------------------------------------
${contextStr}
------------------------------------------------

Instructions:
1. Answer the User Query accurately using ONLY the Context provided above.
2. If the context doesn't answer the question, state that clearly.
3. Cite the [Result #] when referencing specific information.`.trim();
}
