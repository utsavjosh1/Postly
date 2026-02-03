#!/usr/bin/env python3
"""
scraper.py
Production-grade job scraper with multi-stage validation.
"""

import asyncio
import logging
import re
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse
from playwright.async_api import async_playwright, Browser, Page
import trafilatura
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class JobScraper:
    """
    Intelligent job scraper with multi-stage validation pipeline.
    
    Validation Stages:
    1. URL validation (pattern matching)
    2. HTML validation (check for job indicators)
    3. Extraction validation (content quality)
    4. Semantic validation (job-related keywords)
    """
    
    # JUNK PATTERNS - These indicate non-job content
    JUNK_PATTERNS = re.compile(
        r'(View Company Profile|Apply Now|Login|Sign In|Sign Up|'
        r'Cookie Policy|Privacy Policy|Terms of Service|'
        r'404|Page Not Found|Access Denied|'
        r'Enable JavaScript|Browser Not Supported|'
        r'Subscribe|Newsletter|Follow Us)',
        re.IGNORECASE
    )
    
    # JOB INDICATORS - Real job postings should have these
    JOB_KEYWORDS = [
        'responsibilities', 'requirements', 'qualifications', 'experience',
        'salary', 'benefits', 'apply', 'position', 'role', 'team',
        'skills', 'education', 'location', 'remote', 'full-time', 'part-time'
    ]
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.seen_urls = set()
    
    async def start(self):
        """Initialize browser."""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        logger.info("Browser initialized")
    
    async def close(self):
        """Close browser."""
        if self.browser:
            await self.browser.close()
            logger.info("Browser closed")
    
    def _validate_url(self, url: str) -> bool:
        """Stage 1: Validate URL pattern."""
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return False
            
            # Skip obvious non-job URLs
            skip_patterns = ['login', 'signup', 'privacy', 'terms', 'cookie']
            if any(pattern in url.lower() for pattern in skip_patterns):
                logger.debug(f"Skipping non-job URL: {url}")
                return False
            
            return True
        except Exception as e:
            logger.error(f"URL validation error: {e}")
            return False
    
    def _validate_html(self, html: str) -> bool:
        """Stage 2: Check if HTML contains job indicators."""
        soup = BeautifulSoup(html, 'lxml')
        text = soup.get_text().lower()
        
        # Must have at least 2 job keywords
        keyword_count = sum(1 for keyword in self.JOB_KEYWORDS if keyword in text)
        if keyword_count < 2:
            logger.debug("HTML lacks job indicators")
            return False
        
        return True
    
    def _extract_structured_data(self, html: str, url: str) -> Optional[Dict[str, Any]]:
        """
        Stage 3: Extract structured job data with validation.
        
        This is the CRITICAL stage where we prevent junk data.
        """
        try:
            # Use Trafilatura for main content extraction
            extracted_text = trafilatura.extract(
                html,
                include_comments=False,
                include_tables=False,
                include_images=False,
                no_fallback=False  # Allow fallback for better coverage
            )
            
            if not extracted_text:
                logger.debug(f"Trafilatura extraction failed for {url}")
                return None
            
            # Get metadata
            metadata = trafilatura.extract_metadata(html)
            title = metadata.title if metadata and metadata.title else None
            
            # Fallback: Try to extract title from HTML
            if not title:
                soup = BeautifulSoup(html, 'lxml')
                title_tag = soup.find('h1') or soup.find('title')
                title = title_tag.get_text().strip() if title_tag else None
            
            if not title:
                logger.debug("No title found")
                return None
            
            # CRITICAL: Validate title is not junk
            if self.JUNK_PATTERNS.search(title):
                logger.info(f"REJECTED - Junk title detected: {title}")
                return None
            
            # CRITICAL: Validate description is not junk
            if self.JUNK_PATTERNS.search(extracted_text):
                logger.info(f"REJECTED - Junk content detected in: {title}")
                return None
            
            # Validate content length
            word_count = len(extracted_text.split())
            if word_count < 50:
                logger.info(f"REJECTED - Too short ({word_count} words): {title}")
                return None
            
            # Extract additional fields using BeautifulSoup
            soup = BeautifulSoup(html, 'lxml')
            
            # Try to extract company name
            company = None
            company_selectors = [
                'span[class*="company"]',
                'div[class*="company"]',
                'a[class*="company"]',
                '[itemprop="hiringOrganization"]'
            ]
            for selector in company_selectors:
                elem = soup.select_one(selector)
                if elem:
                    company = elem.get_text().strip()
                    break
            
            # Try to extract salary
            salary = None
            salary_patterns = re.compile(r'\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per|/)\s*(?:year|hour|month))?', re.IGNORECASE)
            salary_match = salary_patterns.search(extracted_text)
            if salary_match:
                salary = salary_match.group(0)
            
            # Try to extract location
            location = None
            location_selectors = [
                'span[class*="location"]',
                'div[class*="location"]',
                '[itemprop="jobLocation"]'
            ]
            for selector in location_selectors:
                elem = soup.select_one(selector)
                if elem:
                    location = elem.get_text().strip()
                    break
            
            # Check for remote
            remote = bool(re.search(r'\b(remote|work from home|wfh)\b', extracted_text, re.IGNORECASE))
            
            return {
                'title': title.strip(),
                'company': company,
                'description': extracted_text.strip(),
                'url': url,
                'salary': salary,
                'location': location,
                'remote': remote,
                'meta': {
                    'word_count': word_count,
                    'extraction_method': 'trafilatura'
                }
            }
            
        except Exception as e:
            logger.error(f"Extraction error for {url}: {e}")
            return None
    
    def _validate_semantic(self, job_data: Dict[str, Any]) -> bool:
        """Stage 4: Semantic validation - ensure it's actually a job posting."""
        description = job_data['description'].lower()
        
        # Must contain at least 3 job-related keywords
        keyword_count = sum(1 for keyword in self.JOB_KEYWORDS if keyword in description)
        if keyword_count < 3:
            logger.info(f"REJECTED - Lacks job keywords: {job_data['title']}")
            return False
        
        # Additional quality checks
        if len(job_data['title']) < 5:
            logger.info(f"REJECTED - Title too short: {job_data['title']}")
            return False
        
        if len(job_data['description']) < 100:
            logger.info(f"REJECTED - Description too short: {job_data['title']}")
            return False
        
        return True
    
    async def scrape_job(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Scrape a single job URL with full validation pipeline.
        
        Returns job data if valid, None if junk/invalid.
        """
        # Deduplicate
        if url in self.seen_urls:
            return None
        self.seen_urls.add(url)
        
        # Stage 1: URL validation
        if not self._validate_url(url):
            return None
        
        try:
            # Fetch page
            context = await self.browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            page = await context.new_page()
            
            logger.info(f"Fetching: {url}")
            await page.goto(url, timeout=30000, wait_until='domcontentloaded')
            
            # Get HTML
            html = await page.content()
            await context.close()
            
            # Stage 2: HTML validation
            if not self._validate_html(html):
                return None
            
            # Stage 3: Extraction with validation
            job_data = self._extract_structured_data(html, url)
            if not job_data:
                return None
            
            # Stage 4: Semantic validation
            if not self._validate_semantic(job_data):
                return None
            
            logger.info(f"✓ VALID JOB: {job_data['title']}")
            return job_data
            
        except Exception as e:
            logger.error(f"Scraping error for {url}: {e}")
            return None
    
    async def scrape_multiple(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Scrape multiple URLs concurrently."""
        tasks = [self.scrape_job(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out None and exceptions
        valid_jobs = []
        for result in results:
            if isinstance(result, dict):
                valid_jobs.append(result)
            elif isinstance(result, Exception):
                logger.error(f"Task failed: {result}")
        
        logger.info(f"Scraped {len(valid_jobs)}/{len(urls)} valid jobs")
        return valid_jobs
