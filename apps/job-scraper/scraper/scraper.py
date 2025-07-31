"""Core scraping logic with concurrency and rate limiting."""

import asyncio
import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

import aiohttp
import httpx
from lxml import html

from .models import JobListing, SearchQuery, ScrapingResult
from .playwright_utils import PlaywrightScraper
from .supabase_client import supabase_client
from .config import config

logger = logging.getLogger(__name__)


class JobScraper:
    """Main job scraping orchestrator."""
    
    def __init__(self):
        """Initialize the job scraper."""
        self.rate_limiter = asyncio.Semaphore(config.RATE_LIMIT_REQUESTS_PER_MINUTE)
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    async def start(self) -> None:
        """Initialize HTTP session and resources."""
        try:
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            connector = aiohttp.TCPConnector(limit=config.MAX_CONCURRENT_REQUESTS)
            
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                connector=connector,
                headers={
                    'User-Agent': config.USER_AGENTS[0],
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            )
            
            logger.info("Job scraper initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize job scraper: {e}")
            raise
    
    async def close(self) -> None:
        """Clean up resources."""
        try:
            if self.session:
                await self.session.close()
            logger.info("Job scraper closed successfully")
        except Exception as e:
            logger.error(f"Error closing job scraper: {e}")
    
    async def scrape_jobs(self, queries: List[SearchQuery]) -> ScrapingResult:
        """Main method to scrape jobs from multiple sources."""
        start_time = time.time()
        all_jobs = []
        errors = []
        
        try:
            # Get existing job URLs to avoid duplicates
            existing_urls = await supabase_client.get_existing_job_urls()
            existing_urls_set = set(existing_urls)
            
            logger.info(f"Found {len(existing_urls_set)} existing jobs in database")
            
            # Scrape from each query
            for query in queries:
                try:
                    logger.info(f"Starting scrape for keywords: {query.keywords}")
                    
                    # Use Playwright for LinkedIn (JavaScript-heavy)
                    linkedin_jobs = await self._scrape_linkedin_with_playwright(query)
                    
                    # Filter out existing jobs
                    new_linkedin_jobs = [
                        job for job in linkedin_jobs 
                        if str(job.url) not in existing_urls_set
                    ]
                    
                    all_jobs.extend(new_linkedin_jobs)
                    logger.info(f"Found {len(new_linkedin_jobs)} new jobs for query: {query.keywords}")
                    
                    # Rate limiting between queries
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    error_msg = f"Error scraping query {query.keywords}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            # Remove duplicates based on URL
            unique_jobs = self._remove_duplicates(all_jobs)
            
            # Save jobs to database
            saved_count = 0
            if unique_jobs:
                saved_count = await supabase_client.save_jobs_batch(unique_jobs)
            
            # Calculate results
            duration = time.time() - start_time
            total_found = len(all_jobs)
            jobs_filtered = len(all_jobs) - len(unique_jobs)
            
            result = ScrapingResult(
                total_jobs_found=total_found,
                jobs_saved=saved_count,
                jobs_filtered=jobs_filtered,
                errors=errors,
                duration_seconds=duration
            )
            
            # Save scraping result for monitoring
            await supabase_client.save_scraping_result(result)
            
            logger.info(f"Scraping completed: {saved_count} jobs saved in {duration:.2f} seconds")
            return result
            
        except Exception as e:
            error_msg = f"Critical error in scraping process: {e}"
            logger.error(error_msg)
            errors.append(error_msg)
            
            return ScrapingResult(
                total_jobs_found=0,
                jobs_saved=0,
                jobs_filtered=0,
                errors=errors,
                duration_seconds=time.time() - start_time
            )
    
    async def _scrape_linkedin_with_playwright(self, query: SearchQuery) -> List[JobListing]:
        """Scrape LinkedIn using Playwright for JavaScript handling."""
        try:
            async with PlaywrightScraper() as scraper:
                jobs = await scraper.scrape_multiple_pages(query, max_pages=3)
                logger.info(f"Playwright scraping found {len(jobs)} LinkedIn jobs")
                return jobs
                
        except Exception as e:
            logger.error(f"Error in Playwright LinkedIn scraping: {e}")
            return []
    
    async def _scrape_static_sites(self, query: SearchQuery) -> List[JobListing]:
        """Scrape static job sites using httpx/aiohttp."""
        jobs = []
        
        # This would be expanded to include other job sites
        # For now, focusing on LinkedIn via Playwright
        
        try:
            # Example: scrape a hypothetical static job board
            # This is a placeholder for additional job sites
            pass
            
        except Exception as e:
            logger.error(f"Error scraping static sites: {e}")
        
        return jobs
    
    def _remove_duplicates(self, jobs: List[JobListing]) -> List[JobListing]:
        """Remove duplicate jobs based on URL."""
        seen_urls = set()
        unique_jobs = []
        
        for job in jobs:
            url_key = str(job.url)
            if url_key not in seen_urls:
                seen_urls.add(url_key)
                unique_jobs.append(job)
        
        logger.info(f"Removed {len(jobs) - len(unique_jobs)} duplicate jobs")
        return unique_jobs
    
    async def scrape_single_site(self, site_name: str, query: SearchQuery) -> List[JobListing]:
        """Scrape a specific job site."""
        if site_name.lower() == 'linkedin':
            return await self._scrape_linkedin_with_playwright(query)
        else:
            logger.warning(f"Unsupported site: {site_name}")
            return []
    
    async def get_job_statistics(self) -> Dict[str, Any]:
        """Get statistics about scraped jobs."""
        try:
            recent_jobs = await supabase_client.get_recent_jobs(hours=24)
            
            stats = {
                'total_jobs_24h': len(recent_jobs),
                'companies': len(set(job['company'] for job in recent_jobs)),
                'locations': len(set(job['location'] for job in recent_jobs)),
                'top_companies': self._get_top_companies(recent_jobs),
                'top_locations': self._get_top_locations(recent_jobs),
                'common_tags': self._get_common_tags(recent_jobs)
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting job statistics: {e}")
            return {}
    
    def _get_top_companies(self, jobs: List[Dict[str, Any]], limit: int = 10) -> List[Dict[str, Any]]:
        """Get top companies by job count."""
        company_counts = {}
        for job in jobs:
            company = job.get('company', '')
            company_counts[company] = company_counts.get(company, 0) + 1
        
        return [
            {'company': company, 'count': count}
            for company, count in sorted(company_counts.items(), 
                                       key=lambda x: x[1], reverse=True)[:limit]
        ]
    
    def _get_top_locations(self, jobs: List[Dict[str, Any]], limit: int = 10) -> List[Dict[str, Any]]:
        """Get top locations by job count."""
        location_counts = {}
        for job in jobs:
            location = job.get('location', '')
            location_counts[location] = location_counts.get(location, 0) + 1
        
        return [
            {'location': location, 'count': count}
            for location, count in sorted(location_counts.items(), 
                                        key=lambda x: x[1], reverse=True)[:limit]
        ]
    
    def _get_common_tags(self, jobs: List[Dict[str, Any]], limit: int = 15) -> List[Dict[str, Any]]:
        """Get most common tags."""
        tag_counts = {}
        for job in jobs:
            tags = job.get('tags', []) or []
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        return [
            {'tag': tag, 'count': count}
            for tag, count in sorted(tag_counts.items(), 
                                   key=lambda x: x[1], reverse=True)[:limit]
        ]


# Utility functions for easy access
async def run_daily_scrape() -> ScrapingResult:
    """Run a daily scraping operation with default parameters."""
    queries = [
        SearchQuery(
            keywords=['python', 'software engineer'],
            location='United States',
            max_results=50
        ),
        SearchQuery(
            keywords=['javascript', 'frontend', 'react'],
            location='United States',
            max_results=50
        ),
        SearchQuery(
            keywords=['data scientist', 'machine learning'],
            location='United States',
            max_results=30
        ),
        SearchQuery(
            keywords=['devops', 'cloud', 'aws'],
            location='United States',
            max_results=30
        )
    ]
    
    async with JobScraper() as scraper:
        return await scraper.scrape_jobs(queries)


async def run_custom_scrape(keywords: List[str], location: str = "United States", 
                           max_results: int = 100) -> ScrapingResult:
    """Run a custom scraping operation."""
    query = SearchQuery(
        keywords=keywords,
        location=location,
        max_results=max_results
    )
    
    async with JobScraper() as scraper:
        return await scraper.scrape_jobs([query])
