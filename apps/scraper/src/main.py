#!/usr/bin/env python3
"""
main.py
Apify Actor entrypoint for in-house job scraping.

This module wraps the Scrapy engine using the Apify Python SDK,
configuring it to use Apify's proxy fleet and browser pool.
"""

import asyncio
import logging
import os
import sys
import signal
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

from dotenv import load_dotenv

# Structured JSON logging
from pythonjsonlogger import jsonlogger

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from database import Database
from pipeline import JobProcessingPipeline
from embedding_service import VoyageEmbeddingService, EmbeddingWorker
from spiders.hiring_cafe import HiringCafeSpider
from janitor import JanitorService
from health import HealthCheckServer

# Load environment variables
root_dir = Path(__file__).resolve().parents[2]
env_path = root_dir / '../../../.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


# ============= Structured JSON Logging Setup =============

def setup_logging():
    """Configure structured JSON logging."""
    log_handler = logging.StreamHandler(sys.stdout)
    
    formatter = jsonlogger.JsonFormatter(
        fmt='%(timestamp)s %(level)s %(name)s %(message)s',
        rename_fields={'levelname': 'level', 'asctime': 'timestamp'},
        timestamp=True,
    )
    log_handler.setFormatter(formatter)
    
    # Set root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.handlers = [log_handler]
    
    return logging.getLogger(__name__)


logger = setup_logging()


# ============= Configuration =============

DATABASE_URL = os.getenv("DATABASE_URL")
VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY")
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")
HEALTH_PORT = int(os.getenv("HEALTH_PORT", "8080"))

# Scraping configuration
SCRAPE_INTERVAL_MINUTES = int(os.getenv("SCRAPE_INTERVAL_MINUTES", "60"))
EMBEDDING_BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "50"))
CLEANUP_HOUR = int(os.getenv("CLEANUP_HOUR", "3"))

# Fallback: construct DATABASE_URL from components
if not DATABASE_URL:
    db_user = os.getenv("DB_USER", "postgres")
    db_pass = os.getenv("DB_PASSWORD", "postgres")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "postly")
    DATABASE_URL = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"


# ============= Apify Actor Logic =============

try:
    from apify import Actor
    APIFY_AVAILABLE = True
except ImportError:
    APIFY_AVAILABLE = False
    logger.warning("Apify SDK not available, running in standalone mode")


class ScraperSystem:
    """
    Main orchestrator for the scraping system.
    
    Supports two modes:
    1. Apify Actor mode: Uses Apify's proxy fleet and browser pool
    2. Standalone mode: Runs independently with local resources
    """
    
    def __init__(self):
        self.running = True
        self.db: Optional[Database] = None
        self.pipeline: Optional[JobProcessingPipeline] = None
        self.embedder: Optional[VoyageEmbeddingService] = None
        self.embedding_worker: Optional[EmbeddingWorker] = None
        self.janitor: Optional[JanitorService] = None
        self.health: Optional[HealthCheckServer] = None
        
        # Metrics tracking
        self.metrics = {
            'total_jobs_found': 0,
            'total_jobs_stored': 0,
            'total_duplicates_skipped': 0,
            'total_tokens_consumed': 0,
            'sources_scraped': {},
        }
    
    async def setup(self):
        """Initialize all components."""
        logger.info({
            "event": "system_init_start",
            "apify_mode": APIFY_AVAILABLE and bool(APIFY_API_TOKEN),
        })
        
        # Initialize database
        self.db = Database(DATABASE_URL)
        await self.db.connect()
        
        # Initialize embedding service if API key available
        if VOYAGE_API_KEY:
            self.embedder = VoyageEmbeddingService(
                api_key=VOYAGE_API_KEY,
                max_batch_size=EMBEDDING_BATCH_SIZE,
            )
            logger.info({"event": "voyage_embedder_initialized"})
        else:
            logger.warning({"event": "voyage_api_key_missing"})
        
        # Initialize processing pipeline
        self.pipeline = JobProcessingPipeline(
            database=self.db,
            embedding_service=self.embedder,
            batch_size=EMBEDDING_BATCH_SIZE,
        )
        
        # Initialize janitor for cleanup
        self.janitor = JanitorService(self.db)
        
        # Start health server
        self.health = HealthCheckServer(port=HEALTH_PORT)
        await self.health.start()
        self.health.update_status(database_connected=True)
        
        # Start embedding worker if embedder available
        if self.embedder:
            self.embedding_worker = EmbeddingWorker(
                database=self.db,
                embedding_service=self.embedder,
                batch_size=EMBEDDING_BATCH_SIZE,
                interval_seconds=60,
            )
            asyncio.create_task(self.embedding_worker.start())
        
        logger.info({"event": "system_init_complete"})
    
    async def run_hiring_cafe_spider(
        self,
        search_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run the Hiring Cafe API spider.
        
        Returns:
            Metrics from the scraping run
        """
        logger.info({
            "event": "spider_start",
            "source": "hiring_cafe",
            "params": search_params,
        })
        
        spider = HiringCafeSpider()
        jobs_list = []
        
        try:
            async for job in spider.scrape(search_params):
                jobs_list.append(job)
            
            # Process through pipeline
            if jobs_list:
                stored = await self.pipeline.process_batch(jobs_list)
                
                # Update metrics
                spider_metrics = spider.get_metrics()
                self.metrics['total_jobs_found'] += spider_metrics['jobs_found']
                self.metrics['total_jobs_stored'] += stored
                self.metrics['sources_scraped']['hiring_cafe'] = {
                    'last_run': datetime.utcnow().isoformat(),
                    'jobs_found': spider_metrics['jobs_found'],
                    'jobs_stored': stored,
                }
                
                return spider_metrics
                
        except Exception as e:
            logger.error({
                "event": "spider_error",
                "source": "hiring_cafe",
                "error": str(e),
            })
            return {'error': str(e)}
        finally:
            await spider.close()
    
    async def run_scrapy_spiders(self):
        """
        Run Scrapy-based spiders (Indeed, etc.).
        
        Uses CrawlerProcess with scrapy-playwright.
        """
        try:
            from scrapy.crawler import CrawlerProcess
            from scrapy.utils.project import get_project_settings
            from spiders.indeed import IndeedSpider
            
            settings = get_project_settings()
            settings.update({
                'DATABASE': self.db,
                'EMBEDDING_SERVICE': self.embedder,
            })
            
            # Configure Apify proxy if available
            if APIFY_AVAILABLE and APIFY_API_TOKEN:
                proxy_config = await Actor.create_proxy_configuration()
                settings.update({
                    'PLAYWRIGHT_LAUNCH_OPTIONS': {
                        'proxy': {'server': proxy_config.new_url()},
                    },
                })
            
            process = CrawlerProcess(settings)
            process.crawl(IndeedSpider)
            process.start()
            
        except Exception as e:
            logger.error({
                "event": "scrapy_error",
                "error": str(e),
            })
    
    async def run_scrape_cycle(self):
        """Run a complete scraping cycle across all sources."""
        logger.info({"event": "scrape_cycle_start"})
        start_time = datetime.utcnow()
        
        try:
            # Run Hiring Cafe (aiohttp-based)
            await self.run_hiring_cafe_spider()
            
            # Update health status
            self.health.update_status(
                last_scrape=datetime.utcnow().isoformat(),
                jobs_stored=self.metrics['total_jobs_stored'],
            )
            
        except Exception as e:
            logger.error({
                "event": "scrape_cycle_error",
                "error": str(e),
            })
            self.health.update_status(last_error=str(e))
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        # Get pipeline metrics
        pipeline_metrics = self.pipeline.get_metrics()
        
        logger.info({
            "event": "scrape_cycle_complete",
            "duration_seconds": round(duration, 2),
            "jobs_found": pipeline_metrics.jobs_found,
            "jobs_embedded": pipeline_metrics.jobs_embedded,
            "duplicates_skipped": pipeline_metrics.duplicates_skipped,
            "tokens_consumed": pipeline_metrics.tokens_consumed,
        })
    
    async def run(self):
        """Main run loop."""
        await self.setup()
        
        # Run initial scrape
        logger.info({"event": "initial_scrape_start"})
        await self.run_scrape_cycle()
        
        # Enter main loop with scheduled scrapes
        while self.running:
            try:
                # Wait for next scrape interval
                await asyncio.sleep(SCRAPE_INTERVAL_MINUTES * 60)
                
                if self.running:
                    await self.run_scrape_cycle()
                    
            except Exception as e:
                logger.error({
                    "event": "main_loop_error",
                    "error": str(e),
                })
                await asyncio.sleep(60)
    
    async def shutdown(self):
        """Graceful shutdown."""
        logger.info({"event": "shutdown_start"})
        self.running = False
        
        if self.embedding_worker:
            self.embedding_worker.stop()
        
        if self.db:
            await self.db.close()
        
        if self.health:
            await self.health.stop()
        
        logger.info({"event": "shutdown_complete"})


# ============= Apify Actor Entrypoint =============

async def apify_main():
    """
    Apify Actor entrypoint.
    
    Runs within Apify's infrastructure with proxy fleet access.
    """
    async with Actor:
        logger.info({
            "event": "apify_actor_start",
            "token_available": bool(APIFY_API_TOKEN),
        })
        
        # Get input from Apify
        actor_input = await Actor.get_input() or {}
        
        search_params = {
            'keywords': actor_input.get('keywords', 'software engineer'),
            'location': actor_input.get('location', 'remote'),
            'max_pages': actor_input.get('max_pages', 10),
        }
        
        system = ScraperSystem()
        
        try:
            await system.setup()
            
            # Run single scrape cycle for Apify
            await system.run_scrape_cycle()
            
            # Push results to Apify dataset
            await Actor.push_data({
                'metrics': system.metrics,
                'pipeline_metrics': system.pipeline.get_metrics().to_log_dict(),
            })
            
        finally:
            await system.shutdown()


async def standalone_main():
    """Standalone mode entrypoint (non-Apify)."""
    if not DATABASE_URL:
        logger.error({"event": "config_error", "message": "DATABASE_URL not configured"})
        sys.exit(1)
    
    system = ScraperSystem()
    
    # Signal handlers
    def signal_handler(sig, frame):
        logger.warning({"event": "signal_received", "signal": sig})
        system.running = False
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        await system.run()
    except KeyboardInterrupt:
        pass
    finally:
        await system.shutdown()


async def main():
    """Main entrypoint - detects environment and routes accordingly."""
    if APIFY_AVAILABLE and os.getenv('APIFY_IS_AT_APIFY'):
        await apify_main()
    else:
        await standalone_main()


if __name__ == "__main__":
    asyncio.run(main())
