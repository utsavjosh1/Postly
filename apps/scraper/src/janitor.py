#!/usr/bin/env python3
"""
janitor.py
Maintenance service for keeping the job database clean.
Works with the Drizzle-managed `jobs` table.
"""

import asyncio
import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class JanitorService:
    """
    Scheduled maintenance tasks:
    1. Remove expired jobs (past expires_at)
    2. Deactivate stale jobs (not refreshed for N days)
    3. Remove old jobs (> max_age_days)
    4. Remove duplicates
    """

    def __init__(
        self,
        database,
        max_age_days: int = 30,
        stale_days: int = 14,
    ):
        self.db = database
        self.max_age_days = max_age_days
        self.stale_days = stale_days

    async def remove_expired_jobs(self) -> int:
        """Remove jobs past their expiry date."""
        try:
            count = await self.db.cleanup_expired_jobs()
            logger.info(f"Removed {count} expired jobs")
            return count
        except Exception as e:
            logger.error(f"Failed to remove expired jobs: {e}")
            return 0

    async def remove_old_jobs(self) -> int:
        """Remove jobs older than max_age_days."""
        try:
            count = await self.db.cleanup_old_jobs(self.max_age_days)
            logger.info(f"Removed {count} old jobs (> {self.max_age_days} days)")
            return count
        except Exception as e:
            logger.error(f"Failed to remove old jobs: {e}")
            return 0

    async def deactivate_stale(self) -> int:
        """Mark jobs as inactive if not refreshed recently."""
        try:
            count = await self.db.deactivate_stale_jobs(self.stale_days)
            logger.info(f"Deactivated {count} stale jobs (> {self.stale_days} days)")
            return count
        except Exception as e:
            logger.error(f"Failed to deactivate stale jobs: {e}")
            return 0

    async def remove_duplicates(self) -> int:
        """Remove duplicate jobs."""
        try:
            count = await self.db.remove_duplicates()
            logger.info(f"Removed {count} duplicate jobs")
            return count
        except Exception as e:
            logger.error(f"Failed to remove duplicates: {e}")
            return 0

    async def run_maintenance(self) -> Dict[str, Any]:
        """Execute all maintenance tasks."""
        logger.info("=== Starting Janitor Maintenance ===")
        start_time = datetime.now()

        summary = {
            "started_at": start_time.isoformat(),
            "tasks": {},
        }

        try:
            summary["tasks"]["expired_removed"] = await self.remove_expired_jobs()
            summary["tasks"]["stale_deactivated"] = await self.deactivate_stale()
            summary["tasks"]["old_removed"] = await self.remove_old_jobs()
            summary["tasks"]["duplicates_removed"] = await self.remove_duplicates()

            end_time = datetime.now()
            summary["completed_at"] = end_time.isoformat()
            summary["duration_seconds"] = (end_time - start_time).total_seconds()
            summary["success"] = True

            logger.info(
                f"=== Janitor complete ({summary['duration_seconds']:.1f}s) ==="
            )

        except Exception as e:
            logger.error(f"Maintenance failed: {e}")
            summary["success"] = False
            summary["error"] = str(e)

        return summary
