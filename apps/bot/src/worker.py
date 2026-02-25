import asyncio
import logging
import json
import os
import uuid
from redis.asyncio import Redis
from src.utils import JobEmbedBuilder
import discord

logger = logging.getLogger("PostlyBot.Worker")

# BullMQ Redis Keys for "discord_notifications" queue
QUEUE_NAME = "discord_notifications"
PREFIX = "bull"
WAITING_KEY = f"{PREFIX}:{QUEUE_NAME}:wait"
ACTIVE_KEY = f"{PREFIX}:{QUEUE_NAME}:active"
STALLED_KEY = f"{PREFIX}:{QUEUE_NAME}:stalled"

async def process_notification(job_data, bot):
    """
    Processes a job data dict from BullMQ.
    """
    logger.info(f"🔍 [DEBUG] process_notification called with data: {job_data}")
    guild_id = job_data.get("guild_id")
    channel_id = job_data.get("channel_id")
    
    if not guild_id or not channel_id:
        logger.error(f"❌ [DEBUG] Invalid job data (missing guild/channel): {job_data}")
        return

    async def get_or_fetch_channel(cid):
        # First try cache
        logger.debug(f"🔍 [DEBUG] Attempting to get channel {cid} from bot cache")
        ch = bot.get_channel(int(cid))
        if ch:
            logger.info(f"✅ [DEBUG] Found channel {cid} in cache")
            return ch
        # Fallback to API call
        try:
            logger.info(f"🔍 [DEBUG] Channel {cid} not in cache, fetching via API...")
            return await bot.fetch_channel(int(cid))
        except Exception as e:
            logger.error(f"❌ [DEBUG] Failed to fetch channel {cid}: {e}")
            return None

    try:
        # 1. Fetch relevant jobs for this guild
        logger.info(f"🔍 [DEBUG] Fetching latest jobs from DB for guild {guild_id}")
        pool = await bot.repo._get_pool()
        db_jobs = await pool.fetch(
            "SELECT * FROM jobs WHERE is_active = TRUE ORDER BY posted_at DESC LIMIT 5"
        )
        
        logger.info(f"📈 [DEBUG] Retrieved {len(db_jobs)} jobs from DB for guild {guild_id}")

        if not db_jobs:
            logger.info(f"⚠️ [DEBUG] No new jobs found in DB to send for guild {guild_id}")
            return

        channel = await get_or_fetch_channel(channel_id)
        if not channel:
            logger.warning(f"❌ [DEBUG] Could not find channel {channel_id} for guild {guild_id}")
            logger.debug(f"🔍 [DEBUG] Bot is currently in guilds: {[g.id for g in bot.guilds]}")
            return

        logger.info(f"🚀 [DEBUG] Preparing to send jobs to channel: {channel.name} (ID: {channel.id})")

        success_count = 0
        for i, job_row in enumerate(db_jobs, 1):
            try:
                job_dict = dict(job_row)
                logger.debug(f"📦 [DEBUG] Building embed for job {i}/{len(db_jobs)} (ID: {job_dict.get('id')})")
                embed = JobEmbedBuilder.build_job_embed(job_dict)
                await channel.send(embed=embed)
                success_count += 1
                logger.info(f"✅ [DEBUG] Sent job {i}/{len(db_jobs)} to {channel.name}")
                await asyncio.sleep(1) # Pacing
            except Exception as send_err:
                logger.error(f"❌ [DEBUG] Failed to send embed for job {i}: {send_err}")

        logger.info(f"🏁 [DEBUG] Finished: Successfully sent {success_count}/{len(db_jobs)} job alerts to guild {guild_id}")

    except discord.Forbidden:
        logger.error(f"🚫 [DEBUG] Forbidden: Bot lacks permissions in guild {guild_id}")
        await bot.repo.set_inactive(guild_id)
    except discord.NotFound:
        logger.error(f"⚠️ [DEBUG] NotFound: Channel {channel_id} no longer exists")
        await bot.repo.set_inactive(guild_id)
    except Exception as e:
        logger.error(f"🔥 [DEBUG] CRITICAL ERROR in process_notification for guild {guild_id}: {e}")
        import traceback
        logger.error(traceback.format_exc())

async def start_worker(bot):
    """
    Manual BullMQ Worker loop for Python 3.9 (Incompatible with official bullmq pkg).
    Uses RPOPLPUSH for atomic job fetching from the waiting list to the active list.
    """
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    # Masking redis password if present for logs
    safe_url = redis_url.split("@")[-1] if "@" in redis_url else redis_url
    logger.info(f"🐂 [DEBUG] Starting Manual Redis Worker | Queue: {QUEUE_NAME} | Redis: {safe_url}")
    
    r = Redis.from_url(redis_url, decode_responses=True)
    
    async def worker_loop():
        logger.info(f"🔄 [DEBUG] Worker loop entered. Monitoring {WAITING_KEY}...")
        while True:
            try:
                # Check list length for debugging
                wait_len = await r.llen(WAITING_KEY)
                active_len = await r.llen(ACTIVE_KEY)
                if wait_len > 0 or active_len > 0:
                    logger.debug(f"📊 [DEBUG] Queue Status: {WAITING_KEY}={wait_len}, {ACTIVE_KEY}={active_len}")

                # 1. Atomically move a job ID from waiting list to active list
                job_id = await r.rpoplpush(WAITING_KEY, ACTIVE_KEY)
                
                if job_id:
                    logger.info(f"🎯 [DEBUG] Popped job ID: {job_id} from {WAITING_KEY}")
                    
                    # 2. Get job data from hash: bull:discord_notifications:123
                    job_key = f"{PREFIX}:{QUEUE_NAME}:{job_id}"
                    logger.debug(f"🔍 [DEBUG] Fetching data for job {job_id} from key: {job_key}")
                    raw_data = await r.hget(job_key, "data")
                    
                    if not raw_data:
                        logger.warning(f"⚠️ [DEBUG] No data found at {job_key}, trying legacy key...")
                        job_key_legacy = f"{PREFIX}:{QUEUE_NAME}:jobs:{job_id}"
                        raw_data = await r.hget(job_key_legacy, "data")
                    
                    if raw_data:
                        logger.info(f"📥 [DEBUG] Found data for job {job_id}. Processing...")
                        try:
                            job_data = json.loads(raw_data)
                            await process_notification(job_data, bot)
                        except json.JSONDecodeError as je:
                            logger.error(f"❌ [DEBUG] Failed to parse job data for {job_id}: {je} | Raw: {raw_data[:200]}")
                    else:
                        logger.error(f"❌ [DEBUG] Could not find job data for ID {job_id} in ANY known BullMQ key pattern.")
                    
                    # 3. Move from active to completed (BullMQ uses a set for completed usually)
                    logger.debug(f"🧹 [DEBUG] Removing job {job_id} from {ACTIVE_KEY}")
                    await r.lrem(ACTIVE_KEY, 1, job_id)
                
                else:
                    # No jobs, wait a bit
                    await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"🔥 [DEBUG] Worker Loop Error: {e}")
                import traceback
                logger.error(traceback.format_exc())
                await asyncio.sleep(5)

    # Run loop in background
    asyncio.create_task(worker_loop())
    return r
