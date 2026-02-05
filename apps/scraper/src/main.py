#!/usr/bin/env python3
"""
main.py
Main orchestrator for the job scraping system.
"""

import asyncio
import logging
import os
import signal
import sys
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from database import Database
from scraper import JobScraper
from embedder import GeminiBatcher, EmbeddingWorker
from janitor import JanitorService
from health import HealthCheckServer

# Load environment variables
root_dir = Path(__file__).resolve().parents[2]
env_path = root_dir / '../../../.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HEALTH_PORT = int(os.getenv("HEALTH_PORT", "8080"))

# Scraping configuration
SCRAPE_INTERVAL_MINUTES = int(os.getenv("SCRAPE_INTERVAL_MINUTES", "5"))
EMBEDDING_BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "64"))
CLEANUP_HOUR = int(os.getenv("CLEANUP_HOUR", "3"))

# Fallback: construct DATABASE_URL from components
if not DATABASE_URL:
    db_user = os.getenv("DB_USER", "postgres")
    db_pass = os.getenv("DB_PASSWORD", "postgres")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "postly")
    DATABASE_URL = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


class ScraperSystem:
    """Main orchestrator for the scraping system."""
    
    def __init__(self):
        self.running = True
        self.db = Database(DATABASE_URL)
        self.scraper = JobScraper()
        self.embedder = GeminiBatcher(
            GEMINI_API_KEY,
            batch_size=EMBEDDING_BATCH_SIZE
        ) if GEMINI_API_KEY else None
        self.embedding_worker = None
        self.janitor = None
        self.scheduler = AsyncIOScheduler()
        self.health = HealthCheckServer(port=HEALTH_PORT)
        
        # Job sources - organized by priority
        self.job_sources = {
            'high': [
                # High priority - check every hour
                "https://weworkremotely.com/remote-jobs/search?term=software",
                "https://remoteok.com/remote-dev-jobs",
            ],
            'medium': [
                # Medium priority - check every 6 hours
                # Add your medium priority sources here
            ],
            'low': [
                # Low priority - check every 24 hours
                # Add your low priority sources here
            ]
        }
    
    async def setup(self):
        """Initialize all components."""
        logger.info("=== Initializing Scraper System ===")
        
        # Start health check server first
        await self.health.start()
        
        # Connect to database
        await self.db.connect()
        self.health.update_status(database_connected=True)
        
        # Start browser
        await self.scraper.start()
        self.health.update_status(browser_ready=True)
        
        # Initialize janitor
        self.janitor = JanitorService(self.db)
        
        # Start embedding worker if API key available
        if self.embedder:
            self.embedding_worker = EmbeddingWorker(
                self.db,
                self.embedder,
                batch_size=EMBEDDING_BATCH_SIZE,
                interval_seconds=60
            )
            asyncio.create_task(self.embedding_worker.start())
            logger.info("Embedding worker started")
        
        # Schedule jobs
        
        # High priority sources - every hour
        self.scheduler.add_job(
            self._scrape_high_priority,
            'interval',
            hours=1,
            id='scrape_high'
        )
        
        # Medium priority sources - every 6 hours
        self.scheduler.add_job(
            self._scrape_medium_priority,
            'interval',
            hours=6,
            id='scrape_medium'
        )
        
        # Low priority sources - every 24 hours
        self.scheduler.add_job(
            self._scrape_low_priority,
            'interval',
            hours=24,
            id='scrape_low'
        )
        
        # Full maintenance - daily at CLEANUP_HOUR
        self.scheduler.add_job(
            self.janitor.run_maintenance,
            'cron',
            hour=CLEANUP_HOUR,
            minute=0,
            id='janitor'
        )
        
        # Quick cleanup - every 6 hours
        self.scheduler.add_job(
            self.janitor.run_quick_cleanup,
            'interval',
            hours=6,
            id='quick_cleanup'
        )
        
        self.scheduler.start()
        logger.info(f"Scheduler started - maintenance at {CLEANUP_HOUR}:00")
        
        logger.info("=== System Ready ===")
    
    async def _scrape_high_priority(self):
        """Scrape high priority sources."""
        if self.job_sources['high']:
            await self.scrape_and_store(self.job_sources['high'], 'high')
    
    async def _scrape_medium_priority(self):
        """Scrape medium priority sources."""
        if self.job_sources['medium']:
            await self.scrape_and_store(self.job_sources['medium'], 'medium')
    
    async def _scrape_low_priority(self):
        """Scrape low priority sources."""
        if self.job_sources['low']:
            await self.scrape_and_store(self.job_sources['low'], 'low')
    
    async def scrape_and_store(self, urls: list, priority: str = 'default'):
        """Main scraping loop for a set of URLs."""
        logger.info(f"Starting {priority} priority scrape cycle ({len(urls)} sources)")
        
        try:
            # Scrape jobs
            jobs = await self.scraper.scrape_multiple(urls)
            
            if not jobs:
                logger.warning(f"No valid jobs found in {priority} cycle")
                return
            
            logger.info(f"Scraped {len(jobs)} valid jobs from {priority} sources")
            
            # Generate embeddings if API key available
            if self.embedder:
                jobs = await self.embedder.embed_batch(jobs)
            else:
                logger.warning("No GEMINI_API_KEY - embeddings will be generated by worker")
            
            # Store in database using batch insert
            stored_count = await self.db.insert_jobs_batch(jobs)
            
            logger.info(f"Stored {stored_count}/{len(jobs)} jobs in database")
            
            # Update health status
            self.health.update_status(
                last_scrape=datetime.now().isoformat(),
                last_scrape_priority=priority,
                last_scrape_count=stored_count
            )
            
        except Exception as e:
            logger.error(f"Scrape cycle error: {e}", exc_info=True)
            self.health.update_status(last_error=str(e))
    
    async def run(self):
        """Main run loop."""
        await self.setup()
        
        # Run initial high-priority scrape
        logger.info("Running initial scrape...")
        await self._scrape_high_priority()
        
        logger.info(f"Entering main loop (scrapes scheduled)")
        
        while self.running:
            try:
                # Just keep running - scheduler handles the work
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"Loop error: {e}", exc_info=True)
                await asyncio.sleep(60)
    
    async def shutdown(self):
        """Graceful shutdown."""
        logger.info("Shutting down...")
        self.running = False
        
        if self.embedding_worker:
            self.embedding_worker.stop()
        
        if self.scheduler.running:
            self.scheduler.shutdown()
        
        await self.scraper.close()
        await self.db.close()
        await self.health.stop()
        
        logger.info("Shutdown complete")


async def main():
    """Entry point."""
    if not DATABASE_URL:
        logger.error("DATABASE_URL not configured")
        sys.exit(1)
    
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set - embeddings will be skipped")
    
    system = ScraperSystem()
    
    # Handle signals
    def signal_handler(sig, frame):
        logger.warning(f"Received signal {sig}")
        system.running = False
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await system.run()
    except KeyboardInterrupt:
        pass
    finally:
        await system.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
