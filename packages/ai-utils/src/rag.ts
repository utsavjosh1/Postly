/**
 * RAG Utilities for 10/10 AI Systems
 *
 * Provides helpers for:
 * 1. Constructing SQL for Vector Similarity Search
 * 2. Formatting DB results for Prompt Context
 */

export function buildVectorSearchQuery(
  tableName: string,
  limit: number = 5,
): string {
  // Returns a parameterized query for pg-node
  // Assumes:
  // - Table has 'embedding' column (VECTOR)
  // - Table has 'id', 'content' (or similar text column)
  // - Usage: client.query(sql, [embedding_vector])
  return `
    SELECT *, 
           1 - (embedding <=> $1) as similarity
    FROM ${tableName}
    ORDER BY embedding <=> $1
    LIMIT ${limit};
  `;
}

export function buildContextPrompt(
  query: string,
  results: any[],
  contentKey: string = "description",
): string {
  if (!results || results.length === 0) {
    return `
User Query: "${query}"

Context:
No relevant information found in the database.

Instructions:
Answer the user's query to the best of your ability using general knowledge, but mention that you couldn't find specific internal data.
    `.trim();
  }

  const contextStr = results
    .map((r, i) => {
      return `[Result ${i + 1}] (Similarity: ${(r.similarity * 100).toFixed(1)}%)\n${r[contentKey]}`;
    })
    .join("\n\n");

  return `
User Query: "${query}"

Retrieved Context (from high-to-low relevance):
------------------------------------------------
${contextStr}
------------------------------------------------

Instructions:
1. Answer the User Query accurately using ONLY the Context provided above.
2. If the context doesn't answer the question, state that clearly.
3. Cite the [Result #] when referencing specific information.
  `.trim();
}
