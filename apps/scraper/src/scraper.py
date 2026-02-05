#!/usr/bin/env python3
"""
scraper.py
Production-grade job scraper with multi-stage validation and complete field extraction.
"""

import asyncio
import logging
import re
import hashlib
import aiohttp
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse, urljoin
from datetime import datetime, timedelta
from playwright.async_api import async_playwright, Browser, Page
import trafilatura
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class JobScraper:
    """
    Intelligent job scraper with multi-stage validation pipeline.
    
    Validation Stages:
    1. URL validation (pattern matching)
    2. HTTP status check (verify 200)
    3. HTML validation (check for job indicators)
    4. Extraction validation (content quality)
    5. Semantic validation (job-related keywords)
    6. Link validation (application link active)
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
    
    # Job type patterns
    JOB_TYPE_PATTERNS = {
        'full-time': re.compile(r'\b(full[- ]?time|permanent)\b', re.I),
        'part-time': re.compile(r'\b(part[- ]?time)\b', re.I),
        'contract': re.compile(r'\b(contract|contractor|freelance)\b', re.I),
        'internship': re.compile(r'\b(intern|internship)\b', re.I),
        'temporary': re.compile(r'\b(temporary|temp)\b', re.I),
    }
    
    # Experience patterns
    EXPERIENCE_PATTERNS = re.compile(
        r'(\d+)\+?\s*(?:to|-|–)\s*(\d+)?\s*years?(?:\s+of)?\s+(?:experience|exp)',
        re.I
    )
    
    # Skills extraction patterns
    SKILL_KEYWORDS = [
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust',
        'react', 'vue', 'angular', 'node.js', 'django', 'flask', 'fastapi',
        'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform',
        'machine learning', 'deep learning', 'nlp', 'data science',
        'agile', 'scrum', 'ci/cd', 'git', 'linux'
    ]
    
    # Industry patterns
    INDUSTRY_KEYWORDS = {
        'technology': ['software', 'tech', 'saas', 'it ', 'engineering'],
        'finance': ['fintech', 'banking', 'financial', 'investment'],
        'healthcare': ['health', 'medical', 'pharma', 'biotech'],
        'e-commerce': ['ecommerce', 'retail', 'marketplace'],
        'education': ['edtech', 'learning', 'education', 'training'],
        'media': ['media', 'entertainment', 'gaming', 'streaming'],
    }

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.seen_urls = set()
        self.http_session: Optional[aiohttp.ClientSession] = None
    
    async def start(self):
        """Initialize browser and HTTP session."""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        self.http_session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        logger.info("Browser and HTTP session initialized")
    
    async def close(self):
        """Close browser and HTTP session."""
        if self.browser:
            await self.browser.close()
            logger.info("Browser closed")
        if self.http_session:
            await self.http_session.close()
            logger.info("HTTP session closed")
    
    def _generate_job_id(self, url: str, title: str, company: str) -> str:
        """Generate unique job ID from URL + title + company."""
        content = f"{url}|{title}|{company}".lower()
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
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
    
    async def _check_http_status(self, url: str) -> bool:
        """Stage 2: Verify URL returns HTTP 200."""
        try:
            async with self.http_session.head(url, allow_redirects=True) as resp:
                if resp.status == 200:
                    return True
                logger.debug(f"URL returned {resp.status}: {url}")
                return False
        except Exception as e:
            logger.debug(f"HTTP check failed for {url}: {e}")
            return False
    
    def _validate_html(self, html: str) -> bool:
        """Stage 3: Check if HTML contains job indicators."""
        soup = BeautifulSoup(html, 'lxml')
        text = soup.get_text().lower()
        
        # Must have at least 2 job keywords
        keyword_count = sum(1 for keyword in self.JOB_KEYWORDS if keyword in text)
        if keyword_count < 2:
            logger.debug("HTML lacks job indicators")
            return False
        
        return True
    
    def _extract_job_type(self, text: str) -> Optional[str]:
        """Extract job type from text."""
        for job_type, pattern in self.JOB_TYPE_PATTERNS.items():
            if pattern.search(text):
                return job_type
        return None
    
    def _extract_experience(self, text: str) -> Optional[str]:
        """Extract experience requirement from text."""
        match = self.EXPERIENCE_PATTERNS.search(text)
        if match:
            min_years = match.group(1)
            max_years = match.group(2)
            if max_years:
                return f"{min_years}-{max_years} years"
            return f"{min_years}+ years"
        return None
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from text."""
        text_lower = text.lower()
        found_skills = []
        for skill in self.SKILL_KEYWORDS:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        return list(set(found_skills))
    
    def _extract_industry(self, text: str, company: str) -> Optional[str]:
        """Infer industry from text and company name."""
        combined = f"{text} {company}".lower()
        for industry, keywords in self.INDUSTRY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in combined:
                    return industry
        return None
    
    def _extract_employment_mode(self, text: str) -> str:
        """Extract employment mode (onsite/hybrid/remote)."""
        text_lower = text.lower()
        if re.search(r'\b(remote|work from home|wfh)\b', text_lower):
            return 'remote'
        if re.search(r'\bhybrid\b', text_lower):
            return 'hybrid'
        if re.search(r'\b(on-?site|office|in-person)\b', text_lower):
            return 'onsite'
        return 'unknown'
    
    def _extract_expiry_date(self, soup: BeautifulSoup, text: str) -> Optional[str]:
        """Try to extract job expiry/closing date."""
        # Look for structured data
        for selector in ['[itemprop="validThrough"]', '.closing-date', '.expiry']:
            elem = soup.select_one(selector)
            if elem:
                date_text = elem.get('content') or elem.get_text().strip()
                try:
                    # Try common date formats
                    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%B %d, %Y']:
                        try:
                            return datetime.strptime(date_text, fmt).strftime('%Y-%m-%d')
                        except ValueError:
                            continue
                except Exception:
                    pass
        
        # Default: assume 30 days from now if no explicit date
        return None
    
    def _extract_posting_date(self, soup: BeautifulSoup) -> Optional[str]:
        """Try to extract job posting date."""
        for selector in ['[itemprop="datePosted"]', '.posted-date', '.date-posted']:
            elem = soup.select_one(selector)
            if elem:
                date_text = elem.get('content') or elem.get_text().strip()
                try:
                    for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%B %d, %Y']:
                        try:
                            return datetime.strptime(date_text, fmt).strftime('%Y-%m-%d')
                        except ValueError:
                            continue
                except Exception:
                    pass
        return None
    
    def _extract_application_link(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        """Extract the application/apply link."""
        # Look for apply buttons/links
        for selector in [
            'a[href*="apply"]',
            'a.apply-button',
            'a.apply-link',
            'button[data-apply-url]',
            '[itemprop="url"]'
        ]:
            elem = soup.select_one(selector)
            if elem:
                href = elem.get('href') or elem.get('data-apply-url')
                if href:
                    return urljoin(base_url, href)
        
        # Fallback to the job URL itself
        return base_url
    
    def _extract_job_source(self, url: str) -> str:
        """Extract source domain from URL."""
        parsed = urlparse(url)
        return parsed.netloc.replace('www.', '')
    
    def _extract_structured_data(self, html: str, url: str) -> Optional[Dict[str, Any]]:
        """
        Stage 4: Extract structured job data with validation.
        
        This is the CRITICAL stage where we prevent junk data and
        extract ALL required fields.
        """
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Use Trafilatura for main content extraction
            extracted_text = trafilatura.extract(
                html,
                include_comments=False,
                include_tables=False,
                include_images=False,
                no_fallback=False
            )
            
            if not extracted_text:
                logger.debug(f"Trafilatura extraction failed for {url}")
                return None
            
            # Get metadata
            metadata = trafilatura.extract_metadata(html)
            title = metadata.title if metadata and metadata.title else None
            
            # Fallback: Try to extract title from HTML
            if not title:
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
            
            # Extract company name
            company = None
            company_selectors = [
                '[itemprop="hiringOrganization"]',
                'span[class*="company"]',
                'div[class*="company"]',
                'a[class*="company"]',
            ]
            for selector in company_selectors:
                elem = soup.select_one(selector)
                if elem:
                    company = elem.get_text().strip()
                    break
            
            # Extract salary
            salary = None
            salary_patterns = re.compile(
                r'[\$€£][\d,]+(?:\s*[-–]\s*[\$€£]?[\d,]+)?(?:\s*(?:per|/)\s*(?:year|month|hour|yr|mo|hr))?|'
                r'[\d,]+(?:\s*[-–]\s*[\d,]+)?\s*(?:LPA|CTC|per annum)',
                re.IGNORECASE
            )
            salary_match = salary_patterns.search(extracted_text)
            if salary_match:
                salary = salary_match.group(0)
            
            # Extract location
            location = None
            location_selectors = [
                '[itemprop="jobLocation"]',
                'span[class*="location"]',
                'div[class*="location"]',
            ]
            for selector in location_selectors:
                elem = soup.select_one(selector)
                if elem:
                    location = elem.get_text().strip()
                    break
            
            # Extract all fields
            job_type = self._extract_job_type(extracted_text)
            experience = self._extract_experience(extracted_text)
            skills = self._extract_skills(extracted_text)
            industry = self._extract_industry(extracted_text, company or '')
            employment_mode = self._extract_employment_mode(extracted_text)
            remote_status = 'remote' if employment_mode == 'remote' else employment_mode
            application_link = self._extract_application_link(soup, url)
            posting_date = self._extract_posting_date(soup)
            expiry_date = self._extract_expiry_date(soup, extracted_text)
            job_source = self._extract_job_source(url)
            
            # Generate unique job ID
            job_id = self._generate_job_id(url, title, company or '')
            
            return {
                # Required fields per schema
                'job_id': job_id,
                'job_title': title.strip(),
                'company_name': company,
                'location': location,
                'job_type': job_type,
                'industry': industry,
                'salary_range': salary,
                'experience_required': experience,
                'skills_required': skills,
                'job_description': extracted_text.strip(),
                'application_link': application_link or url,
                'job_source': job_source,
                'posting_date': posting_date,
                'expiry_date': expiry_date,
                'employment_mode': employment_mode,
                'remote_status': remote_status,
                
                # Metadata
                'meta': {
                    'word_count': word_count,
                    'extraction_method': 'trafilatura',
                    'scraped_url': url,
                }
            }
            
        except Exception as e:
            logger.error(f"Extraction error for {url}: {e}")
            return None
    
    def _validate_semantic(self, job_data: Dict[str, Any]) -> bool:
        """Stage 5: Semantic validation - ensure it's actually a job posting."""
        description = job_data['job_description'].lower()
        
        # Must contain at least 3 job-related keywords
        keyword_count = sum(1 for keyword in self.JOB_KEYWORDS if keyword in description)
        if keyword_count < 3:
            logger.info(f"REJECTED - Lacks job keywords: {job_data['job_title']}")
            return False
        
        # Additional quality checks
        if len(job_data['job_title']) < 5:
            logger.info(f"REJECTED - Title too short: {job_data['job_title']}")
            return False
        
        if len(job_data['job_description']) < 100:
            logger.info(f"REJECTED - Description too short: {job_data['job_title']}")
            return False
        
        return True
    
    async def _validate_application_link(self, url: str) -> bool:
        """Stage 6: Verify application link is active."""
        try:
            async with self.http_session.head(url, allow_redirects=True) as resp:
                return resp.status == 200
        except Exception:
            return False
    
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
            # Stage 2: HTTP status check (quick HEAD request)
            if not await self._check_http_status(url):
                logger.info(f"REJECTED - HTTP check failed: {url}")
                return None
            
            # Fetch full page with browser
            context = await self.browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            page = await context.new_page()
            
            logger.info(f"Fetching: {url}")
            await page.goto(url, timeout=30000, wait_until='domcontentloaded')
            
            # Get HTML
            html = await page.content()
            await context.close()
            
            # Stage 3: HTML validation
            if not self._validate_html(html):
                return None
            
            # Stage 4: Extraction with validation
            job_data = self._extract_structured_data(html, url)
            if not job_data:
                return None
            
            # Stage 5: Semantic validation
            if not self._validate_semantic(job_data):
                return None
            
            # Stage 6: Application link validation (non-blocking)
            if job_data.get('application_link'):
                link_valid = await self._validate_application_link(job_data['application_link'])
                job_data['meta']['application_link_valid'] = link_valid
            
            logger.info(f"✓ VALID JOB: {job_data['job_title']} @ {job_data.get('company_name', 'Unknown')}")
            return job_data
            
        except Exception as e:
            logger.error(f"Scraping error for {url}: {e}")
            return None
    
    async def scrape_multiple(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Scrape multiple URLs concurrently with rate limiting."""
        # Process in batches to avoid overwhelming
        batch_size = 10
        all_jobs = []
        
        for i in range(0, len(urls), batch_size):
            batch = urls[i:i + batch_size]
            tasks = [self.scrape_job(url) for url in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, dict):
                    all_jobs.append(result)
                elif isinstance(result, Exception):
                    logger.error(f"Task failed: {result}")
            
            # Small delay between batches
            if i + batch_size < len(urls):
                await asyncio.sleep(1)
        
        logger.info(f"Scraped {len(all_jobs)}/{len(urls)} valid jobs")
        return all_jobs
    
    async def validate_existing_jobs(
        self,
        jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Validate a list of existing jobs by checking their URLs.
        Returns list of jobs with validation status.
        """
        results = []
        for job in jobs:
            url = job.get('application_link') or job.get('url')
            if url:
                is_valid = await self._check_http_status(url)
                job['is_valid'] = is_valid
                if not is_valid:
                    job['validation_error'] = 'URL returns non-200 status'
            results.append(job)
        return results
