import { Queue } from "bullmq";
import { REDIS_URL } from "../config/secrets.js";
import { db, bot_configs, eq } from "@postly/database";

const BOT_QUEUE_NAME = "bot_notifications";

export class QueueService {
  private botQueue: Queue;

  constructor() {
    this.botQueue = new Queue(BOT_QUEUE_NAME, {
      connection: {
        url: REDIS_URL || "redis://localhost:6379",
      },
    });
  }

  /**
   * Initializes the daily cron that dispatches job alerts to all active bot integrations.
   * Runs every day at 9:00 AM UTC.
   */
  initDailyCron = async () => {
    // Use a repeatable job that fires at 9 AM daily
    await this.botQueue.add(
      "daily_job_dispatch",
      { trigger: "cron" },
      {
        repeat: {
          pattern: "0 9 * * *",
        },
        removeOnComplete: true,
        removeOnFail: 5,
      },
    );
    console.log("📅 Bot daily job dispatch cron initialized (9:00 AM)");
  };

  /**
   * Dispatch job alerts for all active bot configurations.
   * Called by the cron handler or manually.
   */
  dispatchAll = async () => {
    const activeConfigs = await db
      .select()
      .from(bot_configs)
      .where(eq(bot_configs.is_active, true));

    let queued = 0;
    for (const config of activeConfigs) {
      await this.dispatchForPlatform(config.id);
      queued++;
    }
    console.log(
      `✅ Queued job alerts for ${queued}/${activeConfigs.length} bot integrations.`,
    );
    return queued;
  };

  /**
   * Manually trigger a dispatch for a single bot config (e.g. for testing).
   */
  dispatchForPlatform = async (configId: string) => {
    const [config] = await db
      .select()
      .from(bot_configs)
      .where(eq(bot_configs.id, configId))
      .limit(1);

    if (!config) return;

    await this.botQueue.add(
      "send_bot_message",
      {
        config_id: config.id,
        platform: config.platform,
        target_id: config.target_id,
        webhook_url: config.webhook_url,
        timestamp: new Date().toISOString(),
      },
      {
        removeOnComplete: true,
        removeOnFail: 3,
      },
    );
    console.log(`✅ Job dispatched for ${config.platform} config: ${configId}`);
  };
}

export const queueService = new QueueService();
