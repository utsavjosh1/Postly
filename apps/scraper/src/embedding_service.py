#!/usr/bin/env python3
"""
embedding_service.py
Voyage AI embedding client with rate-limiting and batch processing.
"""

import asyncio
import logging
import time
import os
from typing import List, Optional, Dict, Any
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

logger = logging.getLogger(__name__)

# Try to import voyageai - handle gracefully if not installed
try:
    import voyageai
    VOYAGE_AVAILABLE = True
except ImportError:
    VOYAGE_AVAILABLE = False
    logger.warning("voyageai package not installed. Run: pip install voyageai")


class VoyageEmbeddingService:
    """
    Dedicated Voyage AI embedding client with production features.
    
    Features:
    - voyage-3.5-lite model (1024 dimensions)
    - Built-in rate limiting (300 RPM max)
    - Batch processing (128 texts per request max)
    - Tenacity retry with exponential backoff
    - Token consumption tracking
    """
    
    # Voyage AI limits
    MODEL = os.getenv("VOYAGE_MODEL", "voyage-3.5-lite")
    EMBEDDING_DIM = 1024
    MAX_BATCH_SIZE = 128
    MAX_RPM = 300
    MAX_TOKENS_PER_REQUEST = 120000  # Approximate limit
    
    def __init__(
        self,
        api_key: str,
        model: Optional[str] = None,
        max_rpm: int = 300,
        max_batch_size: int = 128,
    ):
        """
        Initialize Voyage AI embedding service.
        
        Args:
            api_key: Voyage AI API key
            model: Model name (default: voyage-3.5-lite)
            max_rpm: Maximum requests per minute
            max_batch_size: Maximum texts per API call
        """
        if not VOYAGE_AVAILABLE:
            raise ImportError(
                "voyageai package is required. Install with: pip install voyageai"
            )
        
        self.api_key = api_key
        self.model = model or self.MODEL
        self.max_rpm = max_rpm
        self.max_batch_size = min(max_batch_size, self.MAX_BATCH_SIZE)
        
        # Initialize client
        self.client = voyageai.Client(api_key=api_key)
        
        # Rate limiting
        self.min_interval = 60.0 / max_rpm
        self.last_request_time = 0
        self._semaphore = asyncio.Semaphore(5)  # Max concurrent requests
        
        # Metrics
        self.total_tokens_consumed = 0
        self.total_requests = 0
        self.total_embeddings = 0
        
        logger.info({
            "event": "embedding_service_initialized",
            "model": self.model,
            "max_rpm": max_rpm,
            "max_batch_size": self.max_batch_size,
        })
    
    async def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            wait_time = self.min_interval - elapsed
            await asyncio.sleep(wait_time)
        self.last_request_time = time.time()
    
    def _prepare_text(self, job: Dict[str, Any]) -> str:
        """
        Prepare weighted text for embedding.
        
        Uses weighted field merging for better embedding quality:
        - Job title (30%) - repeated for emphasis
        - Skills (25%)
        - Description (30%) - truncated
        - Industry (10%)
        - Company (5%)
        """
        parts = []
        
        # Job title (high weight - repeat 3x)
        title = job.get('job_title', '')
        if title:
            parts.extend([title] * 3)
        
        # Skills (medium-high weight)
        skills = job.get('skills_required', [])
        if skills:
            if isinstance(skills, list):
                skills_text = ', '.join(skills)
            else:
                skills_text = str(skills)
            parts.extend([skills_text] * 2)
        
        # Description (high weight but truncate)
        description = job.get('job_description', '')
        if description:
            # Take first 3000 chars to stay within token limits
            parts.append(description[:3000])
        
        # Industry (low weight)
        industry = job.get('industry', '')
        if industry:
            parts.append(industry)
        
        # Company (lowest weight)
        company = job.get('company_name', '')
        if company:
            parts.append(company)
        
        combined = '\n'.join(parts)
        
        # Truncate to safe limit (~30k chars ≈ 8k tokens)
        return combined[:30000]
    
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=4, max=120),
        retry=retry_if_exception_type((Exception,)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
    )
    async def _embed_batch_request(
        self,
        texts: List[str],
        input_type: str = "document"
    ) -> List[List[float]]:
        """
        Make a single batch embedding request to Voyage AI.
        
        Args:
            texts: List of texts to embed
            input_type: "document" for job content, "query" for search
            
        Returns:
            List of embedding vectors (1024-dim each)
        """
        async with self._semaphore:
            await self._rate_limit()
            
            try:
                # Voyage AI client is sync, run in executor
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    None,
                    lambda: self.client.embed(
                        texts=texts,
                        model=self.model,
                        input_type=input_type,
                    )
                )
                
                # Track metrics
                self.total_requests += 1
                self.total_embeddings += len(texts)
                if hasattr(result, 'total_tokens'):
                    self.total_tokens_consumed += result.total_tokens
                
                logger.debug({
                    "event": "embedding_batch_complete",
                    "texts": len(texts),
                    "tokens": getattr(result, 'total_tokens', 0),
                })
                
                return result.embeddings
                
            except Exception as e:
                logger.error(f"Voyage AI embedding error: {e}")
                raise
    
    async def embed_single(self, text: str, input_type: str = "document") -> List[float]:
        """
        Embed a single text.
        
        Args:
            text: Text to embed
            input_type: "document" or "query"
            
        Returns:
            1024-dimensional embedding vector
        """
        embeddings = await self._embed_batch_request([text], input_type)
        return embeddings[0] if embeddings else []
    
    async def embed_batch(
        self,
        texts: List[str],
        input_type: str = "document"
    ) -> List[List[float]]:
        """
        Embed a batch of texts with automatic chunking.
        
        Args:
            texts: List of texts to embed
            input_type: "document" or "query"
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        all_embeddings = []
        
        # Process in chunks respecting max batch size
        for i in range(0, len(texts), self.max_batch_size):
            chunk = texts[i:i + self.max_batch_size]
            embeddings = await self._embed_batch_request(chunk, input_type)
            all_embeddings.extend(embeddings)
        
        return all_embeddings
    
    async def embed_jobs(
        self,
        jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Embed a list of job dictionaries.
        
        Args:
            jobs: List of job dicts with job_title, job_description, etc.
            
        Returns:
            Jobs with 'embedding' field added
        """
        if not jobs:
            return []
        
        # Prepare texts
        texts = [self._prepare_text(job) for job in jobs]
        
        logger.info({
            "event": "embedding_jobs_start",
            "count": len(jobs),
        })
        
        try:
            embeddings = await self.embed_batch(texts)
            
            # Add embeddings to jobs
            for job, embedding in zip(jobs, embeddings):
                job['embedding'] = embedding if embedding else None
            
            successful = sum(1 for job in jobs if job.get('embedding'))
            
            logger.info({
                "event": "embedding_jobs_complete",
                "total": len(jobs),
                "successful": successful,
                "tokens_consumed": self.total_tokens_consumed,
            })
            
            return jobs
            
        except Exception as e:
            logger.error(f"Failed to embed jobs: {e}")
            # Return jobs without embeddings rather than failing entirely
            for job in jobs:
                job['embedding'] = None
            return jobs
    
    async def embed_query(self, query: str) -> List[float]:
        """
        Embed a search query.
        
        Uses "query" input type for optimal search performance.
        """
        return await self.embed_single(query, input_type="query")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get service metrics."""
        return {
            "model": self.model,
            "total_requests": self.total_requests,
            "total_embeddings": self.total_embeddings,
            "total_tokens_consumed": self.total_tokens_consumed,
            "embedding_dimension": self.EMBEDDING_DIM,
        }


class EmbeddingWorker:
    """
    Background worker that processes jobs without embeddings.
    
    Runs continuously to catch any jobs that were inserted
    without embeddings due to errors or rate limits.
    """
    
    def __init__(
        self,
        database,
        embedding_service: VoyageEmbeddingService,
        batch_size: int = 50,
        interval_seconds: int = 60,
    ):
        """
        Initialize embedding worker.
        
        Args:
            database: Database instance
            embedding_service: VoyageEmbeddingService instance
            batch_size: Jobs to process per cycle
            interval_seconds: Time between cycles
        """
        self.db = database
        self.embedder = embedding_service
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
                    embedded_jobs = await self.embedder.embed_jobs(jobs)
                    
                    # Batch update database
                    updates = [
                        (job['id'], job['embedding'])
                        for job in embedded_jobs
                        if job.get('embedding')
                    ]
                    
                    if updates:
                        await self.db.update_embeddings_batch(updates)
                        logger.info(f"Updated {len(updates)} embeddings")
                else:
                    logger.debug("No jobs pending embeddings")
                
                await asyncio.sleep(self.interval)
                
            except Exception as e:
                logger.error(f"Embedding worker error: {e}")
                await asyncio.sleep(self.interval)
    
    def stop(self):
        """Stop the embedding worker."""
        self.running = False
        logger.info("Embedding worker stopped")
