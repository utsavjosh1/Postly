import asyncpg
import os
import logging
from typing import Optional

logger = logging.getLogger("PostlyBot.Repository")

class GuildConfigRepository:
    def __init__(self, dsn: str):
        self.dsn = dsn
        self._pool: Optional[asyncpg.Pool] = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(self.dsn)
        return self._pool

    async def update_channel(self, guild_id: str, channel_id: str) -> bool:
        """Update guild configuration. Returns True if row existed and was updated."""
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            # We ONLY update. The row MUST be created via Web OAuth to link a user_id.
            status = await conn.execute(
                """
                UPDATE discord_configs 
                SET channel_id = $2, updated_at = NOW(), is_active = TRUE 
                WHERE guild_id = $1
                """,
                guild_id, channel_id
            )
            # status is usually 'UPDATE 1' or 'UPDATE 0'
            updated = status.split(" ")[1] != "0"
            if updated:
                logger.info(f"Updated channel for guild {guild_id} to {channel_id}")
            return updated

    async def set_inactive(self, guild_id: str):
        """Mark a guild as inactive (e.g. if bot was kicked or channel deleted)"""
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE discord_configs SET is_active = FALSE, updated_at = NOW() WHERE guild_id = $1",
                guild_id
            )
            logger.info(f"Marked guild {guild_id} as inactive")

    async def get_active_configs(self):
        """Fetch all active configurations for job dispatching"""
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            return await conn.fetch(
                "SELECT guild_id, channel_id FROM discord_configs WHERE is_active = TRUE AND channel_id IS NOT NULL"
            )

    async def close(self):
        if self._pool:
            await self._pool.close()
            self._pool = None
