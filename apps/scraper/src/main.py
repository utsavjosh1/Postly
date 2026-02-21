#!/usr/bin/env python3
"""
main.py
Entry-point for the hiring.cafe job scraper.

Runs as a standalone async service:
  1. Connects to PostgreSQL (Drizzle-managed schema)
  2. Starts health check server
  3. Runs scraping cycles on a schedule (APScheduler)
  4. Processes jobs through pipeline → DB
  5. Background embedding worker catches stragglers
"""

import asyncio
import logging
import os
import signal
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Local imports
sys.path.insert(0, str(Path(__file__).parent))

from database import Database
from pipeline import JobProcessingPipeline
from embedding_service import VoyageEmbeddingService, EmbeddingWorker
from spiders.hiring_cafe import HiringCafeSpider
from janitor import JanitorService
from health import HealthCheckServer

# ─── Logging ──────────────────────────────────────────────────────

def setup_logging():
    """Configure structured readable logging."""
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    handler = logging.StreamHandler()
    
    try:
        import colorlog
        formatter = colorlog.ColoredFormatter(
            "%(log_color)s%(asctime)s [%(levelname)s] %(cyan)s%(name)s:%(reset)s %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    except ImportError:
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(log_level)
    # Remove existing handlers to avoid duplicates
    if root.hasHandlers():
        root.handlers.clear()
    root.addHandler(handler)

    # Quiet noisy loggers
    for noisy in ("aiohttp", "asyncpg", "apscheduler"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


logger = logging.getLogger(__name__)


# ─── Scraper System ──────────────────────────────────────────────

class ScraperSystem:
    """
    Orchestrator that coordinates scraping, processing, and maintenance.
    """

    def __init__(self):
        load_dotenv()

        # Config
        self.database_url = os.getenv("DATABASE_URL", "")
        self.voyage_api_key = os.getenv("VOYAGE_API_KEY", "")
        self.health_port = int(os.getenv("HEALTH_PORT", "8080"))
        self.scrape_interval_minutes = int(os.getenv("SCRAPE_INTERVAL_MINUTES", "60"))
        self.requests_per_minute = int(os.getenv("REQUESTS_PER_MINUTE", "20"))

        if not self.database_url:
            raise ValueError("DATABASE_URL is required")

        # Components (initialized in start())
        self.db: Database = None
        self.spider: HiringCafeSpider = None
        self.pipeline: JobProcessingPipeline = None
        self.embedder: VoyageEmbeddingService = None
        self.embedding_worker: EmbeddingWorker = None
        self.janitor: JanitorService = None
        self.health: HealthCheckServer = None
        self.scheduler: AsyncIOScheduler = None

        # State
        self._running = False
        self._cycle_count = 0

    async def start(self):
        """Initialize all components and start the service."""
        logger.info("Starting scraper system...")

        # 1. Database
        self.db = Database(self.database_url)
        await self.db.connect()

        # 2. Embedding service (optional — runs without if no key)
        if self.voyage_api_key:
            try:
                self.embedder = VoyageEmbeddingService(api_key=self.voyage_api_key)
                self.embedding_worker = EmbeddingWorker(
                    database=self.db,
                    embedding_service=self.embedder,
                    batch_size=50,
                    interval_seconds=120,
                )
                logger.info("Voyage AI embeddings enabled")
            except Exception as e:
                logger.warning(f"Embeddings disabled: {e}")
                self.embedder = None
        else:
            logger.warning("No VOYAGE_API_KEY — embeddings disabled")

        # 3. Spider
        self.spider = HiringCafeSpider(
            requests_per_minute=self.requests_per_minute,
        )

        # 4. Pipeline
        self.pipeline = JobProcessingPipeline(
            database=self.db,
            embedding_service=self.embedder,
            batch_size=100,
        )

        # 5. Janitor
        self.janitor = JanitorService(database=self.db)

        # 6. Health check server
        self.health = HealthCheckServer(port=self.health_port)
        self.health.update_status(database_connected=True)
        await self.health.start()

        # 7. Scheduler
        self.scheduler = AsyncIOScheduler()
        self.scheduler.add_job(
            self._scrape_cycle,
            "interval",
            minutes=self.scrape_interval_minutes,
            id="scrape_cycle",
            next_run_time=datetime.now(timezone.utc),  # Run immediately
        )
        self.scheduler.add_job(
            self._maintenance_cycle,
            "interval",
            hours=24,
            id="maintenance",
        )
        self.scheduler.start()

        # 8. Embedding worker (background)
        if self.embedding_worker:
            asyncio.create_task(self.embedding_worker.start())

        self._running = True
        logger.info({
            "event": "system_started",
            "scrape_interval_min": self.scrape_interval_minutes,
            "embeddings_enabled": self.embedder is not None,
            "health_port": self.health_port,
        })

    async def _scrape_cycle(self):
        """Execute one full scrape → process → store cycle."""
        self._cycle_count += 1
        cycle = self._cycle_count

        logger.info({"event": "cycle_start", "cycle": cycle})
        
        batch = []
        total_scraped = 0
        total_stored = 0

        try:
            # Scrape and process in real-time batches
            async for job in self.spider.scrape():
                batch.append(job)
                total_scraped += 1
                
                if len(batch) >= self.pipeline.batch_size:
                    logger.info(f"Batch full ({len(batch)} jobs). Sending to pipeline...")
                    metrics = await self.pipeline.process(batch)
                    total_stored += metrics.jobs_stored
                    batch = []
                    
                    # Update health periodically
                    self.health.update_status(
                        last_scrape=datetime.now(timezone.utc).isoformat(),
                        jobs_in_db=(await self.db.get_stats()).get("total_jobs", 0),
                    )

            # Process remaining jobs in the last batch
            if batch:
                metrics = await self.pipeline.process(batch)
                total_stored += metrics.jobs_stored

            logger.info(f"Cycle {cycle} complete: scraped {total_scraped}, stored {total_stored}")

            # Final health update
            stats = await self.db.get_stats()
            self.health.update_status(
                last_scrape=datetime.now(timezone.utc).isoformat(),
                jobs_in_db=stats.get("total_jobs", 0),
            )

        except Exception as e:
            logger.error(f"Cycle {cycle} failed: {e}")
            self.health.update_status(
                errors=self.health.status.get("errors", []) + [str(e)]
            )

        finally:
            # Reset spider metrics for next cycle
            self.spider.jobs_found = 0
            self.spider.pages_scraped = 0
            self.spider.detail_fetches = 0
            self.spider.errors = 0

    async def _maintenance_cycle(self):
        """Run janitor maintenance tasks."""
        try:
            summary = await self.janitor.run_maintenance()
            logger.info({"event": "maintenance_complete", **summary})
        except Exception as e:
            logger.error(f"Maintenance failed: {e}")

    async def stop(self):
        """Gracefully shut down all components."""
        logger.info("Shutting down scraper system...")
        self._running = False

        if self.scheduler:
            self.scheduler.shutdown(wait=False)
        if self.embedding_worker:
            self.embedding_worker.stop()
        if self.spider:
            await self.spider.close()
        if self.health:
            await self.health.stop()
        if self.db:
            await self.db.close()

        logger.info("Scraper system stopped")


# ─── Main Entry ───────────────────────────────────────────────────

async def main():
    setup_logging()

    system = ScraperSystem()

    # Handle signals for graceful shutdown
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(system.stop()))

    try:
        await system.start()

        # Keep running until stopped
        while system._running:
            await asyncio.sleep(1)

    except KeyboardInterrupt:
        pass
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        await system.stop()


if __name__ == "__main__":
    asyncio.run(main())
