import { Queue, Worker, Job } from "bullmq";
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
   * Initializes the daily cron job for Discord job drops.
   * Runs every day at 9:00 AM.
   */
  initDailyCron = async () => {
    // 9:00 AM daily
    await this.discordQueue.add(
      "daily_job_dispatch",
      {},
      {
        repeat: {
          pattern: "0 9 * * *",
        },
      },
    );
    console.log("📅 Discord daily job dispatch cron initialized (9:00 AM)");
  };

  /**
   * Manually trigger a dispatch for a single server (e.g. for testing)
   */
  dispatchForGuild = async (guildId: string, channelId: string) => {
    console.log("Dispatching for guild:", guildId);
    console.log("Channel ID:", channelId);
    await this.discordQueue.add("send_discord_message", {
      guild_id: guildId,
      channel_id: channelId,
      timestamp: new Date().toISOString(),
    });
    console.log("✅ Job dispatched for guild:", guildId);
  };

  /**
   * Process the daily_job_dispatch task
   * Queries all active discord configs and queues a message for each.
   */
  setupWorker = () => {
    new Worker(
      DISCORD_QUEUE_NAME,
      async (job: Job) => {
        if (job.name === "daily_job_dispatch") {
          console.log("🚀 Starting daily Discord job dispatch sequence...");

          const activeConfigs = await db
            .select()
            .from(discord_configs)
            .where(eq(discord_configs.is_active, true));

          for (const config of activeConfigs) {
            if (config.channel_id) {
              await this.discordQueue.add("send_discord_message", {
                guild_id: config.guild_id,
                channel_id: config.channel_id,
              });
            }
          }
          console.log(
            `✅ Queued job messages for ${activeConfigs.length} servers.`,
          );
        }
      },
      {
        connection: {
          url: REDIS_URL || "redis://localhost:6379",
        },
      },
    );
  };
}

export const queueService = new QueueService();
