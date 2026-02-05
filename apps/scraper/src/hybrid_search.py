#!/usr/bin/env python3
"""
hybrid_search.py
Hybrid search module combining vector and keyword search with weighted ranking.
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class HybridSearch:
    """
    Hybrid search combining vector similarity and keyword matching.
    
    Features:
    - Vector similarity search (pgvector)
    - Full-text keyword search (PostgreSQL tsvector)
    - Weighted ranking merge
    - Freshness scoring
    - Result caching
    """
    
    # Ranking weights per requirements
    DEFAULT_WEIGHTS = {
        'vector_similarity': 0.6,
        'keyword_match': 0.3,
        'freshness': 0.1,
    }
    
    def __init__(
        self,
        database,
        embedder,
        weights: Optional[Dict[str, float]] = None,
        cache_ttl_seconds: int = 300
    ):
        self.db = database
        self.embedder = embedder
        self.weights = weights or self.DEFAULT_WEIGHTS
        self.cache = {}
        self.cache_ttl = cache_ttl_seconds
    
    def _get_cache_key(self, query: str, filters: Optional[Dict] = None) -> str:
        """Generate cache key from query and filters."""
        filter_str = str(sorted(filters.items())) if filters else ''
        return f"{query}|{filter_str}"
    
    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Check if cache entry is still valid."""
        if not cache_entry:
            return False
        cached_at = cache_entry.get('cached_at')
        if not cached_at:
            return False
        age = (datetime.now() - cached_at).total_seconds()
        return age < self.cache_ttl
    
    def _calculate_freshness_score(self, posting_date: Optional[str]) -> float:
        """
        Calculate freshness score based on posting date.
        Newer jobs get higher scores.
        """
        if not posting_date:
            return 0.5  # Default for unknown dates
        
        try:
            if isinstance(posting_date, str):
                posted = datetime.strptime(posting_date, '%Y-%m-%d')
            else:
                posted = posting_date
            
            age_days = (datetime.now() - posted).days
            
            if age_days <= 1:
                return 1.0
            elif age_days <= 7:
                return 0.9
            elif age_days <= 14:
                return 0.7
            elif age_days <= 30:
                return 0.5
            else:
                return 0.3
                
        except Exception:
            return 0.5
    
    def _merge_results(
        self,
        vector_results: List[Dict],
        keyword_results: List[Dict],
        limit: int
    ) -> List[Dict]:
        """
        Merge vector and keyword results using weighted ranking.
        
        Algorithm:
        1. Normalize scores from each source
        2. Apply weights
        3. Add freshness bonus
        4. Sort by combined score
        """
        # Create lookup by job_id
        all_jobs = {}
        
        # Process vector results
        max_vector_score = max((r.get('similarity', 0) for r in vector_results), default=1)
        for rank, result in enumerate(vector_results):
            job_id = result.get('job_id')
            if not job_id:
                continue
            
            normalized_score = (result.get('similarity', 0) / max_vector_score) if max_vector_score > 0 else 0
            
            all_jobs[job_id] = {
                **result,
                'vector_score': normalized_score,
                'keyword_score': 0,
                'vector_rank': rank + 1,
            }
        
        # Process keyword results
        max_keyword_score = max((r.get('rank', 0) for r in keyword_results), default=1)
        for rank, result in enumerate(keyword_results):
            job_id = result.get('job_id')
            if not job_id:
                continue
            
            normalized_score = (result.get('rank', 0) / max_keyword_score) if max_keyword_score > 0 else 0
            
            if job_id in all_jobs:
                all_jobs[job_id]['keyword_score'] = normalized_score
                all_jobs[job_id]['keyword_rank'] = rank + 1
            else:
                all_jobs[job_id] = {
                    **result,
                    'vector_score': 0,
                    'keyword_score': normalized_score,
                    'keyword_rank': rank + 1,
                }
        
        # Calculate combined scores
        for job_id, job in all_jobs.items():
            freshness = self._calculate_freshness_score(job.get('posting_date'))
            
            combined_score = (
                self.weights['vector_similarity'] * job['vector_score'] +
                self.weights['keyword_match'] * job['keyword_score'] +
                self.weights['freshness'] * freshness
            )
            
            job['combined_score'] = combined_score
            job['freshness_score'] = freshness
        
        # Sort by combined score
        sorted_results = sorted(
            all_jobs.values(),
            key=lambda x: x['combined_score'],
            reverse=True
        )
        
        return sorted_results[:limit]
    
    async def search(
        self,
        query: str,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        use_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Perform hybrid search combining vector and keyword search.
        
        Args:
            query: Search query string
            limit: Maximum results to return
            filters: Optional filters (remote_only, industry, job_type)
            use_cache: Whether to use cached results
            
        Returns:
            List of job results ranked by combined score
        """
        # Check cache
        cache_key = self._get_cache_key(query, filters)
        if use_cache:
            cached = self.cache.get(cache_key)
            if self._is_cache_valid(cached):
                logger.debug(f"Cache hit for query: {query}")
                return cached['results'][:limit]
        
        logger.info(f"Hybrid search: {query}")
        
        try:
            # Generate query embedding
            query_embedding = None
            if self.embedder:
                embeddings = await self.embedder._generate_embeddings([query])
                if embeddings and embeddings[0]:
                    query_embedding = embeddings[0]
            
            # Run searches in parallel
            tasks = []
            
            # Vector search (if we have embedding)
            if query_embedding:
                tasks.append(
                    self.db.vector_search(query_embedding, limit * 2, filters)
                )
            else:
                tasks.append(asyncio.coroutine(lambda: [])())
            
            # Full-text search
            tasks.append(self.db.full_text_search(query, limit * 2))
            
            vector_results, keyword_results = await asyncio.gather(*tasks)
            
            # Merge results
            merged = self._merge_results(vector_results, keyword_results, limit)
            
            # Cache results
            self.cache[cache_key] = {
                'results': merged,
                'cached_at': datetime.now()
            }
            
            logger.info(f"Hybrid search returned {len(merged)} results")
            return merged
            
        except Exception as e:
            logger.error(f"Hybrid search error: {e}")
            # Fallback to keyword search only
            try:
                return await self.db.full_text_search(query, limit)
            except Exception:
                return []
    
    async def search_similar_jobs(
        self,
        job_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find jobs similar to a given job using its embedding.
        """
        try:
            # Get the job's embedding (would need to add this to database.py)
            # For now, this is a placeholder
            logger.info(f"Finding jobs similar to: {job_id}")
            return []
        except Exception as e:
            logger.error(f"Similar jobs search error: {e}")
            return []
    
    def clear_cache(self):
        """Clear the search cache."""
        self.cache.clear()
        logger.info("Search cache cleared")
    
    def update_weights(self, weights: Dict[str, float]):
        """Update ranking weights."""
        self.weights.update(weights)
        self.clear_cache()  # Invalidate cache when weights change
        logger.info(f"Search weights updated: {self.weights}")


class ChatbotRetriever:
    """
    Optimized retriever for chatbot use cases.
    
    Features:
    - Pre-computed summaries
    - Cached frequent queries
    - Minimal latency focus
    """
    
    def __init__(
        self,
        hybrid_search: HybridSearch,
        max_context_jobs: int = 5,
        max_description_length: int = 500
    ):
        self.search = hybrid_search
        self.max_context_jobs = max_context_jobs
        self.max_description_length = max_description_length
    
    def _format_job_for_context(self, job: Dict[str, Any]) -> str:
        """Format a job for chatbot context."""
        lines = []
        
        title = job.get('job_title', 'Unknown Position')
        company = job.get('company_name', 'Unknown Company')
        lines.append(f"**{title}** at {company}")
        
        if job.get('location'):
            lines.append(f"Location: {job['location']}")
        
        if job.get('salary_range'):
            lines.append(f"Salary: {job['salary_range']}")
        
        if job.get('remote_status') == 'remote':
            lines.append("🌍 Remote")
        
        if job.get('skills_required'):
            skills = ', '.join(job['skills_required'][:5])
            lines.append(f"Skills: {skills}")
        
        # Truncated description
        desc = job.get('job_description', '')
        if desc:
            truncated = desc[:self.max_description_length]
            if len(desc) > self.max_description_length:
                truncated += '...'
            lines.append(f"Description: {truncated}")
        
        if job.get('application_link'):
            lines.append(f"Apply: {job['application_link']}")
        
        return '\n'.join(lines)
    
    async def get_context_for_query(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Get formatted context string for chatbot response.
        
        Returns a structured string with relevant jobs.
        """
        jobs = await self.search.search(
            query,
            limit=self.max_context_jobs,
            filters=filters
        )
        
        if not jobs:
            return "No matching jobs found."
        
        context_parts = [f"Found {len(jobs)} relevant jobs:\n"]
        
        for i, job in enumerate(jobs, 1):
            context_parts.append(f"\n--- Job {i} ---")
            context_parts.append(self._format_job_for_context(job))
        
        return '\n'.join(context_parts)
    
    async def get_jobs_for_query(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get structured job data for chatbot.
        Returns lightweight job objects.
        """
        jobs = await self.search.search(
            query,
            limit=self.max_context_jobs,
            filters=filters
        )
        
        # Return lightweight version
        return [
            {
                'job_id': job.get('job_id'),
                'title': job.get('job_title'),
                'company': job.get('company_name'),
                'location': job.get('location'),
                'salary': job.get('salary_range'),
                'remote': job.get('remote_status') == 'remote',
                'skills': job.get('skills_required', [])[:5],
                'apply_url': job.get('application_link'),
                'score': job.get('combined_score', 0),
            }
            for job in jobs
        ]
