"""Supabase client for database operations."""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    from supabase import create_client, Client
except ImportError:
    # Fallback for type hints when supabase is not installed
    Client = Any

from .models import JobListing, ScrapingResult
from .config import config

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Async Supabase client for job data operations."""
    
    def __init__(self):
        """Initialize the Supabase client."""
        self.client: Optional[Client] = None
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialize the Supabase client with configuration."""
        try:
            self.client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    
    async def create_jobs_table(self) -> bool:
        """Create the jobs table if it doesn't exist."""
        try:
            # This would typically be done via Supabase dashboard or migrations
            # but we can attempt to create the table structure here
            sql_query = """
            CREATE TABLE IF NOT EXISTS jobs (
                id BIGSERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT NOT NULL,
                url TEXT NOT NULL UNIQUE,
                tags TEXT[],
                description TEXT,
                salary_range TEXT,
                employment_type TEXT,
                experience_level TEXT,
                scraped_at TIMESTAMPTZ DEFAULT NOW(),
                source TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
            CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
            CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON jobs(scraped_at);
            CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
            """
            
            # Note: Supabase Python client doesn't directly support DDL
            # This would need to be run manually in Supabase SQL editor
            logger.info("Jobs table structure defined (run manually in Supabase)")
            return True
            
        except Exception as e:
            logger.error(f"Error creating jobs table: {e}")
            return False
    
    async def save_job(self, job: JobListing) -> bool:
        """Save a single job to the database."""
        try:
            job_data = {
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "url": str(job.url),
                "tags": job.tags,
                "description": job.description,
                "salary_range": job.salary_range,
                "employment_type": job.employment_type,
                "experience_level": job.experience_level,
                "scraped_at": job.scraped_at.isoformat(),
                "source": job.source
            }
            
            # Use upsert to handle duplicates based on URL
            result = self.client.table("jobs").upsert(
                job_data,
                on_conflict="url"
            ).execute()
            
            if result.data:
                logger.debug(f"Successfully saved job: {job.title} at {job.company}")
                return True
            else:
                logger.warning(f"No data returned when saving job: {job.title}")
                return False
                
        except Exception as e:
            logger.error(f"Error saving job {job.title}: {e}")
            return False
    
    async def save_jobs_batch(self, jobs: List[JobListing]) -> int:
        """Save multiple jobs in batch operation."""
        if not jobs:
            return 0
        
        saved_count = 0
        batch_size = 50  # Supabase recommended batch size
        
        for i in range(0, len(jobs), batch_size):
            batch = jobs[i:i + batch_size]
            batch_data = []
            
            for job in batch:
                job_data = {
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "url": str(job.url),
                    "tags": job.tags,
                    "description": job.description,
                    "salary_range": job.salary_range,
                    "employment_type": job.employment_type,
                    "experience_level": job.experience_level,
                    "scraped_at": job.scraped_at.isoformat(),
                    "source": job.source
                }
                batch_data.append(job_data)
            
            try:
                result = self.client.table("jobs").upsert(
                    batch_data,
                    on_conflict="url"
                ).execute()
                
                if result.data:
                    batch_saved = len(result.data)
                    saved_count += batch_saved
                    logger.info(f"Saved batch of {batch_saved} jobs")
                else:
                    logger.warning(f"No data returned for batch {i//batch_size + 1}")
                
                # Add small delay between batches to respect rate limits
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Error saving job batch {i//batch_size + 1}: {e}")
                continue
        
        logger.info(f"Successfully saved {saved_count} out of {len(jobs)} jobs")
        return saved_count
    
    async def get_existing_job_urls(self, limit: int = 1000) -> List[str]:
        """Get URLs of existing jobs to avoid duplicates."""
        try:
            result = self.client.table("jobs").select("url").limit(limit).execute()
            
            if result.data:
                return [job["url"] for job in result.data]
            return []
            
        except Exception as e:
            logger.error(f"Error fetching existing job URLs: {e}")
            return []
    
    async def get_recent_jobs(self, hours: int = 24, limit: int = 100) -> List[Dict[str, Any]]:
        """Get jobs scraped within the last specified hours."""
        try:
            cutoff_time = datetime.utcnow().replace(
                hour=datetime.utcnow().hour - hours
            ).isoformat()
            
            result = self.client.table("jobs").select("*").gte(
                "scraped_at", cutoff_time
            ).limit(limit).order("scraped_at", desc=True).execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error fetching recent jobs: {e}")
            return []
    
    async def save_scraping_result(self, result: ScrapingResult) -> bool:
        """Save scraping operation results for monitoring."""
        try:
            result_data = {
                "total_jobs_found": result.total_jobs_found,
                "jobs_saved": result.jobs_saved,
                "jobs_filtered": result.jobs_filtered,
                "errors": result.errors,
                "duration_seconds": result.duration_seconds,
                "success_rate": result.success_rate,
                "timestamp": result.timestamp.isoformat()
            }
            
            # This would require a separate scraping_results table
            # For now, just log the results
            logger.info(f"Scraping completed: {result_data}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving scraping result: {e}")
            return False


# Global instance
supabase_client = SupabaseClient()
