"""Playwright utilities for scraping JavaScript-heavy pages."""

import asyncio
import random
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urlencode, urljoin

try:
    from playwright.async_api import async_playwright, Browser, BrowserContext, Page
except ImportError:
    # Fallback types when playwright is not installed
    Browser = Any
    BrowserContext = Any
    Page = Any

from .models import JobListing, SearchQuery
from .config import config

logger = logging.getLogger(__name__)


class PlaywrightScraper:
    """Playwright-based scraper for dynamic job sites."""
    
    def __init__(self):
        """Initialize the Playwright scraper."""
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_REQUESTS)
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    async def start(self) -> None:
        """Start the browser and create context."""
        try:
            playwright = await async_playwright().start()
            
            # Launch browser with stealth settings
            self.browser = await playwright.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            )
            
            # Create context with stealth settings
            self.context = await self.browser.new_context(
                user_agent=random.choice(config.USER_AGENTS),
                viewport={'width': 1920, 'height': 1080},
                java_script_enabled=True,
                extra_http_headers={
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Connection': 'keep-alive'
                }
            )
            
            # Block unnecessary resources to speed up scraping
            await self.context.route("**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}", 
                                   lambda route: route.abort())
            
            logger.info("Playwright browser started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start Playwright browser: {e}")
            raise
    
    async def close(self) -> None:
        """Close the browser and clean up resources."""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            logger.info("Playwright browser closed successfully")
        except Exception as e:
            logger.error(f"Error closing Playwright browser: {e}")
    
    async def create_page(self) -> Page:
        """Create a new page with anti-detection measures."""
        if not self.context:
            raise RuntimeError("Browser context not initialized")
        
        page = await self.context.new_page()
        
        # Add stealth JavaScript
        await page.add_init_script("""
            // Remove webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Mock plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            
            // Mock languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
        """)
        
        return page
    
    async def scrape_linkedin_jobs(self, query: SearchQuery) -> List[JobListing]:
        """Scrape job listings from LinkedIn."""
        jobs = []
        
        async with self.semaphore:
            try:
                page = await self.create_page()
                
                # Build LinkedIn search URL
                search_params = {
                    'keywords': ' '.join(query.keywords),
                    'location': query.location or 'United States',
                    'f_TPR': 'r86400',  # Past 24 hours
                    'f_JT': 'F',  # Full-time
                    'start': 0
                }
                
                search_url = f"{config.LINKEDIN_BASE_URL}?{urlencode(search_params)}"
                logger.info(f"Scraping LinkedIn: {search_url}")
                
                await page.goto(search_url, wait_until='networkidle')
                
                # Wait for job listings to load
                await page.wait_for_selector('.jobs-search__results-list', timeout=30000)
                
                # Extract job listings
                job_elements = await page.query_selector_all('.base-card')
                
                for job_element in job_elements[:query.max_results]:
                    try:
                        job = await self._extract_linkedin_job(page, job_element)
                        if job and self._filter_job(job, query.keywords):
                            jobs.append(job)
                    except Exception as e:
                        logger.warning(f"Error extracting job: {e}")
                        continue
                    
                    # Rate limiting
                    await asyncio.sleep(random.uniform(
                        config.REQUEST_DELAY_MIN, 
                        config.REQUEST_DELAY_MAX
                    ))
                
                await page.close()
                logger.info(f"Scraped {len(jobs)} jobs from LinkedIn")
                
            except Exception as e:
                logger.error(f"Error scraping LinkedIn: {e}")
        
        return jobs
    
    async def _extract_linkedin_job(self, page: Page, job_element) -> Optional[JobListing]:
        """Extract job details from LinkedIn job element."""
        try:
            # Extract basic information
            title_element = await job_element.query_selector('.base-search-card__title')
            title = await title_element.inner_text() if title_element else ""
            
            company_element = await job_element.query_selector('.base-search-card__subtitle')
            company = await company_element.inner_text() if company_element else ""
            
            location_element = await job_element.query_selector('.job-search-card__location')
            location = await location_element.inner_text() if location_element else ""
            
            link_element = await job_element.query_selector('a')
            url = await link_element.get_attribute('href') if link_element else ""
            
            if not all([title, company, location, url]):
                return None
            
            # Clean up extracted data
            title = title.strip()
            company = company.strip()
            location = location.strip()
            
            # Make URL absolute
            if url.startswith('/'):
                url = urljoin('https://www.linkedin.com', url)
            
            # Extract additional details if available
            description = ""
            try:
                # Click on job to get description (optional)
                await job_element.click()
                await page.wait_for_selector('.description__text', timeout=5000)
                desc_element = await page.query_selector('.description__text')
                description = await desc_element.inner_text() if desc_element else ""
            except:
                pass  # Description extraction is optional
            
            # Generate relevant tags based on title and description
            tags = self._extract_tags(f"{title} {description}")
            
            return JobListing(
                title=title,
                company=company,
                location=location,
                url=url,
                tags=tags,
                description=description[:1000] if description else None,  # Limit description length
                source="LinkedIn"
            )
            
        except Exception as e:
            logger.warning(f"Error extracting LinkedIn job details: {e}")
            return None
    
    def _extract_tags(self, text: str) -> List[str]:
        """Extract relevant tags from job text."""
        text_lower = text.lower()
        found_tags = []
        
        for keyword in config.TECH_KEYWORDS:
            if keyword.lower() in text_lower:
                found_tags.append(keyword)
        
        # Add common variations
        tag_variations = {
            'javascript': ['js', 'javascript', 'node.js', 'nodejs'],
            'python': ['python', 'django', 'flask', 'fastapi'],
            'react': ['react', 'reactjs', 'react.js'],
            'aws': ['aws', 'amazon web services', 'ec2', 's3'],
            'docker': ['docker', 'containerization', 'kubernetes'],
            'ml': ['machine learning', 'ml', 'ai', 'artificial intelligence']
        }
        
        for main_tag, variations in tag_variations.items():
            if any(variation in text_lower for variation in variations):
                if main_tag not in found_tags:
                    found_tags.append(main_tag)
        
        return list(set(found_tags))  # Remove duplicates
    
    def _filter_job(self, job: JobListing, keywords: List[str]) -> bool:
        """Filter job based on relevance to search keywords."""
        job_text = f"{job.title} {job.description or ''}".lower()
        
        # Check if at least one keyword is present
        for keyword in keywords:
            if keyword.lower() in job_text:
                return True
        
        return False
    
    async def scrape_multiple_pages(self, query: SearchQuery, max_pages: int = 5) -> List[JobListing]:
        """Scrape multiple pages of results."""
        all_jobs = []
        
        for page_num in range(max_pages):
            try:
                # Update query for pagination
                page_query = SearchQuery(
                    keywords=query.keywords,
                    location=query.location,
                    max_results=min(25, query.max_results - len(all_jobs)),  # LinkedIn shows ~25 per page
                    experience_level=query.experience_level,
                    employment_type=query.employment_type
                )
                
                jobs = await self.scrape_linkedin_jobs(page_query)
                all_jobs.extend(jobs)
                
                if len(all_jobs) >= query.max_results:
                    break
                
                # Delay between pages
                await asyncio.sleep(random.uniform(5, 10))
                
            except Exception as e:
                logger.error(f"Error scraping page {page_num + 1}: {e}")
                break
        
        return all_jobs[:query.max_results]
