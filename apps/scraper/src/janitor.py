#!/usr/bin/env python3
"""
janitor.py
Comprehensive maintenance service for keeping the job database clean.
"""

import asyncio
import logging
import aiohttp
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class JanitorService:
    """
    Daily maintenance tasks to keep database clean.
    
    Tasks:
    1. Remove expired jobs (past expiry_date)
    2. Remove jobs returning 404
    3. Remove jobs older than threshold
    4. Remove spam/irrelevant jobs
    5. Clean orphan embeddings
    6. Sanitize descriptions
    7. Remove duplicates
    """
    
    def __init__(
        self,
        database,
        cleanup_batch_size: int = 500,
        max_age_days: int = 30,
        validation_batch_size: int = 100
    ):
        self.db = database
        self.cleanup_batch_size = cleanup_batch_size
        self.max_age_days = max_age_days
        self.validation_batch_size = validation_batch_size
        self.http_session = None
    
    async def _ensure_http_session(self):
        """Ensure HTTP session is available."""
        if not self.http_session:
            self.http_session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10)
            )
    
    async def _close_http_session(self):
        """Close HTTP session."""
        if self.http_session:
            await self.http_session.close()
            self.http_session = None
    
    async def _check_url_status(self, url: str) -> bool:
        """Check if URL returns 200."""
        try:
            async with self.http_session.head(url, allow_redirects=True) as resp:
                return resp.status == 200
        except Exception:
            return False
    
    async def validate_job_urls(self) -> Dict[str, int]:
        """
        Validate job URLs and mark invalid ones.
        Returns stats on validated jobs.
        """
        await self._ensure_http_session()
        
        stats = {'validated': 0, 'valid': 0, 'invalid': 0}
        
        try:
            # Get jobs needing validation
            jobs = await self.db.get_jobs_for_validation(self.validation_batch_size)
            
            if not jobs:
                logger.info("No jobs need URL validation")
                return stats
            
            logger.info(f"Validating {len(jobs)} job URLs")
            
            invalid_job_ids = []
            
            for job in jobs:
                url = job.get('application_link')
                if not url:
                    continue
                
                is_valid = await self._check_url_status(url)
                stats['validated'] += 1
                
                if is_valid:
                    stats['valid'] += 1
                    await self.db.update_validation_status(job['job_id'], True)
                else:
                    stats['invalid'] += 1
                    invalid_job_ids.append(job['job_id'])
                    await self.db.update_validation_status(
                        job['job_id'], 
                        False, 
                        'URL returns non-200 status'
                    )
                
                # Small delay to avoid hammering servers
                await asyncio.sleep(0.5)
            
            if invalid_job_ids:
                logger.warning(f"Found {len(invalid_job_ids)} jobs with dead URLs")
            
            return stats
            
        except Exception as e:
            logger.error(f"URL validation failed: {e}")
            return stats
        finally:
            await self._close_http_session()
    
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
    
    async def remove_invalid_jobs(self) -> int:
        """Remove jobs marked as invalid in batches."""
        total_removed = 0
        try:
            while True:
                count = await self.db.remove_invalid_jobs(self.cleanup_batch_size)
                total_removed += count
                if count < self.cleanup_batch_size:
                    break
                await asyncio.sleep(1)  # Prevent DB overload
            
            logger.info(f"Removed {total_removed} invalid jobs")
            return total_removed
        except Exception as e:
            logger.error(f"Failed to remove invalid jobs: {e}")
            return total_removed
    
    async def remove_duplicates(self) -> int:
        """Remove duplicate jobs based on description."""
        try:
            count = await self.db.remove_duplicates()
            logger.info(f"Removed {count} duplicate jobs")
            return count
        except Exception as e:
            logger.error(f"Failed to remove duplicates: {e}")
            return 0
    
    async def cleanup_orphan_embeddings(self) -> int:
        """Clean up embeddings for invalid jobs."""
        try:
            count = await self.db.cleanup_orphan_embeddings()
            logger.info(f"Cleaned up {count} orphan embeddings")
            return count
        except Exception as e:
            logger.error(f"Failed to cleanup orphan embeddings: {e}")
            return 0
    
    async def sanitize_descriptions(self):
        """Clean up common junk patterns in descriptions."""
        try:
            await self.db.sanitize_descriptions()
            logger.info("Sanitized job descriptions")
        except Exception as e:
            logger.error(f"Failed to sanitize descriptions: {e}")
    
    async def run_maintenance(self) -> Dict[str, Any]:
        """
        Execute all maintenance tasks.
        Returns summary of actions taken.
        """
        logger.info("=== Starting Janitor Maintenance ===")
        start_time = datetime.now()
        
        summary = {
            'started_at': start_time.isoformat(),
            'tasks': {}
        }
        
        try:
            # Task 1: Validate URLs and mark dead links
            logger.info("Task 1: Validating job URLs...")
            url_stats = await self.validate_job_urls()
            summary['tasks']['url_validation'] = url_stats
            
            # Task 2: Remove expired jobs
            logger.info("Task 2: Removing expired jobs...")
            expired = await self.remove_expired_jobs()
            summary['tasks']['expired_removed'] = expired
            
            # Task 3: Remove old jobs
            logger.info("Task 3: Removing old jobs...")
            old = await self.remove_old_jobs()
            summary['tasks']['old_removed'] = old
            
            # Task 4: Remove invalid jobs (404s, spam, etc.)
            logger.info("Task 4: Removing invalid jobs...")
            invalid = await self.remove_invalid_jobs()
            summary['tasks']['invalid_removed'] = invalid
            
            # Task 5: Remove duplicates
            logger.info("Task 5: Removing duplicates...")
            dupes = await self.remove_duplicates()
            summary['tasks']['duplicates_removed'] = dupes
            
            # Task 6: Cleanup orphan embeddings
            logger.info("Task 6: Cleaning orphan embeddings...")
            orphans = await self.cleanup_orphan_embeddings()
            summary['tasks']['orphan_embeddings_cleaned'] = orphans
            
            # Task 7: Sanitize descriptions
            logger.info("Task 7: Sanitizing descriptions...")
            await self.sanitize_descriptions()
            summary['tasks']['descriptions_sanitized'] = True
            
            # Calculate duration
            end_time = datetime.now()
            summary['completed_at'] = end_time.isoformat()
            summary['duration_seconds'] = (end_time - start_time).total_seconds()
            summary['success'] = True
            
            logger.info(f"=== Janitor Maintenance Complete ({summary['duration_seconds']:.1f}s) ===")
            
        except Exception as e:
            logger.error(f"Maintenance failed: {e}")
            summary['success'] = False
            summary['error'] = str(e)
        
        return summary
    
    async def run_quick_cleanup(self) -> Dict[str, int]:
        """
        Run a quick cleanup (no URL validation).
        Useful for more frequent runs.
        """
        logger.info("Running quick cleanup...")
        
        results = {
            'expired': await self.remove_expired_jobs(),
            'duplicates': await self.remove_duplicates(),
        }
        
        logger.info(f"Quick cleanup complete: {results}")
        return results
