#!/usr/bin/env python3
"""
pipeline.py
Scrapy pipeline orchestrating Cleanser → Deduper → Embedder → Database flow.
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import json

from models import ProcessedJob, JobListing, ScrapingMetrics, generate_fingerprint
from cleanser import cleanse_html, cleanse_api_content
from middlewares.deduplication import DeduplicationMiddleware
from embedding_service import VoyageEmbeddingService

logger = logging.getLogger(__name__)


class JobProcessingPipeline:
    """
    Main processing pipeline for scraped jobs.
    
    Flow:
    1. Cleanser: HTML → Clean Markdown
    2. Deduper: SHA-256 fingerprint check (BEFORE embedding to save costs)
    3. Embedder: Voyage AI embedding (skipped if duplicate)
    4. Database: asyncpg batch insert
    
    This pipeline is designed to minimize API costs by checking
    for duplicates before calling the embedding service.
    """
    
    def __init__(
        self,
        database,
        embedding_service: Optional[VoyageEmbeddingService] = None,
        batch_size: int = 50,
    ):
        """
        Initialize the processing pipeline.
        
        Args:
            database: Database instance with asyncpg pool
            embedding_service: Optional VoyageEmbeddingService
            batch_size: Batch size for database operations
        """
        self.db = database
        self.embedder = embedding_service
        self.batch_size = batch_size
        
        # Initialize deduplication middleware
        self.deduper = DeduplicationMiddleware(database)
        
        # Pipeline metrics
        self.metrics = {
            'jobs_received': 0,
            'jobs_cleaned': 0,
            'duplicates_skipped': 0,
            'jobs_embedded': 0,
            'jobs_stored': 0,
            'errors': 0,
            'tokens_consumed': 0,
        }
    
    async def _clean_job(self, job: JobListing) -> Optional[Dict[str, Any]]:
        """
        Stage 1: Clean and validate job content.
        
        Uses trafilatura for HTML sources, lighter cleaning for API sources.
        """
        try:
            # Determine cleaning method based on source
            if job.description_clean:
                # API source with pre-cleaned content
                cleaned = cleanse_api_content(job.description_clean, job.source)
            elif job.raw_html:
                # HTML source needs full cleaning
                cleaned = cleanse_html(job.raw_html, job.source)
            elif job.job_description:
                # Already has description, minimal cleaning
                cleaned = cleanse_api_content(job.job_description, job.source)
            else:
                logger.warning(f"Job has no content to clean: {job.url}")
                return None
            
            if not cleaned or len(cleaned) < 100:
                logger.info({
                    "event": "job_rejected",
                    "reason": "content_too_short",
                    "source": job.source,
                    "url": job.url,
                })
                return None
            
            self.metrics['jobs_cleaned'] += 1
            
            return {
                'job_title': job.job_title,
                'company_name': job.company_name,
                'location': job.location,
                'job_description': cleaned,
                'salary_range': job.salary_range,
                'job_type': job.job_type,
                'remote_status': job.remote_status or 'unknown',
                'application_link': job.application_link or job.url,
                'job_source': job.source,
                'scraped_at': job.scraped_at,
                'url': job.url,
            }
            
        except Exception as e:
            logger.error(f"Cleaning error: {e}")
            self.metrics['errors'] += 1
            return None
    
    async def _deduplicate_job(self, job_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Stage 2: Check for duplicates using SHA-256 fingerprint.
        
        This runs BEFORE embedding to avoid costly API calls for duplicates.
        """
        try:
            should_process, fingerprint = await self.deduper.process_job(job_data)
            
            if not should_process:
                self.metrics['duplicates_skipped'] += 1
                logger.info({
                    "event": "duplicate_skipped",
                    "fingerprint": fingerprint[:12],
                    "title": job_data.get('job_title'),
                    "source": job_data.get('job_source'),
                })
                return None
            
            # Add fingerprint to job data
            job_data['fingerprint'] = fingerprint
            
            # Generate job_id from fingerprint
            job_data['job_id'] = fingerprint[:16]
            
            return job_data
            
        except Exception as e:
            logger.error(f"Deduplication error: {e}")
            self.metrics['errors'] += 1
            return None
    
    async def _embed_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Stage 3: Generate embedding using Voyage AI.
        
        Only called for non-duplicate jobs.
        """
        if not self.embedder:
            logger.debug("No embedding service configured, skipping embeddings")
            job_data['embedding'] = None
            return job_data
        
        try:
            # Embed single job
            embedded_jobs = await self.embedder.embed_jobs([job_data])
            
            if embedded_jobs and embedded_jobs[0].get('embedding'):
                self.metrics['jobs_embedded'] += 1
                self.metrics['tokens_consumed'] = self.embedder.total_tokens_consumed
                return embedded_jobs[0]
            else:
                job_data['embedding'] = None
                return job_data
                
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            self.metrics['errors'] += 1
            job_data['embedding'] = None
            return job_data
    
    async def _store_job(self, job_data: Dict[str, Any]) -> bool:
        """
        Stage 4: Store job in database.
        """
        try:
            # Create ProcessedJob for validation
            processed = ProcessedJob(
                fingerprint=job_data['fingerprint'],
                job_id=job_data['job_id'],
                job_title=job_data['job_title'],
                job_description=job_data['job_description'],
                application_link=job_data['application_link'],
                job_source=job_data['job_source'],
                company_name=job_data.get('company_name'),
                normalized_location=job_data.get('location'),
                job_type=job_data.get('job_type'),
                salary_range=job_data.get('salary_range'),
                remote_status=job_data.get('remote_status', 'unknown'),
                embedding=job_data.get('embedding'),
            )
            
            # Insert into database
            success = await self.db.insert_job(processed.model_dump())
            
            if success:
                self.metrics['jobs_stored'] += 1
                logger.debug({
                    "event": "job_stored",
                    "job_id": processed.job_id,
                    "title": processed.job_title,
                })
            
            return success
            
        except Exception as e:
            logger.error(f"Storage error: {e}")
            self.metrics['errors'] += 1
            return False
    
    async def process_job(self, job: JobListing) -> bool:
        """
        Process a single job through the full pipeline.
        
        Args:
            job: Raw JobListing from spider
            
        Returns:
            True if job was stored successfully
        """
        self.metrics['jobs_received'] += 1
        
        # Stage 1: Clean
        cleaned = await self._clean_job(job)
        if not cleaned:
            return False
        
        # Stage 2: Deduplicate (BEFORE embedding!)
        deduped = await self._deduplicate_job(cleaned)
        if not deduped:
            return False
        
        # Stage 3: Embed
        embedded = await self._embed_job(deduped)
        
        # Stage 4: Store
        return await self._store_job(embedded)
    
    async def process_batch(self, jobs: List[JobListing]) -> int:
        """
        Process a batch of jobs efficiently.
        
        Optimizes embedding by batching non-duplicate jobs together.
        
        Args:
            jobs: List of JobListing objects
            
        Returns:
            Number of jobs stored successfully
        """
        logger.info({
            "event": "batch_processing_start",
            "count": len(jobs),
        })
        
        start_time = datetime.utcnow()
        stored_count = 0
        
        # Stage 1 & 2: Clean and deduplicate all jobs first
        jobs_to_embed = []
        
        for job in jobs:
            self.metrics['jobs_received'] += 1
            
            # Clean
            cleaned = await self._clean_job(job)
            if not cleaned:
                continue
            
            # Deduplicate
            deduped = await self._deduplicate_job(cleaned)
            if not deduped:
                continue
            
            jobs_to_embed.append(deduped)
        
        if not jobs_to_embed:
            logger.info("No jobs passed cleaning and deduplication")
            return 0
        
        # Stage 3: Batch embed all non-duplicates
        if self.embedder and jobs_to_embed:
            logger.info(f"Embedding {len(jobs_to_embed)} non-duplicate jobs")
            embedded_jobs = await self.embedder.embed_jobs(jobs_to_embed)
            self.metrics['jobs_embedded'] += len([j for j in embedded_jobs if j.get('embedding')])
            self.metrics['tokens_consumed'] = self.embedder.total_tokens_consumed
        else:
            embedded_jobs = jobs_to_embed
        
        # Stage 4: Batch store
        for job_data in embedded_jobs:
            if await self._store_job(job_data):
                stored_count += 1
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        logger.info({
            "event": "batch_processing_complete",
            "jobs_received": len(jobs),
            "jobs_stored": stored_count,
            "duplicates_skipped": self.metrics['duplicates_skipped'],
            "jobs_embedded": self.metrics['jobs_embedded'],
            "tokens_consumed": self.metrics['tokens_consumed'],
            "duration_seconds": round(duration, 2),
        })
        
        return stored_count
    
    def get_metrics(self) -> ScrapingMetrics:
        """Get pipeline metrics as structured object."""
        return ScrapingMetrics(
            source="pipeline",
            event="metrics",
            jobs_found=self.metrics['jobs_received'],
            jobs_embedded=self.metrics['jobs_embedded'],
            duplicates_skipped=self.metrics['duplicates_skipped'],
            tokens_consumed=self.metrics['tokens_consumed'],
            errors=self.metrics['errors'],
        )
    
    def reset_metrics(self):
        """Reset pipeline metrics."""
        self.metrics = {
            'jobs_received': 0,
            'jobs_cleaned': 0,
            'duplicates_skipped': 0,
            'jobs_embedded': 0,
            'jobs_stored': 0,
            'errors': 0,
            'tokens_consumed': 0,
        }
        self.deduper.clear_cache()


class ScrapyPipelineAdapter:
    """
    Scrapy pipeline adapter for integrating with Scrapy's item processing.
    
    Usage in Scrapy settings:
        ITEM_PIPELINES = {
            'pipeline.ScrapyPipelineAdapter': 300,
        }
    """
    
    def __init__(self, database, embedding_service):
        self.pipeline = JobProcessingPipeline(database, embedding_service)
        self._batch = []
        self._batch_size = 50
    
    @classmethod
    def from_crawler(cls, crawler):
        """Create from Scrapy crawler."""
        # Get database and embedding service from crawler settings
        database = crawler.settings.get('DATABASE')
        embedding_service = crawler.settings.get('EMBEDDING_SERVICE')
        return cls(database, embedding_service)
    
    async def process_item(self, item, spider):
        """Process a Scrapy item."""
        # Convert item to JobListing
        if isinstance(item, dict):
            job = JobListing(**item)
        elif isinstance(item, JobListing):
            job = item
        else:
            return item
        
        # Add to batch
        self._batch.append(job)
        
        # Process batch when full
        if len(self._batch) >= self._batch_size:
            await self.pipeline.process_batch(self._batch)
            self._batch = []
        
        return item
    
    async def close_spider(self, spider):
        """Process remaining items when spider closes."""
        if self._batch:
            await self.pipeline.process_batch(self._batch)
            self._batch = []
        
        # Log final metrics
        logger.info({
            "event": "spider_pipeline_complete",
            "spider": spider.name,
            "metrics": self.pipeline.get_metrics().to_log_dict(),
        })
