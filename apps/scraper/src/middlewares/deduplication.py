#!/usr/bin/env python3
"""
deduplication.py
Lightweight dedup — uses requisition_id / source_url for uniqueness.

SHA-256 fingerprinting removed — hiring.cafe provides stable IDs.
"""

import logging
from typing import Optional, Set

logger = logging.getLogger(__name__)


class DeduplicationCache:
    """
    In-memory + DB dedup for the current scrape cycle.
    Checks source_url uniqueness before inserting.
    """

    def __init__(self, database=None):
        self.db = database
        self._seen: Set[str] = set()  # URLs seen in current batch
        self._db_urls: Optional[Set[str]] = None  # Cached from DB

    async def load_from_db(self, source: str = "hiring_cafe"):
        """Pre-load existing source_urls from the database."""
        if self.db and self._db_urls is None:
            self._db_urls = await self.db.get_existing_source_urls(source)
            logger.info(f"Loaded {len(self._db_urls)} existing URLs for dedup")

    def is_duplicate(self, source_url: str) -> bool:
        """Check if a URL has already been seen or exists in DB."""
        if not source_url:
            return False

        # Check batch cache
        if source_url in self._seen:
            return True

        # Check DB cache
        if self._db_urls and source_url in self._db_urls:
            return True

        return False

    def mark_seen(self, source_url: str):
        """Mark a URL as seen in the current batch."""
        if source_url:
            self._seen.add(source_url)

    def clear_batch(self):
        """Clear the current batch cache (keep DB cache)."""
        self._seen.clear()

    def clear_all(self):
        """Clear all caches."""
        self._seen.clear()
        self._db_urls = None
