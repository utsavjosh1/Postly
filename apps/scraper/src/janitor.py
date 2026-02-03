#!/usr/bin/env python3
"""
janitor.py
Self-healing maintenance service.
"""

import asyncio
import logging
from database import Database

logger = logging.getLogger(__name__)

class JanitorService:
    """
    Daily maintenance tasks to keep database clean.
    Runs at 03:00 AM via APScheduler.
    """
    
    def __init__(self, database: Database):
        self.db = database
    
    async def run_maintenance(self):
        """Execute all maintenance tasks."""
        logger.info("=== Starting Janitor Maintenance ===")
        
        try:
            # Task 1: Sanitize descriptions
            await self.db.sanitize_descriptions()
            
            # Task 2: Remove duplicates
            await self.db.remove_duplicates()
            
            # Task 3: Cleanup old jobs (30 days)
            await self.db.cleanup_old_jobs(days=30)
            
            logger.info("=== Janitor Maintenance Complete ===")
            
        except Exception as e:
            logger.error(f"Maintenance failed: {e}")
