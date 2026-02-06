import { queueService } from "./queue.service.js";

// Job sources configuration
const JOB_SOURCES = {
  high: [
    "https://weworkremotely.com/remote-jobs/search?term=software",
    "https://remoteok.com/remote-dev-jobs",
  ],
  medium: [
    // Add medium priority sources
  ],
  low: [
    // Add low priority sources
  ],
};

export const schedulerService = {
  /**
   * Initialize default scrape schedules
   */
  async initSchedules() {
    console.log("📅 Initializing scrape schedules...");

    // High priority - every hour
    if (JOB_SOURCES.high.length > 0) {
      await queueService.scheduleRecurringScrape(
        JOB_SOURCES.high,
        "0 * * * *", // Every hour at minute 0
        "scrape-high-priority",
        "high",
      );
      console.log("✅ Scheduled high priority scrape (Hourly)");
    }

    // Medium priority - every 6 hours
    if (JOB_SOURCES.medium.length > 0) {
      await queueService.scheduleRecurringScrape(
        JOB_SOURCES.medium,
        "0 */6 * * *", // Every 6 hours
        "scrape-medium-priority",
        "medium",
      );
      console.log("✅ Scheduled medium priority scrape (Every 6h)");
    }

    // Low priority - every 24 hours
    if (JOB_SOURCES.low.length > 0) {
      await queueService.scheduleRecurringScrape(
        JOB_SOURCES.low,
        "0 0 * * *", // Every day at midnight
        "scrape-low-priority",
        "low",
      );
      console.log("✅ Scheduled low priority scrape (Daily)");
    }
  },
};
