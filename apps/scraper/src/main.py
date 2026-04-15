#!/usr/bin/env python3
"""
main.py
Entry-point for the hiring.cafe job scraper.

CHANGELOG:
- Added _consecutive_failures logic to track crash loops without silent shutdown
- Updated spider call to pass known_ids for detail fetching bypass
- Changed scheduler.shutdown(wait=False) to wait=True to fix shutdown race 
- Pushing _consecutive_failures to the health server payload
"""

import asyncio
import logging
import os
import signal
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path

# Suppress urllib3 NotOpenSSLWarning (common on macOS with LibreSSL)
try:
    from urllib3.exceptions import NotOpenSSLWarning
    warnings.filterwarnings("ignore", category=NotOpenSSLWarning)
except ImportError:
    pass

from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Local imports
sys.path.insert(0, str(Path(__file__).parent))

from database import Database
from pipeline import JobProcessingPipeline
from embedding_service import VoyageEmbeddingService, EmbeddingWorker
from spiders.remotive import RemotiveSpider
from spiders.arbeitnow import ArbeitnowSpider
from spiders.greenhouse import GreenhouseSpider

# HiringCafeSpider requires playwright — import conditionally
try:
    from spiders.hiring_cafe import HiringCafeSpider
    HIRING_CAFE_AVAILABLE = True
except ImportError:
    HiringCafeSpider = None
    HIRING_CAFE_AVAILABLE = False
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
        self.spiders: list = []  # All spider instances
        self.pipeline: JobProcessingPipeline = None
        self.embedder: VoyageEmbeddingService = None
        self.embedding_worker: EmbeddingWorker = None
        self.janitor: JanitorService = None
        self.health: HealthCheckServer = None
        self.scheduler: AsyncIOScheduler = None

        # State
        self._running = False
        self._stopping = False
        self._cycle_count = 0
        self._consecutive_failures: int = 0

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

        # 3. Spiders — API-based sources (always available) + hiring.cafe (if playwright installed)
        self.spiders = [
            RemotiveSpider(requests_per_minute=2),      # TOS: max 2 req/min
            ArbeitnowSpider(requests_per_minute=20),    # Generous limits
            GreenhouseSpider(requests_per_minute=30),   # Per-board, very fast
        ]

        if HIRING_CAFE_AVAILABLE and HiringCafeSpider:
            self.spiders.append(
                HiringCafeSpider(requests_per_minute=self.requests_per_minute)
            )
            logger.info("HiringCafeSpider enabled (playwright found)")
        else:
            logger.warning("HiringCafeSpider disabled (playwright not installed)")

        logger.info(f"Initialized {len(self.spiders)} spiders: "
                    f"{[s.SOURCE_NAME if hasattr(s, 'SOURCE_NAME') else 'hiring_cafe' for s in self.spiders]}")

        # 4. Pipeline
        self.pipeline = JobProcessingPipeline(
            database=self.db,
            embedding_service=self.embedder,
            batch_size=100,
        )

        # 5. Janitor
        self.janitor = JanitorService(database=self.db)

        # 6. Health check server - pass a reference to expose failures dynamically
        self.health = HealthCheckServer(port=self.health_port)
        self.health.scraper = self  # Give health server access to self._consecutive_failures
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

    async def _run_pipeline(self):
        """Isolated scraping orchestration logic — runs ALL spiders sequentially."""
        self._cycle_count += 1
        cycle = self._cycle_count

        logger.info({"event": "cycle_start", "cycle": cycle})

        # Shared known IDs for cross-source dedup
        known_ids = await self.db.get_all_source_ids()
        logger.info(f"Loaded {len(known_ids)} known IDs for cross-source dedup")

        total_scraped = 0
        total_stored = 0
        source_results = {}

        for spider in self.spiders:
            source_name = getattr(spider, 'SOURCE_NAME', 'hiring_cafe')
            spider_scraped = 0
            spider_stored = 0
            batch = []

            try:
                logger.info(f"--- Starting spider: {source_name} ---")

                async for job in spider.scrape(known_ids=known_ids):
                    batch.append(job)
                    spider_scraped += 1

                    if len(batch) >= self.pipeline.batch_size:
                        logger.info(f"[{source_name}] Batch full ({len(batch)} jobs). Processing...")
                        metrics = await self.pipeline.process(batch)
                        spider_stored += metrics.jobs_stored
                        batch = []

                        # Update health periodically
                        self.health.update_status(
                            last_scrape=datetime.now(timezone.utc).isoformat(),
                            jobs_in_db=(await self.db.get_stats()).get("total_jobs", 0),
                            consecutive_failures=self._consecutive_failures,
                        )

                # Process remaining jobs in the last batch
                if batch:
                    metrics = await self.pipeline.process(batch)
                    spider_stored += metrics.jobs_stored

                total_scraped += spider_scraped
                total_stored += spider_stored
                source_results[source_name] = {
                    "scraped": spider_scraped,
                    "stored": spider_stored,
                    "errors": spider.errors,
                }

                logger.info(f"--- Spider {source_name} complete: "
                           f"scraped={spider_scraped}, stored={spider_stored}, "
                           f"errors={spider.errors} ---")

            except Exception as e:
                logger.error(f"Spider {source_name} crashed: {e}", exc_info=True)
                source_results[source_name] = {
                    "scraped": spider_scraped,
                    "stored": spider_stored,
                    "error": str(e),
                }
            finally:
                # Reset spider metrics for next cycle
                spider.jobs_found = 0
                spider.pages_scraped = 0
                spider.errors = 0
                if hasattr(spider, 'detail_fetches'):
                    spider.detail_fetches = 0

        logger.info({
            "event": "cycle_complete",
            "cycle": cycle,
            "total_scraped": total_scraped,
            "total_stored": total_stored,
            "sources": source_results,
        })

        # Final health update
        stats = await self.db.get_stats()
        self.health.update_status(
            last_scrape=datetime.now(timezone.utc).isoformat(),
            jobs_in_db=stats.get("total_jobs", 0),
            consecutive_failures=self._consecutive_failures,
            by_source=stats.get("by_source", {}),
        )


    async def _scrape_cycle(self):
        """Execute one full scrape → process → store cycle inside resilience wrapper."""
        try:
            await self._run_pipeline()
            self._consecutive_failures = 0
            # update health state on success explicitly
            self.health.update_status(consecutive_failures=0)
        except asyncio.CancelledError:
            # Shutdown initiated, exit silently and return to avoid APScheduler error logging
            return
        except Exception as e:
            self._consecutive_failures += 1
            logger.exception(
                "Scrape cycle failed (%d consecutive)", 
                self._consecutive_failures
            )
            
            # Update health state failures
            self.health.update_status(
                errors=self.health.status.get("errors", []) + [str(e)],
                consecutive_failures=self._consecutive_failures
            )
            
            if self._consecutive_failures >= 3:
                logger.critical(
                    "3 consecutive failures — pipeline may be broken, "
                    "manual intervention required"
                )

    async def _maintenance_cycle(self):
        """Run janitor maintenance tasks."""
        try:
            summary = await self.janitor.run_maintenance()
            logger.info({"event": "maintenance_complete", **summary})
        except Exception as e:
            logger.error(f"Maintenance failed: {e}")

    async def stop(self):
        """Gracefully shut down all components with defensive checks and idempotency."""
        if self._stopping:
            return
        self._stopping = True

        logger.info("Shutting down scraper system...")
        self._running = False

        # Stop scheduler first to prevent new jobs from starting (with blocking wait)
        if self.scheduler:
            try:
                if self.scheduler.running:
                    self.scheduler.shutdown(wait=True)
            except Exception as e:
                logger.warning(f"Scheduler shutdown interrupted — job may have been mid-run: {e}")

        # Stop other background tasks
        if self.embedding_worker:
            try:
                self.embedding_worker.stop()
            except Exception as e:
                logger.warning(f"Error stopping embedding worker: {e}")

        # Close all spiders
        for spider in self.spiders:
            try:
                await spider.close()
            except Exception as e:
                source_name = getattr(spider, 'SOURCE_NAME', 'unknown')
                logger.warning(f"Error closing spider {source_name}: {e}")

        # Stop health server
        if self.health:
            try:
                await self.health.stop()
            except Exception as e:
                logger.warning(f"Error stopping health server: {e}")

        # Final database cleanup
        if self.db:
            try:
                await self.db.close()
            except Exception as e:
                logger.warning(f"Error closing database: {e}")

        logger.info("Scraper system stopped")


# ─── Main Entry ───────────────────────────────────────────────────

async def main():
    setup_logging()

    system = ScraperSystem()

    # Handle signals for graceful shutdown
    # We simply set _running to False to break the loop; 
    # the finally block will handle the component shutdown.
    loop = asyncio.get_event_loop()
    def signal_handler():
        system._running = False
        logger.info("Interrupt received, stopping...")

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)

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
