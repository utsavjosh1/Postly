import { geminiEmbeddingModel } from "./gemini";

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await geminiEmbeddingModel.embedContent(text);
  return result.embedding.values;
}

export async function generateBatchEmbeddings(
  texts: string[],
  concurrency: number = 5,
): Promise<number[][]> {
  const embeddings: number[][] = new Array(texts.length);
  const queue = texts.map((text, index) => ({ text, index }));

  // Helper to process queue items
  const worker = async () => {
    while (queue.length > 0) {
      const { text, index } = queue.shift()!; // Take next item
      try {
        const embedding = await generateEmbedding(text);
        embeddings[index] = embedding;
      } catch (error) {
        console.error(`Failed to embed text at index ${index}`, error);
        // Depending on requirements, we might want to throw or return null.
        // For now, we'll leave it undefined to indicate failure, or could retry here.
        // Since generateEmbedding uses withRetry, transient errors are already handled.
      }
    }
  };

  // Start workers
  const workers = Array(Math.min(concurrency, texts.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);

  return embeddings;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) {
    // Graceful handling if one embedding failed
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}
