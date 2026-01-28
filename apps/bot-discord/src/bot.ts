import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ Discord bot logged in as ${client.user?.tag}`);
  console.log(`🤖 Bot is ready in ${client.guilds.cache.size} servers`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // TODO: Implement slash commands and job posting logic
  // This will be built in later phases

  if (message.content === "!ping") {
    await message.reply("🏓 Pong! Postly bot is online!");
  }
});

// Login to Discord
// Login to Discord
const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.warn(
    "⚠️ DISCORD_TOKEN or DISCORD_BOT_TOKEN not found in environment variables.",
  );
  console.warn("⚠️ Discord bot will run in dormant mode (no connection).");

  // Keep the process alive to prevent container restart loops
  setInterval(
    () => {
      // Heartbeat for dormant mode
    },
    1000 * 60 * 60,
  ); // Check every hour
} else {
  client.login(token).catch((error) => {
    console.error("❌ Failed to login:", error);
    process.exit(1);
  });
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  client.destroy();
  process.exit(0);
});
