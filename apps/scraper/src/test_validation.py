#!/usr/bin/env python3
"""
test_validation.py
Test script to verify the junk filter works correctly.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from scraper import JobScraper

# Test cases - these should ALL be rejected
JUNK_TEST_CASES = [
    {
        'url': 'https://example.com/job',
        'html': '<html><body><h1>View Company Profile</h1><p>Click here to view</p></body></html>',
        'expected': 'REJECT - junk title'
    },
    {
        'url': 'https://example.com/job',
        'html': '<html><body><h1>Software Engineer</h1><p>Apply Now to get started!</p></body></html>',
        'expected': 'REJECT - too short'
    },
    {
        'url': 'https://example.com/login',
        'html': '<html><body><h1>Login Required</h1></body></html>',
        'expected': 'REJECT - login URL'
    },
]

async def test_validation():
    """Test the validation pipeline."""
    scraper = JobScraper()
    
    print("=== Testing Junk Filter ===\n")
    
    for i, test in enumerate(JUNK_TEST_CASES, 1):
        print(f"Test {i}: {test['expected']}")
        
        # Test URL validation
        if not scraper._validate_url(test['url']):
            print(f"  ✓ Rejected at URL stage\n")
            continue
        
        # Test HTML validation
        if not scraper._validate_html(test['html']):
            print(f"  ✓ Rejected at HTML stage\n")
            continue
        
        # Test extraction
        job_data = scraper._extract_structured_data(test['html'], test['url'])
        if not job_data:
            print(f"  ✓ Rejected at extraction stage\n")
            continue
        
        # Test semantic validation
        if not scraper._validate_semantic(job_data):
            print(f"  ✓ Rejected at semantic stage\n")
            continue
        
        print(f"  ✗ FAILED - Job was not rejected!\n")
    
    print("=== Test Complete ===")

if __name__ == "__main__":
    asyncio.run(test_validation())
