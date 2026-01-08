import { jobQueries } from "@postly/database";
// import { fetchWithBrowser } from '../utils/browser';

interface CleanupResult {
  deactivated: number;
  deleted: number;
  verified: number;
  markedInactive: number;
}

export async function runCleanup(): Promise<CleanupResult> {
  console.log("\n🧹 Starting job cleanup...");
  const result: CleanupResult = {
    deactivated: 0,
    deleted: 0,
    verified: 0,
    markedInactive: 0,
  };

  try {
    // Get stats before cleanup
    const statsBefore = await jobQueries.getCleanupStats();
    console.log(`📊 Before cleanup:`);
    console.log(`   Total jobs: ${statsBefore.totalJobs}`);
    console.log(`   Active jobs: ${statsBefore.activeJobs}`);
    console.log(`   Expired jobs: ${statsBefore.expiredJobs}`);
    console.log(`   Stale jobs (>1 year): ${statsBefore.staleJobs}`);

    // Step 1: Deactivate expired jobs
    console.log("\n📅 Deactivating expired jobs...");
    result.deactivated = await jobQueries.deactivateExpiredJobs();
    console.log(`   Deactivated: ${result.deactivated} jobs`);

    // Step 2: Delete very old jobs (> 1 year)
    console.log("\n🗑️  Removing stale jobs (>1 year old)...");
    result.deleted = await jobQueries.removeStaleJobs();
    console.log(`   Deleted: ${result.deleted} jobs`);

    // Step 3: Verify random sample of jobs still exist
    console.log("\n🔍 Verifying random sample of active jobs...");
    const sampleJobs = await jobQueries.getRandomSample(5);

    for (const job of sampleJobs) {
      if (!job.source_url) continue;

      try {
        // Quick HEAD request to check if job still exists
        const isValid = await verifyJobExists(job.source_url);
        result.verified++;

        if (!isValid) {
          console.log(`   ❌ Job no longer exists: ${job.title}`);
          await jobQueries.markInactiveById(job.id);
          result.markedInactive++;
        } else {
          console.log(`   ✅ Job verified: ${job.title}`);
        }
      } catch {
        console.warn(`   ⚠️ Could not verify job: ${job.title}`);
      }
    }

    // Get stats after cleanup
    const statsAfter = await jobQueries.getCleanupStats();
    console.log(`\n📊 After cleanup:`);
    console.log(`   Total jobs: ${statsAfter.totalJobs}`);
    console.log(`   Active jobs: ${statsAfter.activeJobs}`);

    console.log("\n✅ Cleanup completed successfully!");
    console.log(
      `   Summary: Deactivated ${result.deactivated}, Deleted ${result.deleted}, Verified ${result.verified}, Marked inactive ${result.markedInactive}`,
    );

    return result;
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

async function verifyJobExists(url: string): Promise<boolean> {
  try {
    // Use a simple fetch with HEAD method to check if URL is valid
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      redirect: "follow",
    });

    // Consider 200-399 as valid (including redirects that resolve)
    return response.status >= 200 && response.status < 400;
  } catch {
    // Network error or timeout - assume job might still exist
    return true;
  }
}
