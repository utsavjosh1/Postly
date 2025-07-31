"""Main entry point for the job scraper application."""

import asyncio
import logging
import sys
import signal
from typing import Optional
from datetime import datetime

from .config import config
from .scraper import run_daily_scrape, run_custom_scrape, JobScraper
from .models import SearchQuery
from .supabase_client import supabase_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('scraper.log') if sys.stdout.isatty() else logging.NullHandler()
    ]
)

logger = logging.getLogger(__name__)


class GracefulKiller:
    """Handle graceful shutdown on SIGTERM/SIGINT."""
    
    def __init__(self):
        self.kill_now = False
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)
    
    def _handle_signal(self, signum, frame):
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.kill_now = True


async def health_check() -> bool:
    """Perform health check of all components."""
    try:
        # Validate configuration
        config.validate()
        logger.info("✓ Configuration validated")
        
        # Check Supabase connection
        if supabase_client.client:
            logger.info("✓ Supabase client initialized")
        else:
            logger.error("✗ Supabase client not initialized")
            return False
        
        # Test database connection
        try:
            recent_jobs = await supabase_client.get_recent_jobs(limit=1)
            logger.info("✓ Database connection successful")
        except Exception as e:
            logger.error(f"✗ Database connection failed: {e}")
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return False


async def run_scraper_service():
    """Run the scraper as a continuous service."""
    killer = GracefulKiller()
    
    logger.info("Starting job scraper service...")
    
    # Perform health check
    if not await health_check():
        logger.error("Health check failed, exiting...")
        sys.exit(1)
    
    try:
        while not killer.kill_now:
            try:
                logger.info("Starting scraping cycle...")
                result = await run_daily_scrape()
                
                logger.info(f"Scraping cycle completed:")
                logger.info(f"  - Jobs found: {result.total_jobs_found}")
                logger.info(f"  - Jobs saved: {result.jobs_saved}")
                logger.info(f"  - Success rate: {result.success_rate:.2f}%")
                logger.info(f"  - Duration: {result.duration_seconds:.2f}s")
                
                if result.errors:
                    logger.warning(f"Errors encountered: {len(result.errors)}")
                    for error in result.errors:
                        logger.warning(f"  - {error}")
                
                # Wait 30 minutes before next cycle (or until killed)
                for _ in range(1800):  # 30 minutes = 1800 seconds
                    if killer.kill_now:
                        break
                    await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in scraping cycle: {e}")
                # Wait 5 minutes before retry
                for _ in range(300):
                    if killer.kill_now:
                        break
                    await asyncio.sleep(1)
    
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    
    finally:
        logger.info("Job scraper service stopped")


async def run_one_time_scrape(keywords: Optional[str] = None, 
                             location: str = "United States",
                             max_results: int = 100):
    """Run a one-time scraping operation."""
    logger.info("Starting one-time scraping operation...")
    
    # Perform health check
    if not await health_check():
        logger.error("Health check failed, exiting...")
        sys.exit(1)
    
    try:
        if keywords:
            keyword_list = [k.strip() for k in keywords.split(',')]
            result = await run_custom_scrape(keyword_list, location, max_results)
        else:
            result = await run_daily_scrape()
        
        logger.info("Scraping operation completed:")
        logger.info(f"  - Jobs found: {result.total_jobs_found}")
        logger.info(f"  - Jobs saved: {result.jobs_saved}")
        logger.info(f"  - Jobs filtered: {result.jobs_filtered}")
        logger.info(f"  - Success rate: {result.success_rate:.2f}%")
        logger.info(f"  - Duration: {result.duration_seconds:.2f}s")
        
        if result.errors:
            logger.warning(f"Errors encountered: {len(result.errors)}")
            for error in result.errors:
                logger.warning(f"  - {error}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in one-time scraping: {e}")
        sys.exit(1)


async def get_statistics():
    """Get and display scraping statistics."""
    logger.info("Getting scraping statistics...")
    
    try:
        async with JobScraper() as scraper:
            stats = await scraper.get_job_statistics()
        
        logger.info("Job Statistics (Last 24 hours):")
        logger.info(f"  - Total jobs: {stats.get('total_jobs_24h', 0)}")
        logger.info(f"  - Companies: {stats.get('companies', 0)}")
        logger.info(f"  - Locations: {stats.get('locations', 0)}")
        
        top_companies = stats.get('top_companies', [])[:5]
        if top_companies:
            logger.info("  - Top companies:")
            for company in top_companies:
                logger.info(f"    * {company['company']}: {company['count']} jobs")
        
        common_tags = stats.get('common_tags', [])[:10]
        if common_tags:
            logger.info("  - Common tags:")
            for tag in common_tags:
                logger.info(f"    * {tag['tag']}: {tag['count']} jobs")
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        sys.exit(1)


def main():
    """Main entry point with command line argument handling."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Job Scraper for Tech Positions')
    parser.add_argument('--mode', choices=['service', 'once', 'stats'], 
                       default='once', help='Run mode')
    parser.add_argument('--keywords', type=str, 
                       help='Comma-separated keywords for custom search')
    parser.add_argument('--location', type=str, default='United States',
                       help='Location to search in')
    parser.add_argument('--max-results', type=int, default=100,
                       help='Maximum number of results')
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug logging')
    
    args = parser.parse_args()
    
    # Set debug logging if requested
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("Debug logging enabled")
    
    # Log startup information
    logger.info(f"Job Scraper starting at {datetime.now()}")
    logger.info(f"Mode: {args.mode}")
    logger.info(f"Max concurrent requests: {config.MAX_CONCURRENT_REQUESTS}")
    logger.info(f"Rate limit: {config.RATE_LIMIT_REQUESTS_PER_MINUTE} requests/minute")
    
    try:
        if args.mode == 'service':
            asyncio.run(run_scraper_service())
        elif args.mode == 'once':
            asyncio.run(run_one_time_scrape(
                keywords=args.keywords,
                location=args.location,
                max_results=args.max_results
            ))
        elif args.mode == 'stats':
            asyncio.run(get_statistics())
        else:
            logger.error(f"Unknown mode: {args.mode}")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
