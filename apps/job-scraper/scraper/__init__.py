"""Job scraper package for tech job listings."""

__version__ = "1.0.0"
__author__ = "JobBot Team"
__description__ = "Production-ready web scraper for tech job listings"

from .main import main
from .scraper import JobScraper, run_daily_scrape, run_custom_scrape
from .models import JobListing, SearchQuery, ScrapingResult
from .config import config
from .supabase_client import supabase_client

__all__ = [
    "main",
    "JobScraper",
    "run_daily_scrape", 
    "run_custom_scrape",
    "JobListing",
    "SearchQuery", 
    "ScrapingResult",
    "config",
    "supabase_client"
]
