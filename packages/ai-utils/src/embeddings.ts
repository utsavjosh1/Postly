import { generateEmbedding } from "./gemini";

export async function generateBatchEmbeddings(
  texts: string[],
  concurrency: number = 5,
): Promise<number[][]> {
  const embeddings: number[][] = new Array(texts.length);
  const queue = texts.map((text, index) => ({ text, index }));

  const worker = async () => {
    while (queue.length > 0) {
      const { text, index } = queue.shift()!;
      try {
        const embedding = await generateEmbedding(text);
        embeddings[index] = embedding;
      } catch (error) {
        console.error(`Failed to embed text at index ${index}`, error);
      }
    }
  };

  const workers = Array(Math.min(concurrency, texts.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);

  return embeddings;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) {
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
