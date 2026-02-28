import os
import asyncio
import discord
from discord import app_commands
from discord.ext import commands, tasks
from dotenv import load_dotenv
from pathlib import Path
import logging
from typing import Optional

from src.repository import GuildConfigRepository
from src.utils import JobEmbedBuilder
from src.worker import start_worker

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("PostlyBot")

# Load environment variables from project root (standard strategy)
root_dir = Path(__file__).resolve().parent.parent.parent.parent
env_path = root_dir / '.env'

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    logger.info(f"Loaded environment from {env_path}")
else:
    # Fallback to local bot root
    alt_env = Path(__file__).resolve().parent.parent / '.env'
    if alt_env.exists():
        load_dotenv(dotenv_path=alt_env)
        logger.info(f"Loaded environment from {alt_env}")
    else:
        logger.warning("No .env file found in root or apps/bot. Using existing environment variables.")

DATABASE_URL = os.getenv("DATABASE_URL")

class PostlyProductionBot(commands.AutoShardedBot):
    def __init__(self, repo: GuildConfigRepository):
        intents = discord.Intents.default()
        intents.guilds = True
        intents.message_content = False
        self.repo = repo

        super().__init__(
            command_prefix="/",
            intents=intents,
            shard_count=None
        )

    async def setup_hook(self):
        try:
            dev_guild_id = os.getenv("DEV_GUILD_ID")
            if dev_guild_id:
                guild = discord.Object(id=int(dev_guild_id))
                self.tree.copy_global_to(guild=guild)
                await self.tree.sync(guild=guild)
                logger.info(f"Synced slash commands to development guild: {dev_guild_id}")
            else:
                await self.tree.sync()
                logger.info("Synced slash commands globally (may take up to 1h).")
        except Exception as e:
            logger.error(f"Failed to sync slash commands: {e}")

        logger.info(f"Logged in as {self.user} | Shards: {self.shard_count}")

    async def close(self):
        await self.repo.close()
        await super().close()


# Initialize Repository
repo = GuildConfigRepository(DATABASE_URL)
bot = PostlyProductionBot(repo=repo)


@bot.tree.command(name="setup", description="Set the channel for daily Postly job drops")
@app_commands.describe(channel="The channel where jobs should be posted")
async def setup_channel(interaction: discord.Interaction, channel: discord.TextChannel):
    """Set the channel for daily Postly job drops"""
    if not interaction.permissions.manage_guild:
        await interaction.response.send_message(
            "❌ You need 'Manage Server' permissions to do this.",
            ephemeral=True
        )
        return

    guild_id = str(interaction.guild_id)
    channel_id = str(channel.id)

    try:
        success = await bot.repo.update_channel(guild_id, channel_id)
        if success:
            await interaction.response.send_message(
                f"✅ Success! Daily jobs will now be posted in {channel.mention}.",
                ephemeral=False
            )
        else:
            web_url = os.getenv("WEB_URL", "http://localhost:3001")
            magic_link = f"{web_url}/integrations?guild_id={guild_id}"

            await interaction.response.send_message(
                "❌ **Server Not Linked**\n\n"
                "This server needs to be connected to your Postly account before you can configure it.\n\n"
                f"👉 **[Click here to link this server]({magic_link})**",
                ephemeral=True
            )
    except Exception as e:
        logger.error(f"Error saving guild config: {e}")
        await interaction.response.send_message(
            "❌ Failed to save configuration. Please try again later.",
            ephemeral=True
        )


@bot.event
async def on_guild_remove(guild: discord.Guild):
    """Handle the 'Ghost Server' problem by marking inactive when kicked"""
    logger.info(f"Bot removed from guild {guild.id}. Marking as inactive.")
    await bot.repo.set_inactive(str(guild.id))


@bot.event
async def on_ready():
    logger.info(f"Bot is ready. Guilds: {len(bot.guilds)}")

    # Start the direct-dispatch fallback loop
    if not direct_dispatch_loop.is_running():
        direct_dispatch_loop.start()
        logger.info("Direct-dispatch fallback loop started")


@tasks.loop(hours=6)
async def direct_dispatch_loop():
    """
    Fallback: every 6 hours, check for active configs that may not have
    received jobs via BullMQ (e.g., if the API cron didn't fire).
    This is a safety net, not the primary dispatch mechanism.
    """
    try:
        # Only dispatch at 9 AM, 3 PM, 9 PM UTC-ish windows
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if now.hour not in (9, 15, 21):
            return

        configs = await bot.repo.get_active_configs()
        if not configs:
            logger.debug("No active Discord configs for fallback dispatch")
            return

        logger.info(f"Fallback dispatch: checking {len(configs)} active configs")

        for config in configs:
            guild_id = config["guild_id"]
            channel_id = config["channel_id"]
            if channel_id:
                from src.worker import process_notification
                await process_notification(
                    {"guild_id": guild_id, "channel_id": channel_id},
                    bot
                )
                await asyncio.sleep(2)

    except Exception as e:
        logger.error(f"Fallback dispatch error: {e}")


async def main():
    token = os.getenv("DISCORD_BOT_TOKEN") or os.getenv("DISCORD_TOKEN")
    if token:
        token = token.strip()

    if not token or len(token) < 50:
        logger.error("Invalid token: DISCORD_BOT_TOKEN is missing or too short.")
        return

    # Start BullMQ Worker
    worker = await start_worker(bot)

    async with bot:
        await bot.start(token)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
