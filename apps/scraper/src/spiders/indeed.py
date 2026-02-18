#!/usr/bin/env python3
"""
indeed.py
Scrapy-Playwright spider for Indeed with JS rendering support.
"""

import logging
from typing import Optional, Dict, Any, Iterator
from datetime import datetime
import scrapy
from scrapy import signals
from scrapy.http import Response

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import JobListing
from cleanser import cleanse_html

logger = logging.getLogger(__name__)


class IndeedSpider(scrapy.Spider):
    """
    Scrapy-Playwright spider for Indeed job listings.
    
    Features:
    - JavaScript rendering with Playwright
    - wait_for_selector for full content loading
    - Trafilatura content extraction
    - Structured logging
    """
    
    name = "indeed"
    allowed_domains = ["indeed.com"]
    
    # Start URLs - can be overridden via spider arguments
    start_urls = [
        "https://www.indeed.com/jobs?q=software+engineer&l=remote",
    ]
    
    # Scrapy-Playwright settings
    custom_settings = {
        "DOWNLOAD_HANDLERS": {
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        "TWISTED_REACTOR": "twisted.internet.asyncioreactor.AsyncioSelectorReactor",
        "PLAYWRIGHT_BROWSER_TYPE": "chromium",
        "PLAYWRIGHT_LAUNCH_OPTIONS": {
            "headless": True,
            "args": ["--no-sandbox", "--disable-dev-shm-usage"],
        },
        "PLAYWRIGHT_DEFAULT_NAVIGATION_TIMEOUT": 30000,
        "CONCURRENT_REQUESTS": 8,
        "DOWNLOAD_DELAY": 1.5,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "COOKIES_ENABLED": False,
        "RETRY_TIMES": 3,
        "RETRY_HTTP_CODES": [500, 502, 503, 504, 408, 429],
    }
    
    # CSS selectors for Indeed
    SELECTORS = {
        "job_cards": ".job_seen_beacon, .jobsearch-ResultsList > li",
        "job_title": "h2.jobTitle span[title], .jobTitle > a",
        "company": "[data-testid='company-name'], .companyName",
        "location": "[data-testid='text-location'], .companyLocation",
        "salary": "[data-testid='attribute_snippet_testid'], .salary-snippet-container",
        "job_link": "h2.jobTitle a, .jobTitle > a",
        "description": "#jobDescriptionText, .jobsearch-jobDescriptionText",
        "next_page": "[data-testid='pagination-page-next'], a[aria-label='Next Page']",
    }
    
    def __init__(
        self,
        search_query: Optional[str] = None,
        location: Optional[str] = None,
        max_pages: int = 10,
        *args,
        **kwargs
    ):
        """
        Initialize Indeed spider.
        
        Args:
            search_query: Job search query (e.g., "software engineer")
            location: Location filter (e.g., "remote", "New York")
            max_pages: Maximum search result pages to scrape
        """
        super().__init__(*args, **kwargs)
        
        self.search_query = search_query or "software engineer"
        self.location_filter = location or "remote"
        self.max_pages = max_pages
        self.current_page = 0
        
        # Metrics
        self.jobs_found = 0
        self.jobs_parsed = 0
        self.errors = 0
        
        # Update start URLs if custom query provided
        if search_query or location:
            query = search_query.replace(" ", "+") if search_query else "software"
            loc = location.replace(" ", "+") if location else "remote"
            self.start_urls = [
                f"https://www.indeed.com/jobs?q={query}&l={loc}"
            ]
    
    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        """Hook into Scrapy signals."""
        spider = super().from_crawler(crawler, *args, **kwargs)
        crawler.signals.connect(spider.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(spider.spider_closed, signal=signals.spider_closed)
        return spider
    
    def spider_opened(self, spider):
        """Called when spider opens."""
        logger.info({
            "event": "spider_opened",
            "source": "indeed",
            "search_query": self.search_query,
            "location": self.location_filter,
        })
    
    def spider_closed(self, spider):
        """Called when spider closes."""
        logger.info({
            "event": "spider_closed",
            "source": "indeed",
            "jobs_found": self.jobs_found,
            "jobs_parsed": self.jobs_parsed,
            "pages_scraped": self.current_page,
            "errors": self.errors,
        })
    
    def start_requests(self):
        """Generate initial requests with Playwright meta."""
        for url in self.start_urls:
            yield scrapy.Request(
                url,
                callback=self.parse_search_results,
                meta={
                    "playwright": True,
                    "playwright_include_page": True,
                    "playwright_page_methods": [
                        {
                            "method": "wait_for_selector",
                            "args": [self.SELECTORS["job_cards"]],
                            "kwargs": {"timeout": 15000},
                        },
                    ],
                },
                errback=self.errback,
            )
    
    async def parse_search_results(self, response: Response):
        """
        Parse search results page and extract job cards.
        
        Uses Playwright page to wait for JS rendering.
        """
        page = response.meta.get("playwright_page")
        
        try:
            self.current_page += 1
            logger.info(f"Parsing Indeed page {self.current_page}")
            
            # Wait for job cards to fully render
            if page:
                await page.wait_for_selector(
                    self.SELECTORS["job_cards"],
                    timeout=15000
                )
            
            # Extract job cards
            job_cards = response.css(self.SELECTORS["job_cards"])
            logger.info(f"Found {len(job_cards)} job cards on page {self.current_page}")
            
            for card in job_cards:
                self.jobs_found += 1
                
                # Extract basic info from card
                job_data = self._extract_card_data(card)
                
                if job_data.get("job_link"):
                    # Follow link to get full description
                    yield scrapy.Request(
                        response.urljoin(job_data["job_link"]),
                        callback=self.parse_job_detail,
                        meta={
                            "playwright": True,
                            "playwright_include_page": True,
                            "playwright_page_methods": [
                                {
                                    "method": "wait_for_selector",
                                    "args": [self.SELECTORS["description"]],
                                    "kwargs": {"timeout": 10000},
                                },
                            ],
                            "job_data": job_data,
                        },
                        errback=self.errback,
                    )
            
            # Pagination - follow next page
            if self.current_page < self.max_pages:
                next_page = response.css(self.SELECTORS["next_page"] + "::attr(href)").get()
                if next_page:
                    yield scrapy.Request(
                        response.urljoin(next_page),
                        callback=self.parse_search_results,
                        meta={
                            "playwright": True,
                            "playwright_include_page": True,
                            "playwright_page_methods": [
                                {
                                    "method": "wait_for_selector",
                                    "args": [self.SELECTORS["job_cards"]],
                                    "kwargs": {"timeout": 15000},
                                },
                            ],
                        },
                        errback=self.errback,
                    )
                    
        except Exception as e:
            logger.error(f"Error parsing search results: {e}")
            self.errors += 1
        finally:
            if page:
                await page.close()
    
    def _extract_card_data(self, card) -> Dict[str, Any]:
        """Extract data from a job card element."""
        return {
            "job_title": card.css(self.SELECTORS["job_title"] + "::text").get(),
            "company_name": card.css(self.SELECTORS["company"] + "::text").get(),
            "location": card.css(self.SELECTORS["location"] + "::text").get(),
            "salary_range": card.css(self.SELECTORS["salary"] + "::text").get(),
            "job_link": card.css(self.SELECTORS["job_link"] + "::attr(href)").get(),
        }
    
    async def parse_job_detail(self, response: Response):
        """
        Parse individual job detail page.
        
        Extracts full description and creates JobListing.
        """
        page = response.meta.get("playwright_page")
        job_data = response.meta.get("job_data", {})
        
        try:
            # Wait for description to load
            if page:
                await page.wait_for_selector(
                    self.SELECTORS["description"],
                    timeout=10000
                )
            
            # Get full HTML for trafilatura processing
            html = response.text
            
            # Extract and clean description
            description_html = response.css(self.SELECTORS["description"]).get()
            cleaned_description = cleanse_html(
                description_html or html,
                source="indeed"
            )
            
            if not cleaned_description:
                logger.warning(f"Failed to extract description from {response.url}")
                self.errors += 1
                return
            
            # Create JobListing
            job = JobListing(
                url=response.url,
                raw_html=html,
                source="indeed",
                scraped_at=datetime.utcnow(),
                job_title=job_data.get("job_title"),
                company_name=job_data.get("company_name"),
                location=job_data.get("location"),
                job_description=cleaned_description,
                salary_range=job_data.get("salary_range"),
                remote_status=self._parse_remote_status(job_data.get("location")),
                application_link=response.url,
            )
            
            self.jobs_parsed += 1
            
            logger.debug({
                "event": "job_parsed",
                "source": "indeed",
                "title": job.job_title,
                "company": job.company_name,
            })
            
            yield job.model_dump()
            
        except Exception as e:
            logger.error(f"Error parsing job detail: {e}")
            self.errors += 1
        finally:
            if page:
                await page.close()
    
    def _parse_remote_status(self, location: Optional[str]) -> str:
        """Parse remote status from location string."""
        if not location:
            return "unknown"
        
        location_lower = location.lower()
        if "remote" in location_lower:
            return "remote"
        if "hybrid" in location_lower:
            return "hybrid"
        
        return "onsite"
    
    async def errback(self, failure):
        """Handle request failures."""
        logger.error(f"Request failed: {failure.value}")
        self.errors += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get spider metrics."""
        return {
            "source": "indeed",
            "jobs_found": self.jobs_found,
            "jobs_parsed": self.jobs_parsed,
            "pages_scraped": self.current_page,
            "errors": self.errors,
        }
