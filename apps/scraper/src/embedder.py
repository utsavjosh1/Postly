#!/usr/bin/env python3
"""
embedder.py
GeminiBatcher with rate limiting and retry logic.
"""

import asyncio
import logging
import time
from typing import List, Dict, Any
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

class GeminiBatcher:
    """
    Batches jobs and generates embeddings with rate limiting.
    Respects 15 RPM limit for Gemini API.
    """
    
    def __init__(self, api_key: str, batch_size: int = 50, rpm_limit: int = 15):
        self.batch_size = batch_size
        self.rpm_limit = rpm_limit
        self.min_interval = 60.0 / rpm_limit  # Seconds between requests
        self.last_request_time = 0
        
        genai.configure(api_key=api_key)
        logger.info(f"GeminiBatcher initialized (batch_size={batch_size}, rpm={rpm_limit})")
    
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
        Embed a batch of jobs.
        Returns jobs with 'embedding' field added.
        """
        if not jobs:
            return []
        
        # Prepare texts (title + description)
        texts = []
        for job in jobs:
            text = f"{job.get('title', '')}\n{job.get('description', '')}"
            # Truncate to safe token limit (~8000 chars = ~2000 tokens)
            texts.append(text[:8000])
        
        logger.info(f"Generating embeddings for {len(texts)} jobs")
        
        try:
            embeddings = await self._generate_embeddings(texts)
            
            if len(embeddings) != len(jobs):
                logger.error(f"Embedding count mismatch: {len(embeddings)} != {len(jobs)}")
                # Fallback: generate one by one
                embeddings = []
                for text in texts:
                    emb = await self._generate_embeddings([text])
                    embeddings.append(emb[0] if emb else [])
            
            # Add embeddings to jobs
            for job, embedding in zip(jobs, embeddings):
                job['embedding'] = embedding
            
            logger.info(f"Successfully embedded {len(jobs)} jobs")
            return jobs
            
        except Exception as e:
            logger.error(f"Failed to embed batch: {e}")
            # Return jobs without embeddings
            for job in jobs:
                job['embedding'] = None
            return jobs
