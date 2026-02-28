import { Queue } from "bullmq";
import { REDIS_URL } from "../config/secrets.js";
import { db, discord_configs, eq } from "@postly/database";

const DISCORD_QUEUE_NAME = "discord_notifications";

export class QueueService {
  private discordQueue: Queue;

  constructor() {
    this.discordQueue = new Queue(DISCORD_QUEUE_NAME, {
      connection: {
        url: REDIS_URL || "redis://localhost:6379",
      },
    });
  }

  /**
   * Initializes the daily cron that dispatches job alerts to all active Discord servers.
   * Runs every day at 9:00 AM UTC.
   *
   * Instead of using an intermediate "daily_job_dispatch" job that requires
   * a Node.js Worker to process, this directly queries active configs and
   * enqueues one `send_discord_message` job per server — which the Python
   * bot worker picks up via Redis.
   */
  initDailyCron = async () => {
    // Use a repeatable job that fires at 9 AM daily
    await this.discordQueue.add(
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
    console.log("📅 Discord daily job dispatch cron initialized (9:00 AM)");
  };

  /**
   * Dispatch job alerts for all active guilds.
   * Called by the cron handler or manually.
   */
  dispatchAll = async () => {
    const activeConfigs = await db
      .select()
      .from(discord_configs)
      .where(eq(discord_configs.is_active, true));

    let queued = 0;
    for (const config of activeConfigs) {
      if (config.channel_id) {
        await this.dispatchForGuild(config.guild_id, config.channel_id);
        queued++;
      }
    }
    console.log(
      `✅ Queued job alerts for ${queued}/${activeConfigs.length} servers.`,
    );
    return queued;
  };

  /**
   * Manually trigger a dispatch for a single server (e.g. for testing).
   */
  dispatchForGuild = async (guildId: string, channelId: string) => {
    await this.discordQueue.add(
      "send_discord_message",
      {
        guild_id: guildId,
        channel_id: channelId,
        timestamp: new Date().toISOString(),
      },
      {
        removeOnComplete: true,
        removeOnFail: 3,
      },
    );
    console.log(`✅ Job dispatched for guild: ${guildId}`);
  };
}

export const queueService = new QueueService();
