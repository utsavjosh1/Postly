import {
  Client,
  GatewayIntentBits,
  Partials,
  ApplicationCommandOptionType,
  TextChannel,
  NewsChannel,
  ThreadChannel,
} from "discord.js";

import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ✅ Predefined job categories (safe + typo-free)
const JOB_CATEGORIES = [
  "tech",
  "marketing",
  "design",
  "finance",
  "sales",
] as const;
type JobCategory = (typeof JOB_CATEGORIES)[number];

// In-memory storage (replace with DB later)
const guildCategories = new Map<
  string,
  { category: JobCategory; channelId: string }
>();

// Register slash commands
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);

  if (!client.application) return;

  await client.application.commands.set([
    {
      name: "setcategory",
      description: "Choose job category for this server",
      options: [
        {
          name: "category",
          description: "Job category",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: JOB_CATEGORIES.map((cat) => ({ name: cat, value: cat })),
        },
        {
          name: "channel",
          description: "Channel where jobs will be posted",
          type: ApplicationCommandOptionType.Channel,
          required: true,
        },
      ],
    },
    {
      name: "showcategory",
      description: "Show current job category and channel",
    },
  ]);

  console.log("✅ Slash commands registered.");
});

// Handle slash commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, guildId } = interaction;
  if (!guildId) return;

  if (commandName === "setcategory") {
    const category = options.getString("category", true) as JobCategory;
    const channel = options.getChannel("channel", true);

    if (
      !channel ||
      !(
        channel instanceof TextChannel ||
        channel instanceof NewsChannel ||
        channel instanceof ThreadChannel
      )
    ) {
      await interaction.reply("⚠️ Please select a valid text-based channel.");
      return;
    }

    guildCategories.set(guildId, { category, channelId: channel.id });

    await interaction.reply(
      `✅ Job category set to **${category}**.\nJobs will be posted in ${channel}`
    );
  }

  if (commandName === "showcategory") {
    const settings = guildCategories.get(guildId);

    if (!settings) {
      await interaction.reply("⚠️ No category set yet.");
    } else {
      await interaction.reply(
        `📌 Current category: **${settings.category}**\nChannel: <#${settings.channelId}>`
      );
    }
  }
});

// Simulated job posting (replace with your scraper API)
setInterval(async () => {
  for (const [guildId, { category, channelId }] of guildCategories.entries()) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) continue;

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) continue;

    channel.send(
      `💼 New **${category}** job posted! (Example data — connect your scraper here)`
    );
  }
}, 60000); // every 1 min

client.login(process.env.BOT_TOKEN);
