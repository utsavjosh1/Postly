#!/usr/bin/env python3
"""
pipeline.py
Simplified job processing pipeline: Scrape → Dedup → Embed → Store.

No Scrapy adapter — only async pipeline for hiring.cafe JSON API.
"""

import asyncio
import logging
import time
from typing import List, Dict, Any, Optional

from models import ScrapedJob, ScrapingMetrics

logger = logging.getLogger(__name__)


class JobProcessingPipeline:
    """
    Processes scraped jobs through:
    1. Deduplication (by source_url)
    2. Embedding generation (Voyage AI)
    3. Batch insertion to DB
    """

    def __init__(
        self,
        database,
        embedding_service=None,
        batch_size: int = 25,
    ):
        self.db = database
        self.embedder = embedding_service
        self.batch_size = batch_size

        # Metrics
        self.metrics = ScrapingMetrics()
        self._known_urls: Optional[set] = None

    async def _load_known_urls(self):
        """Cache existing source_urls for dedup."""
        if self._known_urls is None:
            self._known_urls = await self.db.get_existing_source_urls("hiring_cafe")
            logger.info(f"Loaded {len(self._known_urls)} existing hiring_cafe URLs")

    def _is_duplicate(self, job: ScrapedJob) -> bool:
        """Check if job is already in DB by source_url."""
        if not job.source_url:
            return False
        return job.source_url in self._known_urls

    async def _embed_batch(self, jobs: List[ScrapedJob]) -> List[ScrapedJob]:
        """Generate embeddings for a batch of jobs."""
        if not self.embedder or not jobs:
            return jobs

        # Prepare text representations
        job_dicts = []
        for job in jobs:
            job_dicts.append({
                "job_title": job.title,
                "company_name": job.company_name,
                "job_description": job.description[:3000],
                "skills_required": job.skills_required or [],
                "location": job.location or "",
            })

        try:
            embedded = await self.embedder.embed_jobs(job_dicts)

            for job, emb_dict in zip(jobs, embedded):
                embedding = emb_dict.get("embedding")
                if embedding:
                    job.embedding = embedding
                    self.metrics.jobs_embedded += 1

        except Exception as e:
            logger.error(f"Embedding batch failed: {e}")

        return jobs

    async def _store_batch(self, jobs: List[ScrapedJob]) -> int:
        """Insert a batch of jobs to DB."""
        db_dicts = [job.to_db_dict() for job in jobs]
        count = await self.db.insert_jobs_batch(db_dicts)
        return count

    async def process(self, jobs: List[ScrapedJob]) -> ScrapingMetrics:
        """
        Run the full pipeline on a list of scraped jobs.

        Returns metrics for this batch.
        """
        start = time.time()
        self.metrics = ScrapingMetrics()
        self.metrics.jobs_found = len(jobs)

        # Step 1: Dedup
        await self._load_known_urls()
        unique_jobs = []
        for job in jobs:
            if self._is_duplicate(job):
                self.metrics.duplicates_skipped += 1
            else:
                unique_jobs.append(job)
                if job.source_url:
                    self._known_urls.add(job.source_url)

        logger.info({
            "event": "dedup_complete",
            "total": len(jobs),
            "unique": len(unique_jobs),
            "duped": self.metrics.duplicates_skipped,
        })

        if not unique_jobs:
            self.metrics.duration_seconds = time.time() - start
            return self.metrics

        # Step 2: Embed in batches
        for i in range(0, len(unique_jobs), self.batch_size):
            batch = unique_jobs[i : i + self.batch_size]
            await self._embed_batch(batch)

        # Step 3: Store in batches
        for i in range(0, len(unique_jobs), self.batch_size):
            batch = unique_jobs[i : i + self.batch_size]
            stored = await self._store_batch(batch)
            self.metrics.jobs_stored += stored

        self.metrics.duration_seconds = time.time() - start

        logger.info({
            "event": "pipeline_complete",
            **self.metrics.to_log_dict(),
        })

        return self.metrics
