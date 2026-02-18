#!/usr/bin/env python3
"""
deduplication.py
Cross-source SHA-256 fingerprint middleware for deduplication.
"""

import hashlib
import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)


def normalize_location(location: Optional[str]) -> str:
    """
    Normalize location string for consistent fingerprinting.
    
    Handles variations like:
        "San Francisco, CA" -> "san francisco ca"
        "SF, California" -> "sf california"
        "Remote (US)" -> "remote us"
        "New York City, NY, USA" -> "new york city ny usa"
    """
    if not location:
        return ""
    
    # Lowercase
    normalized = location.lower()
    
    # Remove special characters but keep letters, numbers, spaces
    normalized = re.sub(r'[^\w\s]', ' ', normalized)
    
    # Collapse multiple spaces
    normalized = ' '.join(normalized.split())
    
    return normalized


def normalize_title(title: Optional[str]) -> str:
    """
    Normalize job title for consistent fingerprinting.
    
    Handles variations like:
        "Senior Software Engineer" -> "senior software engineer"
        "Sr. Developer (Remote)" -> "sr developer remote"
    """
    if not title:
        return ""
    
    normalized = title.lower().strip()
    normalized = re.sub(r'[^\w\s]', ' ', normalized)
    normalized = ' '.join(normalized.split())
    
    return normalized


def normalize_company(company: Optional[str]) -> str:
    """
    Normalize company name for consistent fingerprinting.
    
    Handles variations like:
        "Acme Corp." -> "acme corp"
        "ACME Corporation, Inc." -> "acme corporation inc"
    """
    if not company:
        return ""
    
    normalized = company.lower().strip()
    normalized = re.sub(r'[^\w\s]', ' ', normalized)
    normalized = ' '.join(normalized.split())
    
    return normalized


def generate_fingerprint(title: str, company: str, location: str) -> str:
    """
    Generate SHA-256 fingerprint for cross-source deduplication.
    
    The fingerprint is computed from normalized versions of:
    - Job title
    - Company name  
    - Location
    
    This ensures the same job posted on multiple boards
    (LinkedIn, Indeed, Hiring Cafe) is identified as duplicate.
    
    Args:
        title: Job title
        company: Company name
        location: Job location
        
    Returns:
        64-character hex SHA-256 digest
        
    Example:
        >>> generate_fingerprint("Sr Developer", "Acme", "SF, CA")
        >>> generate_fingerprint("Senior Developer", "Acme Corp", "San Francisco")
        # May or may not match depending on normalization
    """
    normalized_title = normalize_title(title)
    normalized_company = normalize_company(company)
    normalized_location = normalize_location(location)
    
    # Combine with pipe delimiter
    content = f"{normalized_title}|{normalized_company}|{normalized_location}"
    
    fingerprint = hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    logger.debug(
        f"Generated fingerprint: {fingerprint[:12]}... for "
        f"'{title}' @ '{company}' in '{location}'"
    )
    
    return fingerprint


class DeduplicationMiddleware:
    """
    Middleware that checks fingerprints against database before processing.
    
    This runs BEFORE the embedding step to avoid costly API calls
    for duplicate jobs.
    
    Usage in pipeline:
        middleware = DeduplicationMiddleware(database)
        if await middleware.is_duplicate(job):
            # Skip embedding and insertion
            continue
    """
    
    def __init__(self, database):
        """
        Initialize middleware with database connection.
        
        Args:
            database: Database instance with fingerprint_exists method
        """
        self.db = database
        self._cache = set()  # Local cache for current batch
    
    async def is_duplicate(
        self,
        title: str,
        company: str,
        location: str
    ) -> tuple[bool, str]:
        """
        Check if a job is a duplicate based on fingerprint.
        
        Args:
            title: Job title
            company: Company name
            location: Job location
            
        Returns:
            Tuple of (is_duplicate: bool, fingerprint: str)
        """
        fingerprint = generate_fingerprint(title, company, location)
        
        # Check local cache first (for batch deduplication)
        if fingerprint in self._cache:
            logger.info({
                "event": "duplicate_skipped",
                "reason": "batch_cache",
                "fingerprint": fingerprint[:12],
            })
            return True, fingerprint
        
        # Check database
        exists = await self.db.fingerprint_exists(fingerprint)
        
        if exists:
            logger.info({
                "event": "duplicate_skipped", 
                "reason": "database",
                "fingerprint": fingerprint[:12],
            })
            return True, fingerprint
        
        # Add to local cache
        self._cache.add(fingerprint)
        
        return False, fingerprint
    
    def clear_cache(self):
        """Clear the local batch cache."""
        self._cache.clear()
    
    async def process_job(self, job_data: dict) -> tuple[bool, str]:
        """
        Process a job dictionary and check for duplicates.
        
        Args:
            job_data: Dictionary with job_title, company_name, location keys
            
        Returns:
            Tuple of (should_process: bool, fingerprint: str)
        """
        title = job_data.get('job_title', '')
        company = job_data.get('company_name', '')
        location = job_data.get('location', '')
        
        is_dup, fingerprint = await self.is_duplicate(title, company, location)
        
        return not is_dup, fingerprint
