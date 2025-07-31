#!/usr/bin/env python3
"""
Example usage script for the Job Scraper.
This demonstrates various ways to use the scraper programmatically.
"""

import asyncio
import logging
from datetime import datetime

# Configure logging for the example
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def example_basic_scrape():
    """Example 1: Basic scraping with default parameters."""
    logger.info("🔍 Example 1: Basic scraping")
    
    from scraper import run_daily_scrape
    
    try:
        result = await run_daily_scrape()
        
        print(f"✅ Scraping completed!")
        print(f"   Jobs found: {result.total_jobs_found}")
        print(f"   Jobs saved: {result.jobs_saved}")
        print(f"   Success rate: {result.success_rate:.2f}%")
        print(f"   Duration: {result.duration_seconds:.2f} seconds")
        
        if result.errors:
            print(f"   Errors: {len(result.errors)}")
            for error in result.errors[:3]:  # Show first 3 errors
                print(f"   - {error}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in basic scrape: {e}")
        return None


async def example_custom_scrape():
    """Example 2: Custom scraping with specific keywords."""
    logger.info("🎯 Example 2: Custom keyword scraping")
    
    from scraper import run_custom_scrape
    
    # Define custom search parameters
    keywords = ["python", "django", "fastapi", "machine learning"]
    location = "San Francisco, CA"
    max_results = 25
    
    try:
        result = await run_custom_scrape(
            keywords=keywords,
            location=location,
            max_results=max_results
        )
        
        print(f"✅ Custom scraping completed!")
        print(f"   Keywords: {', '.join(keywords)}")
        print(f"   Location: {location}")
        print(f"   Jobs found: {result.total_jobs_found}")
        print(f"   Jobs saved: {result.jobs_saved}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in custom scrape: {e}")
        return None


async def example_advanced_scraping():
    """Example 3: Advanced scraping with multiple queries."""
    logger.info("🚀 Example 3: Advanced multi-query scraping")
    
    from scraper import JobScraper, SearchQuery
    
    # Define multiple search queries
    queries = [
        SearchQuery(
            keywords=["react", "typescript", "frontend"],
            location="New York, NY",
            max_results=20
        ),
        SearchQuery(
            keywords=["node.js", "express", "backend"],
            location="Austin, TX",
            max_results=15
        ),
        SearchQuery(
            keywords=["devops", "kubernetes", "docker"],
            location="Remote",
            max_results=25
        )
    ]
    
    try:
        async with JobScraper() as scraper:
            result = await scraper.scrape_jobs(queries)
            
            print(f"✅ Advanced scraping completed!")
            print(f"   Total queries: {len(queries)}")
            print(f"   Jobs found: {result.total_jobs_found}")
            print(f"   Jobs saved: {result.jobs_saved}")
            print(f"   Jobs filtered: {result.jobs_filtered}")
            
            return result
            
    except Exception as e:
        logger.error(f"Error in advanced scrape: {e}")
        return None


async def example_get_statistics():
    """Example 4: Get scraping statistics."""
    logger.info("📊 Example 4: Getting job statistics")
    
    from scraper import JobScraper
    
    try:
        async with JobScraper() as scraper:
            stats = await scraper.get_job_statistics()
            
            print(f"📈 Job Statistics (Last 24 hours):")
            print(f"   Total jobs: {stats.get('total_jobs_24h', 0)}")
            print(f"   Companies: {stats.get('companies', 0)}")
            print(f"   Locations: {stats.get('locations', 0)}")
            
            # Show top companies
            top_companies = stats.get('top_companies', [])[:5]
            if top_companies:
                print(f"   Top companies:")
                for company in top_companies:
                    print(f"     • {company['company']}: {company['count']} jobs")
            
            # Show common tags
            common_tags = stats.get('common_tags', [])[:8]
            if common_tags:
                print(f"   Common tags:")
                for tag in common_tags:
                    print(f"     • {tag['tag']}: {tag['count']} jobs")
            
            return stats
            
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        return None


async def example_single_site_scraping():
    """Example 5: Scrape from a specific site only."""
    logger.info("🎯 Example 5: Single site scraping")
    
    from scraper import JobScraper, SearchQuery
    
    try:
        query = SearchQuery(
            keywords=["software engineer", "python"],
            location="Seattle, WA",
            max_results=30
        )
        
        async with JobScraper() as scraper:
            jobs = await scraper.scrape_single_site("linkedin", query)
            
            print(f"✅ LinkedIn scraping completed!")
            print(f"   Jobs found: {len(jobs)}")
            
            # Show sample jobs
            for i, job in enumerate(jobs[:3]):
                print(f"   Job {i+1}: {job.title} at {job.company}")
                print(f"           Location: {job.location}")
                print(f"           Tags: {', '.join(job.tags)}")
                print()
            
            return jobs
            
    except Exception as e:
        logger.error(f"Error in single site scraping: {e}")
        return None


async def run_all_examples():
    """Run all examples in sequence."""
    print("🚀 Job Scraper Examples")
    print("=" * 50)
    print()
    
    examples = [
        ("Basic Scraping", example_basic_scrape),
        ("Custom Keywords", example_custom_scrape),
        ("Advanced Multi-Query", example_advanced_scraping),
        ("Statistics", example_get_statistics),
        ("Single Site", example_single_site_scraping)
    ]
    
    results = {}
    
    for name, example_func in examples:
        print(f"🏃 Running: {name}")
        print("-" * 30)
        
        try:
            result = await example_func()
            results[name] = result
            print("✅ Success!")
            
        except Exception as e:
            logger.error(f"❌ Failed: {e}")
            results[name] = None
        
        print()
        await asyncio.sleep(2)  # Small delay between examples
    
    # Summary
    print("📋 Summary")
    print("=" * 20)
    for name, result in results.items():
        status = "✅" if result else "❌"
        print(f"{status} {name}")
    
    return results


def main():
    """Main function to run the examples."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Job Scraper Examples')
    parser.add_argument('--example', type=int, choices=[1, 2, 3, 4, 5], 
                       help='Run specific example (1-5)')
    parser.add_argument('--all', action='store_true', 
                       help='Run all examples')
    
    args = parser.parse_args()
    
    if args.example:
        examples = {
            1: example_basic_scrape,
            2: example_custom_scrape,
            3: example_advanced_scraping,
            4: example_get_statistics,
            5: example_single_site_scraping
        }
        
        print(f"🏃 Running Example {args.example}")
        asyncio.run(examples[args.example]())
        
    elif args.all:
        asyncio.run(run_all_examples())
        
    else:
        print("Job Scraper Examples")
        print("Usage:")
        print("  python examples.py --example 1    # Run specific example")
        print("  python examples.py --all          # Run all examples")
        print()
        print("Available examples:")
        print("  1. Basic scraping with defaults")
        print("  2. Custom keyword scraping")
        print("  3. Advanced multi-query scraping")
        print("  4. Get job statistics")
        print("  5. Single site scraping")


if __name__ == "__main__":
    main()
