import asyncio
import logging
import json
import os
from redis.asyncio import Redis
from src.utils import JobEmbedBuilder
import discord

logger = logging.getLogger("PostlyBot.Worker")

# BullMQ Redis Keys for "discord_notifications" queue
QUEUE_NAME = "discord_notifications"
PREFIX = "bull"

# BullMQ key patterns (varies by version)
WAITING_KEYS = [
    f"{PREFIX}:{QUEUE_NAME}:wait",     # BullMQ v3 and below
    f"{PREFIX}:{QUEUE_NAME}:waiting",  # BullMQ v4+
]
ACTIVE_KEY = f"{PREFIX}:{QUEUE_NAME}:active"


async def process_notification(job_data: dict, bot):
    """
    Processes a single send_discord_message job from BullMQ.
    Fetches latest active jobs from DB and sends them as embeds to the Discord channel.
    """
    guild_id = job_data.get("guild_id")
    channel_id = job_data.get("channel_id")

    if not guild_id or not channel_id:
        logger.error(f"Invalid job data (missing guild/channel): {job_data}")
        return

    try:
        # Fetch latest active jobs
        pool = await bot.repo._get_pool()
        db_jobs = await pool.fetch(
            "SELECT * FROM jobs WHERE is_active = TRUE ORDER BY posted_at DESC LIMIT 5"
        )

        if not db_jobs:
            logger.info(f"No active jobs to send for guild {guild_id}")
            return

        # Get or fetch the channel
        channel = bot.get_channel(int(channel_id))
        if not channel:
            try:
                channel = await bot.fetch_channel(int(channel_id))
            except Exception as e:
                logger.error(f"Failed to fetch channel {channel_id}: {e}")
                return

        if not channel:
            logger.warning(f"Channel {channel_id} not found for guild {guild_id}")
            return

        logger.info(f"Sending {len(db_jobs)} jobs to #{channel.name} (guild {guild_id})")

        success_count = 0
        for i, job_row in enumerate(db_jobs, 1):
            try:
                job_dict = dict(job_row)
                embed = JobEmbedBuilder.build_job_embed(job_dict)
                await channel.send(embed=embed)
                success_count += 1
                await asyncio.sleep(1)  # Rate limiting
            except Exception as send_err:
                logger.error(f"Failed to send job {i}: {send_err}")

        logger.info(f"Sent {success_count}/{len(db_jobs)} job alerts to guild {guild_id}")

    except discord.Forbidden:
        logger.error(f"Forbidden: Bot lacks permissions in guild {guild_id}")
        await bot.repo.set_inactive(guild_id)
    except discord.NotFound:
        logger.error(f"NotFound: Channel {channel_id} no longer exists")
        await bot.repo.set_inactive(guild_id)
    except Exception as e:
        logger.error(f"Error in process_notification for guild {guild_id}: {e}")
        import traceback
        logger.error(traceback.format_exc())


async def detect_waiting_key(r: Redis) -> str:
    """
    Detect which BullMQ waiting key format is in use.
    Returns the first key that exists, defaulting to 'wait'.
    """
    for key in WAITING_KEYS:
        if await r.exists(key):
            logger.info(f"Detected BullMQ waiting key: {key}")
            return key
    # Default to v3 format
    return WAITING_KEYS[0]


async def start_worker(bot):
    """
    Redis worker that polls BullMQ's waiting list for send_discord_message jobs.
    Uses BRPOPLPUSH for efficient blocking reads instead of busy polling.
    """
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    safe_url = redis_url.split("@")[-1] if "@" in redis_url else redis_url
    logger.info(f"Starting Redis Worker | Queue: {QUEUE_NAME} | Redis: {safe_url}")

    r = Redis.from_url(redis_url, decode_responses=True)

    async def worker_loop():
        # Detect which key format BullMQ uses
        waiting_key = await detect_waiting_key(r)
        logger.info(f"Worker monitoring: {waiting_key}")

        while True:
            try:
                # BRPOPLPUSH: blocks for up to 5 seconds waiting for a job
                # Returns None if no job available (timeout)
                job_id = await r.brpoplpush(waiting_key, ACTIVE_KEY, timeout=5)

                if job_id is None:
                    # No jobs, check alternate key periodically
                    for alt_key in WAITING_KEYS:
                        if alt_key != waiting_key:
                            alt_len = await r.llen(alt_key)
                            if alt_len > 0:
                                logger.info(f"Switching to alternate key: {alt_key}")
                                waiting_key = alt_key
                                break
                    continue

                logger.info(f"Processing job ID: {job_id}")

                # Get job data from BullMQ hash
                job_key = f"{PREFIX}:{QUEUE_NAME}:{job_id}"
                raw_data = await r.hget(job_key, "data")

                if not raw_data:
                    logger.warning(f"No data for job {job_id}, skipping")
                    await r.lrem(ACTIVE_KEY, 1, job_id)
                    continue

                try:
                    job_data = json.loads(raw_data)

                    # Only process send_discord_message jobs
                    job_name = await r.hget(job_key, "name")
                    if job_name == "daily_job_dispatch":
                        # This is the cron trigger — dispatch all guilds
                        logger.info("Processing daily_job_dispatch cron trigger")
                        configs = await bot.repo.get_active_configs()
                        for config in configs:
                            guild_id = config["guild_id"]
                            channel_id = config["channel_id"]
                            if channel_id:
                                await process_notification(
                                    {"guild_id": guild_id, "channel_id": channel_id},
                                    bot
                                )
                                await asyncio.sleep(2)  # Pace between guilds
                    else:
                        # send_discord_message or any other job
                        await process_notification(job_data, bot)

                except json.JSONDecodeError as je:
                    logger.error(f"Failed to parse job data for {job_id}: {je}")

                # Clean up: remove from active list and mark completed
                await r.lrem(ACTIVE_KEY, 1, job_id)

                # Mark as completed in BullMQ format
                completed_key = f"{PREFIX}:{QUEUE_NAME}:completed"
                await r.zadd(completed_key, {job_id: asyncio.get_event_loop().time()})

            except Exception as e:
                logger.error(f"Worker loop error: {e}")
                import traceback
                logger.error(traceback.format_exc())
                await asyncio.sleep(5)

    asyncio.create_task(worker_loop())
    return r
