// Script to verify resilience of AI Utils
// Run with: npx tsx src/verify_ai.ts

import { generateBatchEmbeddings } from "./embeddings";
import { generateText } from "./gemini";
import dotenv from "dotenv";
import path from "path";

// Load env from root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  console.log("--- Starting AI Resilience Verification ---");

  // Test 1: Batch Embeddings (Mocked if no key, but we assume key exists or we mock)
  // Since we can't easily mock network failures without a complex setup,
  // we will test the happy path of the parallel batching first.
  console.log("Testing Parallel Embeddings...");
  const start = Date.now();
  const texts = [
    "Hello world",
    "This is a test",
    "AI is cool",
    "Postly is awesome",
    "Senior Engineer code",
  ];
  try {
    const embeddings = await generateBatchEmbeddings(texts, 2); // Force batches
    const duration = Date.now() - start;
    console.log(`Generated ${embeddings.length} embeddings in ${duration}ms`);

    // Validate
    if (embeddings.length === 5 && embeddings[0].length === 768) {
      console.log("✅ Parallel Embedding Test Passed");
    } else {
      console.error("❌ Embedding dimension mismatch or count error");
    }
  } catch (err: any) {
    if (err.message.includes("GEMINI_API_KEY")) {
      console.warn("⚠️ Skipped because API Key missing");
    } else {
      console.error("❌ Embedding Test Failed:", err);
    }
  }

  // Test 2: Text Generation
  console.log("\nTesting Text Generation Wrapper...");
  try {
    const text = await generateText('Say "System Operational"');
    console.log("AI Response:", text.trim());
    if (text.includes("Operational")) {
      console.log("✅ Text Generation Test Passed");
    }
  } catch (err: any) {
    if (err.message.includes("GEMINI_API_KEY")) {
      console.warn("⚠️ Skipped because API Key missing");
    } else {
      console.error("❌ Generation Test Failed:", err);
    }
  }

  console.log("\n--- Verification Complete ---");
}

main();
