#!/usr/bin/env python3
"""
embedder.py
Embedding generator with weighted field merging and batch processing.
"""

import asyncio
import logging
import time
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)


class GeminiBatcher:
    """
    Batches jobs and generates embeddings with rate limiting.
    
    Features:
    - Weighted field merging per requirements
    - Batch processing with configurable size
    - Concurrent batch processing
    - Rate limiting for API compliance
    """
    
    # Weighted text merging per requirements
    FIELD_WEIGHTS = {
        'job_title': 0.30,
        'skills_required': 0.25,
        'job_description': 0.30,
        'industry': 0.10,
        'company_name': 0.05,
    }
    
    def __init__(
        self,
        api_key: str,
        batch_size: int = 64,
        max_concurrent_batches: int = 5,
        rpm_limit: int = 15
    ):
        self.batch_size = batch_size
        self.max_concurrent_batches = max_concurrent_batches
        self.rpm_limit = rpm_limit
        self.min_interval = 60.0 / rpm_limit
        self.last_request_time = 0
        self._semaphore = asyncio.Semaphore(max_concurrent_batches)
        
        genai.configure(api_key=api_key)
        logger.info(
            f"GeminiBatcher initialized (batch_size={batch_size}, "
            f"max_concurrent={max_concurrent_batches}, rpm={rpm_limit})"
        )
    
    def _prepare_weighted_text(self, job: Dict[str, Any]) -> str:
        """
        Prepare weighted text for embedding using field weights.
        More important fields are repeated to increase their influence.
        """
        parts = []
        
        # Job title (30% weight - repeat 3x)
        title = job.get('job_title', '')
        if title:
            parts.extend([title] * 3)
        
        # Skills (25% weight - join and repeat 2.5x)
        skills = job.get('skills_required', [])
        if skills:
            skills_text = ', '.join(skills)
            parts.extend([skills_text] * 2)
            parts.append(skills_text[:len(skills_text)//2])  # 0.5x
        
        # Description (30% weight - add once, it's usually long)
        description = job.get('job_description', '')
        if description:
            # Take first 2000 chars of description
            parts.append(description[:2000])
        
        # Industry (10% weight)
        industry = job.get('industry', '')
        if industry:
            parts.append(industry)
        
        # Company (5% weight)
        company = job.get('company_name', '')
        if company:
            parts.append(company)
        
        combined = '\n'.join(parts)
        
        # Truncate to safe token limit (~8000 chars = ~2000 tokens)
        return combined[:8000]
    
    async def _wait_for_rate_limit(self):
        """Ensure we don't exceed RPM limit."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            wait_time = self.min_interval - elapsed
            logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
            await asyncio.sleep(wait_time)
        self.last_request_time = time.time()
    
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=4, max=60),
        retry=retry_if_exception_type(Exception)
    )
    async def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a batch of texts.
        Includes retry logic with exponential backoff.
        """
        async with self._semaphore:
            await self._wait_for_rate_limit()
            
            try:
                # Gemini API call
                result = genai.embed_content(
                    model="models/text-embedding-004",
                    content=texts,
                    task_type="retrieval_document"
                )
                
                # Handle response format
                if 'embedding' in result:
                    embeddings = result['embedding']
                    # Check if single embedding or batch
                    if isinstance(embeddings[0], float):
                        return [embeddings]
                    return embeddings
                else:
                    logger.error(f"Unexpected API response format: {result.keys()}")
                    return [[] for _ in texts]
                    
            except Exception as e:
                logger.error(f"Embedding API error: {e}")
                raise
    
    async def embed_batch(self, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Embed a batch of jobs using weighted field merging.
        Returns jobs with 'embedding' field added.
        """
        if not jobs:
            return []
        
        # Prepare weighted texts
        texts = [self._prepare_weighted_text(job) for job in jobs]
        
        logger.info(f"Generating embeddings for {len(texts)} jobs")
        
        try:
            # Process in sub-batches for API limits
            all_embeddings = []
            for i in range(0, len(texts), self.batch_size):
                batch_texts = texts[i:i + self.batch_size]
                batch_embeddings = await self._generate_embeddings(batch_texts)
                all_embeddings.extend(batch_embeddings)
            
            if len(all_embeddings) != len(jobs):
                logger.error(f"Embedding count mismatch: {len(all_embeddings)} != {len(jobs)}")
                # Fallback: generate one by one
                all_embeddings = []
                for text in texts:
                    emb = await self._generate_embeddings([text])
                    all_embeddings.append(emb[0] if emb else [])
            
            # Add embeddings to jobs
            for job, embedding in zip(jobs, all_embeddings):
                job['embedding'] = embedding if embedding else None
            
            successful = sum(1 for job in jobs if job.get('embedding'))
            logger.info(f"Successfully embedded {successful}/{len(jobs)} jobs")
            return jobs
            
        except Exception as e:
            logger.error(f"Failed to embed batch: {e}")
            # Return jobs without embeddings
            for job in jobs:
                job['embedding'] = None
            return jobs
    
    async def embed_jobs_from_db(
        self,
        jobs: List[Dict[str, Any]]
    ) -> List[tuple]:
        """
        Embed jobs fetched from database.
        Returns list of (job_id, embedding) tuples for batch update.
        """
        if not jobs:
            return []
        
        # Prepare texts
        texts = [self._prepare_weighted_text(job) for job in jobs]
        
        try:
            embeddings = await self._generate_embeddings(texts)
            
            # Pair job IDs with embeddings
            updates = []
            for job, embedding in zip(jobs, embeddings):
                if embedding:
                    updates.append((job['id'], embedding))
            
            return updates
            
        except Exception as e:
            logger.error(f"Failed to embed jobs from DB: {e}")
            return []


class EmbeddingWorker:
    """
    Background worker that continuously processes jobs without embeddings.
    """
    
    def __init__(
        self,
        database,
        embedder: GeminiBatcher,
        batch_size: int = 64,
        interval_seconds: int = 60
    ):
        self.db = database
        self.embedder = embedder
        self.batch_size = batch_size
        self.interval = interval_seconds
        self.running = False
    
    async def start(self):
        """Start the embedding worker loop."""
        self.running = True
        logger.info("Embedding worker started")
        
        while self.running:
            try:
                # Fetch jobs needing embeddings
                jobs = await self.db.get_jobs_without_embeddings(self.batch_size)
                
                if jobs:
                    logger.info(f"Processing {len(jobs)} jobs for embeddings")
                    
                    # Generate embeddings
                    updates = await self.embedder.embed_jobs_from_db(jobs)
                    
                    # Batch update database
                    if updates:
                        await self.db.update_embeddings_batch(updates)
                        logger.info(f"Updated {len(updates)} embeddings")
                else:
                    logger.debug("No jobs pending embeddings")
                
                # Wait before next check
                await asyncio.sleep(self.interval)
                
            except Exception as e:
                logger.error(f"Embedding worker error: {e}")
                await asyncio.sleep(self.interval)
    
    def stop(self):
        """Stop the embedding worker."""
        self.running = False
        logger.info("Embedding worker stopped")
