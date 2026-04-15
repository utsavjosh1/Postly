#!/usr/bin/env python3
"""
base.py
Abstract base spider with shared field extraction utilities.

All spiders inherit from BaseSpider, which provides:
- HTML → plaintext conversion
- YOE (years of experience) regex extraction
- Salary range regex extraction from free text
- Remote/onsite/hybrid detection
- Job type detection (full-time, part-time, contract)
- Rate limiting
- Metrics tracking
"""

import asyncio
import logging
import re
import time
from abc import ABC, abstractmethod
from decimal import Decimal, InvalidOperation
from html import unescape
from typing import AsyncIterator, Optional, Set, Tuple, Any

import aiohttp

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import ScrapedJob

logger = logging.getLogger(__name__)

# ─── HTML Cleaning ────────────────────────────────────────────────

_BLOCK_TAG_RE = re.compile(r"</(p|div|h[1-6]|li|tr|br)>", re.I)
_BR_TAG_RE = re.compile(r"<br\s*/?>", re.I)
_ALL_TAGS_RE = re.compile(r"<[^>]+>")
_MULTI_SPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")


def html_to_text(html: str) -> str:
    """Convert HTML to plain text without external dependencies."""
    if not html:
        return ""
    text = _BR_TAG_RE.sub("\n", html)
    text = _BLOCK_TAG_RE.sub("\n", text)
    text = _ALL_TAGS_RE.sub(" ", text)
    text = unescape(text)
    text = _MULTI_SPACE_RE.sub(" ", text)
    text = _MULTI_NEWLINE_RE.sub("\n\n", text)
    return text.strip()


# ─── Field Extraction ─────────────────────────────────────────────

# Matches patterns like: "3+ years", "5-7 years", "2 years of experience",
# "minimum 3 years", "at least 5+ years", "3-5 yrs"
_YOE_PATTERNS = [
    # "3-5 years" range — MUST be before single-number patterns
    re.compile(r"(\d+)\s*[-–—to]+\s*(\d+)\s*(?:years?|yrs?)", re.I),
    # "minimum 3 years" / "at least 3 years"
    re.compile(r"(?:minimum|min|at\s+least)\s*(\d+)\s*(?:years?|yrs?)", re.I),
    # "5+ years of experience"
    re.compile(r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)", re.I),
    # "3+ years" standalone
    re.compile(r"(\d+)\+\s*(?:years?|yrs?)", re.I),
    # "experience: 3 years" or "experience required: 5 years"
    re.compile(r"experience\s*(?:required)?\s*:?\s*(\d+)\s*(?:years?|yrs?)", re.I),
]

# Salary patterns — matches "$80,000", "$80k", "$120,000 - $150,000", "80k-120k"
_SALARY_PATTERNS = [
    # "$80,000 - $150,000" or "$80,000-$150,000" or "$80k - $150k"
    re.compile(
        r"\$\s*([\d,]+(?:\.\d+)?)\s*[kK]?\s*[-–—to]+\s*\$?\s*([\d,]+(?:\.\d+)?)\s*[kK]?",
        re.I,
    ),
    # "80k-150k" without dollar sign
    re.compile(
        r"([\d,]+)\s*[kK]\s*[-–—to]+\s*([\d,]+)\s*[kK]",
        re.I,
    ),
    # Single salary "$120,000" or "$120k"
    re.compile(r"\$\s*([\d,]+(?:\.\d+)?)\s*[kK]?", re.I),
]

_REMOTE_KEYWORDS = {
    "remote", "work from home", "wfh", "fully remote",
    "100% remote", "remote-first", "remote first",
    "work remotely", "anywhere", "distributed",
}

_ONSITE_KEYWORDS = {
    "on-site", "onsite", "on site", "in-office", "in office",
    "office-based", "office based",
}

_HYBRID_KEYWORDS = {
    "hybrid", "flex", "flexible location",
}


def extract_yoe(text: str) -> Optional[str]:
    """
    Extract years of experience from free text.
    Returns strings like "3+ years", "5-7 years", or None.
    """
    if not text:
        return None

    for pattern in _YOE_PATTERNS:
        match = pattern.search(text)
        if match:
            groups = match.groups()
            if len(groups) == 2 and groups[1]:
                return f"{groups[0]}-{groups[1]} years"
            return f"{groups[0]}+ years"

    return None


def extract_salary(text: str) -> Tuple[Optional[Decimal], Optional[Decimal]]:
    """
    Extract salary range from free text.
    Returns (min, max) as Decimal, normalizing 'k' to thousands.
    """
    if not text:
        return None, None

    for pattern in _SALARY_PATTERNS:
        match = pattern.search(text)
        if match:
            groups = match.groups()
            try:
                values = []
                for g in groups:
                    if g:
                        # Remove commas
                        clean = g.replace(",", "")
                        val = Decimal(clean)
                        # Check if the original text had 'k' after this number
                        pos = match.end()
                        suffix = text[match.start():pos + 5].lower()
                        if "k" in suffix and val < 1000:
                            val *= 1000
                        values.append(val)

                if len(values) == 2:
                    return min(values), max(values)
                elif len(values) == 1:
                    return values[0], None
            except (InvalidOperation, ValueError):
                continue

    return None, None


def safe_decimal(value: Any) -> Optional[Decimal]:
    """Safely convert a value to Decimal, returning None on failure."""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def detect_remote(text: str, location: Optional[str] = None) -> bool:
    """
    Detect if a job is remote based on text content and location.
    """
    combined = f"{text or ''} {location or ''}".lower()

    for keyword in _REMOTE_KEYWORDS:
        if keyword in combined:
            return True

    return False


def detect_job_type(text: str) -> Optional[str]:
    """
    Detect job type from text. Returns normalized string.
    Uses word boundary matching to avoid false positives
    (e.g., 'international' should NOT match 'internship').
    """
    if not text:
        return None

    lower = text.lower()

    if "full-time" in lower or "full time" in lower or "fulltime" in lower:
        return "full_time"
    if "part-time" in lower or "part time" in lower or "parttime" in lower:
        return "part_time"
    if "contract" in lower or "freelance" in lower:
        return "contract"
    # Use regex word boundary to avoid 'international' / 'internal' matching
    if re.search(r'\binternship\b', lower):
        return "internship"
    if re.search(r'\bintern\b', lower) and not re.search(r'\bintern(al|ation)', lower):
        return "internship"
    if "temporary" in lower or re.search(r'\btemp\b', lower):
        return "temporary"

    return None


def detect_workplace_type(text: str, location: Optional[str] = None) -> str:
    """
    Detect workplace type: 'remote', 'hybrid', or 'onsite'.
    """
    combined = f"{text or ''} {location or ''}".lower()

    for keyword in _REMOTE_KEYWORDS:
        if keyword in combined:
            return "remote"

    for keyword in _HYBRID_KEYWORDS:
        if keyword in combined:
            return "hybrid"

    for keyword in _ONSITE_KEYWORDS:
        if keyword in combined:
            return "onsite"

    return "onsite"  # Default assumption


# ─── Base Spider ──────────────────────────────────────────────────


class BaseSpider(ABC):
    """
    Abstract base for all API-based spiders.

    Provides:
    - aiohttp session management
    - Rate limiting
    - Metrics tracking
    - Shared field extraction methods
    """

    SOURCE_NAME: str = "unknown"

    def __init__(self, requests_per_minute: int = 20):
        self._min_interval = 60.0 / requests_per_minute
        self._last_request_at = 0.0
        self._session: Optional[aiohttp.ClientSession] = None

        # Metrics — reset between cycles by the orchestrator
        self.jobs_found = 0
        self.pages_scraped = 0
        self.errors = 0

    async def _ensure_session(self) -> aiohttp.ClientSession:
        """Lazily create an aiohttp session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/131.0.0.0 Safari/537.36"
                    ),
                    "Accept": "application/json",
                },
                timeout=aiohttp.ClientTimeout(total=30),
            )
        return self._session

    async def _throttle(self) -> None:
        """Enforce minimum interval between outbound requests."""
        elapsed = time.monotonic() - self._last_request_at
        if elapsed < self._min_interval:
            await asyncio.sleep(self._min_interval - elapsed)
        self._last_request_at = time.monotonic()

    async def _get_json(self, url: str, params: dict = None) -> Optional[dict]:
        """GET a URL and return parsed JSON, with rate limiting and error handling."""
        await self._throttle()
        session = await self._ensure_session()

        try:
            async with session.get(url, params=params) as resp:
                if resp.status == 429:
                    retry_after = int(resp.headers.get("Retry-After", 60))
                    logger.warning(f"[{self.SOURCE_NAME}] Rate limited. Waiting {retry_after}s...")
                    await asyncio.sleep(retry_after)
                    return None

                if resp.status != 200:
                    logger.warning(f"[{self.SOURCE_NAME}] GET {url} returned {resp.status}")
                    return None

                return await resp.json()

        except asyncio.TimeoutError:
            logger.warning(f"[{self.SOURCE_NAME}] Timeout on {url}")
            self.errors += 1
            return None
        except Exception as e:
            logger.error(f"[{self.SOURCE_NAME}] Request failed: {e}")
            self.errors += 1
            return None

    @abstractmethod
    async def scrape(
        self, known_ids: Optional[Set[str]] = None
    ) -> AsyncIterator[ScrapedJob]:
        """Scrape all jobs. Yields ScrapedJob objects."""
        ...

    async def scrape_all(self, known_ids: Optional[Set[str]] = None) -> list:
        """Scrape all jobs and return as a list."""
        jobs = []
        async for job in self.scrape(known_ids):
            jobs.append(job)
        return jobs

    async def close(self) -> None:
        """Close the aiohttp session."""
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None

    def get_metrics(self) -> dict:
        """Return current cycle metrics."""
        return {
            "source": self.SOURCE_NAME,
            "jobs_found": self.jobs_found,
            "pages_scraped": self.pages_scraped,
            "errors": self.errors,
        }
