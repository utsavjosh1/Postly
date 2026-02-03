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
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from database import Database
from scraper import JobScraper
from embedder import GeminiBatcher
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
        self.embedder = GeminiBatcher(GEMINI_API_KEY) if GEMINI_API_KEY else None
        self.janitor = JanitorService(self.db)
        self.scheduler = AsyncIOScheduler()
        self.health = HealthCheckServer(port=HEALTH_PORT)
        
        # Example job URLs - replace with your sources
        self.job_sources = [
            "https://weworkremotely.com/remote-jobs/search?term=python",
            "https://remoteok.com/remote-python-jobs",
        ]
    
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
        
        # Schedule janitor (daily at 03:00 AM)
        self.scheduler.add_job(
            self.janitor.run_maintenance,
            'cron',
            hour=3,
            minute=0,
            id='janitor'
        )
        self.scheduler.start()
        logger.info("Janitor scheduled for 03:00 AM daily")
        
        logger.info("=== System Ready ===")
    
    async def scrape_and_store(self):
        """Main scraping loop."""
        logger.info("Starting scrape cycle")
        
        try:
            # Scrape jobs
            jobs = await self.scraper.scrape_multiple(self.job_sources)
            
            if not jobs:
                logger.warning("No valid jobs found in this cycle")
                return
            
            logger.info(f"Scraped {len(jobs)} valid jobs")
            
            # Generate embeddings if API key available
            if self.embedder:
                jobs = await self.embedder.embed_batch(jobs)
            else:
                logger.warning("No GEMINI_API_KEY - skipping embeddings")
            
            # Store in database
            stored_count = 0
            for job in jobs:
                success = await self.db.insert_job(job)
                if success:
                    stored_count += 1
            
            logger.info(f"Stored {stored_count}/{len(jobs)} jobs in database")
            
            # Update health status
            self.health.update_status(last_scrape=datetime.now().isoformat())
            
        except Exception as e:
            logger.error(f"Scrape cycle error: {e}", exc_info=True)
    
    async def run(self):
        """Main run loop."""
        await self.setup()
        
        logger.info("Starting main loop (5-minute cycles)")
        
        while self.running:
            try:
                await self.scrape_and_store()
                
                # Wait 5 minutes before next cycle
                logger.info("Sleeping 5 minutes...")
                await asyncio.sleep(300)
                
            except Exception as e:
                logger.error(f"Loop error: {e}", exc_info=True)
                await asyncio.sleep(60)
    
    async def shutdown(self):
        """Graceful shutdown."""
        logger.info("Shutting down...")
        self.running = False
        
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
