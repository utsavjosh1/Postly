#!/usr/bin/env python3
"""
hiring_cafe.py
aiohttp-based spider for Hiring Cafe API with recursive pagination.
"""

import asyncio
import logging
from typing import AsyncIterator, Optional, Dict, Any, List
from datetime import datetime
import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import JobListing
from cleanser import cleanse_api_content

logger = logging.getLogger(__name__)


class HiringCafeSpider:
    """
    aiohttp-based spider for Hiring Cafe API.
    
    Features:
    - Recursive pagination handling
    - Direct extraction of description_clean field
    - Rate limiting with tenacity retries
    - Structured logging
    """
    
    # Hiring Cafe API configuration
    BASE_URL = "https://api.hiring.cafe/api/v1/jobs"  # Placeholder - update with actual endpoint
    
    # Default search parameters
    DEFAULT_PARAMS = {
        "limit": 50,
        "offset": 0,
    }
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        max_pages: int = 100,
        requests_per_minute: int = 30,
    ):
        """
        Initialize Hiring Cafe spider.
        
        Args:
            api_key: Optional API key for authentication
            base_url: Override base URL if needed
            max_pages: Maximum pages to scrape (safety limit)
            requests_per_minute: Rate limit
        """
        self.api_key = api_key
        self.base_url = base_url or self.BASE_URL
        self.max_pages = max_pages
        self.min_interval = 60.0 / requests_per_minute
        self.last_request_time = 0
        
        self._session: Optional[aiohttp.ClientSession] = None
        
        # Metrics
        self.jobs_found = 0
        self.pages_scraped = 0
        self.errors = 0
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._session is None or self._session.closed:
            headers = {
                "Accept": "application/json",
                "User-Agent": "Postly Job Aggregator/1.0",
            }
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            self._session = aiohttp.ClientSession(
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            )
        return self._session
    
    async def _rate_limit(self):
        """Enforce rate limiting."""
        import time
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            await asyncio.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError))
    )
    async def _fetch_page(
        self,
        params: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch a single page from the API.
        
        Args:
            params: Query parameters including offset/limit
            
        Returns:
            JSON response or None on failure
        """
        await self._rate_limit()
        
        session = await self._get_session()
        
        try:
            async with session.get(self.base_url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 429:
                    # Rate limited - wait and retry
                    retry_after = int(response.headers.get('Retry-After', 60))
                    logger.warning(f"Rate limited, waiting {retry_after}s")
                    await asyncio.sleep(retry_after)
                    raise aiohttp.ClientError("Rate limited")
                else:
                    logger.error(f"API returned {response.status}")
                    self.errors += 1
                    return None
                    
        except Exception as e:
            logger.error(f"Fetch error: {e}")
            self.errors += 1
            raise
    
    async def _paginate(
        self,
        search_params: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Recursively paginate through API results.
        
        Args:
            search_params: Additional search filters
            
        Yields:
            Page response dictionaries
        """
        params = {**self.DEFAULT_PARAMS}
        if search_params:
            params.update(search_params)
        
        offset = 0
        page_num = 0
        
        while page_num < self.max_pages:
            params["offset"] = offset
            
            logger.info(f"Fetching page {page_num + 1} (offset={offset})")
            
            page_data = await self._fetch_page(params)
            
            if not page_data:
                break
            
            jobs = page_data.get("jobs", page_data.get("data", []))
            
            if not jobs:
                logger.info("No more jobs found, pagination complete")
                break
            
            yield page_data
            
            self.pages_scraped += 1
            page_num += 1
            offset += params.get("limit", 50)
            
            # Check for pagination metadata
            total = page_data.get("total", page_data.get("meta", {}).get("total"))
            if total and offset >= total:
                logger.info(f"Reached end of results ({total} total)")
                break
    
    def _parse_job(self, job_data: Dict[str, Any]) -> Optional[JobListing]:
        """
        Parse a job from API response into JobListing.
        
        Args:
            job_data: Raw job object from API
            
        Returns:
            JobListing or None if parsing fails
        """
        try:
            # Extract description - prefer description_clean if available
            description = job_data.get("description_clean") or job_data.get("description", "")
            
            # Clean the description
            cleaned_description = cleanse_api_content(description, "hiring_cafe")
            
            # Map API fields to JobListing
            job = JobListing(
                url=job_data.get("url", job_data.get("apply_url", "")),
                source="hiring_cafe",
                scraped_at=datetime.utcnow(),
                job_title=job_data.get("title", job_data.get("job_title")),
                company_name=job_data.get("company", job_data.get("company_name")),
                location=job_data.get("location"),
                job_description=cleaned_description,
                salary_range=job_data.get("salary", job_data.get("salary_range")),
                job_type=job_data.get("employment_type", job_data.get("job_type")),
                remote_status=self._parse_remote_status(job_data),
                application_link=job_data.get("apply_url", job_data.get("url")),
                description_clean=job_data.get("description_clean"),
            )
            
            return job
            
        except Exception as e:
            logger.error(f"Failed to parse job: {e}")
            self.errors += 1
            return None
    
    def _parse_remote_status(self, job_data: Dict[str, Any]) -> str:
        """Parse remote status from job data."""
        remote = job_data.get("remote", job_data.get("is_remote"))
        if remote is True or str(remote).lower() in ("true", "yes", "remote"):
            return "remote"
        
        location = str(job_data.get("location", "")).lower()
        if "remote" in location:
            return "remote"
        if "hybrid" in location:
            return "hybrid"
        
        return "unknown"
    
    async def scrape(
        self,
        search_params: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[JobListing]:
        """
        Scrape jobs from Hiring Cafe API.
        
        Args:
            search_params: Optional search filters (keywords, location, etc.)
            
        Yields:
            JobListing objects
        """
        logger.info({
            "event": "scrape_start",
            "source": "hiring_cafe",
            "params": search_params,
        })
        
        start_time = datetime.utcnow()
        
        try:
            async for page in self._paginate(search_params):
                jobs = page.get("jobs", page.get("data", []))
                
                for job_data in jobs:
                    job = self._parse_job(job_data)
                    if job:
                        self.jobs_found += 1
                        yield job
                        
        finally:
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.info({
                "event": "scrape_complete",
                "source": "hiring_cafe",
                "jobs_found": self.jobs_found,
                "pages_scraped": self.pages_scraped,
                "errors": self.errors,
                "duration_seconds": round(duration, 2),
            })
    
    async def scrape_all(
        self,
        search_params: Optional[Dict[str, Any]] = None
    ) -> List[JobListing]:
        """
        Scrape all jobs and return as list.
        
        Args:
            search_params: Optional search filters
            
        Returns:
            List of JobListing objects
        """
        jobs = []
        async for job in self.scrape(search_params):
            jobs.append(job)
        return jobs
    
    async def close(self):
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
            logger.info("Hiring Cafe spider session closed")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get scraping metrics."""
        return {
            "source": "hiring_cafe",
            "jobs_found": self.jobs_found,
            "pages_scraped": self.pages_scraped,
            "errors": self.errors,
        }
