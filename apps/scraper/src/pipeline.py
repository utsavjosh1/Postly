#!/usr/bin/env python3
"""
pipeline.py
Simplified job processing pipeline: Scrape → Dedup → Embed → Store.

CHANGELOG:
- Removed self._known_urls global state to prevent infinite RAM leak
- Implemented scoped database existence checking per batch
- Optimized embedding calls to only run for genuinely new jobs
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
    1. Deduplication (by scoped DB check)
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

    async def _embed_batch(self, jobs: List[ScrapedJob]) -> List[ScrapedJob]:
        """Generate embeddings for a batch of jobs."""
        if not self.embedder or not jobs:
            return jobs

        # Pass ALL fields for comprehensive embeddings
        job_dicts = []
        for job in jobs:
            job_dicts.append({
                "job_title": job.title,
                "company_name": job.company_name,
                "job_description": job.description[:3000],
                "skills_required": job.skills_required or [],
                "location": job.location or "",
                "remote": job.remote,
                "job_type": job.job_type or "",
                "salary_min": float(job.salary_min) if job.salary_min else None,
                "salary_max": float(job.salary_max) if job.salary_max else None,
                "experience_required": job.experience_required or "",
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

        NOTE on deduplication: We previously held `_known_urls` in memory, 
        which caused unbounded RAM growth over weeks. The new approach queries 
        `source_url = ANY($1)` scoping existence checks strictly to the current batch.
        """
        start = time.time()
        self.metrics = ScrapingMetrics()
        self.metrics.jobs_found = len(jobs)

        # Step 1: Dedup
        urls = [j.source_url for j in jobs if j.source_url]
        existing_urls = await self.db.get_existing_urls(urls)
        
        unique_jobs = [j for j in jobs if j.source_url not in existing_urls]
        
        self.metrics.duplicates_skipped += len(jobs) - len(unique_jobs)

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
        # We only embed `unique_jobs` to avoid re-embedding jobs that already exist in DB
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
