import "dotenv/config";
import { GenericScraper } from "./scrapers/generic.scraper.js";

async function verifyUniversal() {
  console.log("🧪 Testing Universal AI Scraper...\n");

  // Test set covering different strategies
  const targets = [
    // 1. RSS Feed (Should be detected as RSS via smartFetch or XML check)
    "https://weworkremotely.com/categories/remote-programming-jobs",

    // 2. HTML with known structure (AI should handle this if JSON-LD missing)
    // "https://news.ycombinator.com/jobs", // Simple HTML

    // 3. Difficult / Anti-bot (Remote.co - should try curl)
    // "https://remote.co/remote-jobs/developer/",
  ];

  console.log(`Targets: ${targets.join(", ")}`);

  const scraper = new GenericScraper(targets);
  const jobs = await scraper.scrape();

  console.log(`\n✅ Total Jobs Found: ${jobs.length}`);

  if (jobs.length > 0) {
    console.log("\n🔎 Sample Job:");
    console.log(JSON.stringify(jobs[0], null, 2));
  } else {
    console.error("❌ No jobs found. Something is wrong.");
    process.exit(1);
  }

  process.exit(0);
}

verifyUniversal().catch(console.error);
