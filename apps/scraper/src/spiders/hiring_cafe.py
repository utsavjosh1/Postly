#!/usr/bin/env python3
"""
hiring_cafe.py
aiohttp-based spider for hiring.cafe's API.

Scraping flow:
  1. GET homepage → extract Next.js buildId from __NEXT_DATA__
  2. GET /api/search-jobs?offset=N&limit=M → paginate job card IDs
  3. GET /_next/data/{buildId}/viewjob/{id}.json → full structured JSON per job
"""

import asyncio
import logging
import re
import time
from decimal import Decimal, InvalidOperation
from typing import AsyncIterator, Optional, Dict, Any, List
from datetime import datetime, timezone
from html import unescape

import aiohttp
import json
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from playwright.async_api import async_playwright, Playwright, Browser, BrowserContext, Page, Error as PlaywrightError

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from models import ScrapedJob

logger = logging.getLogger(__name__)

# ─── Helpers ──────────────────────────────────────────────────────

_BLOCK_TAG_RE = re.compile(r"</(p|div|h[1-6]|li|tr)>", re.I)
_BR_TAG_RE = re.compile(r"<br\s*/?>", re.I)
_ALL_TAGS_RE = re.compile(r"<[^>]+>")
_MULTI_SPACE_RE = re.compile(r"[ \t]+")
_MULTI_NEWLINE_RE = re.compile(r"\n{3,}")


def _html_to_text(html: str) -> str:
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


def _safe_decimal(value: Any) -> Optional[Decimal]:
    """Safely convert a value to Decimal, returning None on failure."""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


# ─── Spider ───────────────────────────────────────────────────────


class HiringCafeSpider:
    """
    Production spider for hiring.cafe.

    Uses the site's public API to discover and fetch job data:
    - GET /api/search-jobs for paginated search
    - GET /api/search-jobs/get-total-count for total count
    - GET /_next/data/{buildId}/viewjob/{id}.json for full job details

    Features:
    - Auto-discovers and refreshes Next.js build ID each cycle
    - Configurable rate limiting (RPM)
    - Exponential backoff on 429 / transient errors
    - Requisition ID as natural dedup key
    """

    BASE = "https://hiring.cafe"
    SEARCH_URL = "https://hiring.cafe/api/search-jobs"
    COUNT_URL = "https://hiring.cafe/api/search-jobs/get-total-count"

    _BROWSER_HEADERS: Dict[str, str] = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://hiring.cafe",
        "Referer": "https://hiring.cafe/",
    }

    _BUILD_ID_RE = re.compile(r'"buildId"\s*:\s*"([^"]+)"')

    def __init__(
        self,
        requests_per_minute: int = 20,
        page_size: int = 50,
        max_pages: int = 500,
    ):
        self._min_interval = 60.0 / requests_per_minute
        self._page_size = page_size
        self._max_pages = max_pages
        self._last_request_at = 0.0

        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None
        self._build_id: Optional[str] = None

        # Metrics — reset between cycles by the orchestrator
        self.jobs_found = 0
        self.pages_scraped = 0
        self.detail_fetches = 0
        self.errors = 0

    # ─── Session ──────────────────────────────────────────────────

    async def _get_page(self) -> Page:
        if not self._page:
            try:
                if not self._playwright:
                    self._playwright = await async_playwright().start()
                if not self._browser:
                    self._browser = await self._playwright.chromium.launch(
                        headless=True,
                        args=[
                            "--disable-blink-features=AutomationControlled",
                            "--no-sandbox",
                            "--disable-setuid-sandbox",
                            "--disable-dev-shm-usage",
                        ],
                    )
                if not self._context:
                    self._context = await self._browser.new_context(
                        user_agent=self._BROWSER_HEADERS["User-Agent"],
                        viewport={"width": 1280, "height": 800}
                    )
                if not self._page:
                    self._page = await self._context.new_page()
            except Exception as e:
                # Need to clean up state so we truly retry from scratch
                logger.error(f"Playwright initialization failed: {e}")
                if self._playwright:
                    await self._playwright.stop()
                    self._playwright = None
                self._browser = None
                self._context = None
                self._page = None
                raise e
        return self._page

    async def close(self) -> None:
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
            logger.info("Spider Playwright session closed")

    # ─── Rate Limiting ────────────────────────────────────────────

    async def _throttle(self) -> None:
        """Enforce minimum interval between outbound requests."""
        elapsed = time.monotonic() - self._last_request_at
        if elapsed < self._min_interval:
            await asyncio.sleep(self._min_interval - elapsed)
        self._last_request_at = time.monotonic()

    # ─── Build ID ─────────────────────────────────────────────────

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=5, max=60),
        retry=retry_if_exception_type((PlaywrightError, asyncio.TimeoutError)),
    )
    async def _discover_build_id(self) -> str:
        """Fetch the homepage and extract the Next.js buildId."""
        await self._throttle()
        page = await self._get_page()

        response = await page.goto(self.BASE, wait_until="domcontentloaded")
        if not response or not response.ok:
            raise PlaywrightError(f"Homepage returned {response.status if response else 'None'}")
        
        html = await page.content()

        match = self._BUILD_ID_RE.search(html)
        if not match:
            raise ValueError("Could not find buildId in __NEXT_DATA__")

        build_id = match.group(1)
        logger.info({"event": "build_id_discovered", "build_id": build_id})
        return build_id

    async def _ensure_build_id(self) -> None:
        if not self._build_id:
            self._build_id = await self._discover_build_id()

    async def _refresh_build_id(self) -> None:
        """Force-refresh the build ID (e.g. after a 404 on detail fetch)."""
        old = self._build_id
        self._build_id = await self._discover_build_id()
        if self._build_id != old:
            logger.info({
                "event": "build_id_rotated",
                "old": old,
                "new": self._build_id,
            })

    # ─── Search API ───────────────────────────────────────────────

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=3, max=120),
        retry=retry_if_exception_type((PlaywrightError, asyncio.TimeoutError)),
    )
    async def _search_page(self, offset: int) -> Dict[str, Any]:
        """GET /api/search-jobs with query params for a page of results."""
        await self._throttle()
        page = await self._get_page()

        url = f"{self.SEARCH_URL}?offset={offset}&limit={self._page_size}"
        
        response = await page.goto(url, wait_until="domcontentloaded")
        if response.status == 429:
            retry_after = 60
            logger.warning({"event": "rate_limited", "retry_after": retry_after})
            await asyncio.sleep(retry_after)
            raise PlaywrightError("Rate limited on search")

        if not response.ok:
            logger.error({"event": "search_error", "status": response.status})
            raise PlaywrightError(f"Search returned {response.status}")

        text = await page.evaluate("document.body.innerText")
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            raise PlaywrightError("Failed to parse search JSON")

    async def _get_total_count(self) -> int:
        """GET /api/search-jobs/get-total-count → total available jobs."""
        await self._throttle()
        page = await self._get_page()

        try:
            response = await page.goto(self.COUNT_URL, wait_until="domcontentloaded")
            if response and response.ok:
                text = await page.evaluate("document.body.innerText")
                data = json.loads(text)
                # Response shape: { "total": 114789, "collapsedTotal": 4047 }
                if isinstance(data, int):
                    total = data
                elif isinstance(data, dict):
                    total = data.get("total", data.get("count", 0))
                else:
                    total = 0
                logger.info({"event": "total_count", "total": total})
                return total
        except Exception as exc:
            logger.warning(f"Could not get total count: {exc}")
        return 0

    # ─── Job Detail ───────────────────────────────────────────────

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((PlaywrightError, asyncio.TimeoutError)),
    )
    async def _fetch_job_detail(self, requisition_id: str) -> Optional[Dict[str, Any]]:
        """
        GET /viewjob/{id} and extract __NEXT_DATA__
        """
        await self._ensure_build_id()
        await self._throttle()
        page = await self._get_page()

        url = f"{self.BASE}/viewjob/{requisition_id}"

        try:
            response = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
        except Exception as e:
            logger.warning(f"Timeout or error fetching detail for {requisition_id}: {e}")
            self.errors += 1
            return None

        if response and response.ok:
            self.detail_fetches += 1
            html = await page.content()
            match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(1))
                    return data.get("props", {})
                except json.JSONDecodeError:
                    return None
            return None

        if response and response.status == 429:
            await asyncio.sleep(30)
            raise PlaywrightError("Rate limited on detail")

        logger.debug(f"Detail {response.status if response else 'None'} for {requisition_id}")
        return None

    # ─── Parsing ──────────────────────────────────────────────────

    @staticmethod
    def _extract_requisition_id(card: Dict[str, Any]) -> Optional[str]:
        """Extract requisition_id from a search result card."""
        return card.get("requisition_id") or card.get("objectID")

    def _parse_job(self, raw: Dict[str, Any]) -> Optional[ScrapedJob]:
        """Parse raw job detail JSON into ScrapedJob."""
        try:
            if not raw:
                return None
            
            # Start with the main props
            data = raw.get("pageProps", raw)
            
            # Merge nested job info if present, but keep parent fields
            for key in ["job", "job_information"]:
                nested = data.get(key)
                if isinstance(nested, dict):
                    # Shallow merge: nested fields overwrite parent but we keep what's unique
                    # This ensures we get 'requisition_id' from parent and 'title' from child
                    merged = data.copy()
                    merged.update(nested)
                    data = merged

            title = (
                data.get("title")
                or data.get("job_title")
                or data.get("job_title_raw")
                or ""
            )
            requisition_id = (
                data.get("requisition_id")
                or data.get("requisitionId")
                or data.get("id")
                or data.get("objectID")
                or ""
            )

            if not title or not requisition_id:
                logger.debug(f"Parsing failed: missing title or id. keys: {list(data.keys())}")
                return None

            # Company
            company_data = (
                data.get("enriched_company_data")
                or data.get("company_data")
                or {}
            )
            company_name = (
                company_data.get("name")
                or data.get("company_name")
                or data.get("company")
                or "Unknown"
            )

            # Description: HTML → plain text
            description_html = (
                data.get("description")
                or data.get("job_description_html")
                or data.get("job_description", "")
            )
            description = _html_to_text(description_html)

            # Fall back to alternate field
            if len(description) < 10:
                description = data.get("description_clean") or data.get("job_description_text") or description
            
            if len(description) < 10:
                logger.debug(f"Description too short for {requisition_id}. Content: {description[:50]}")
                return None

            # Processed data
            v5 = data.get("v5_processed_job_data") or data.get("processed_data") or {}

            # Salary
            salary_min = _safe_decimal(v5.get("yearly_min_compensation") or data.get("yearly_min_compensation"))
            salary_max = _safe_decimal(v5.get("yearly_max_compensation") or data.get("yearly_max_compensation"))

            # Location & remote
            workplace_type = (v5.get("workplace_type") or "").lower()
            is_remote = workplace_type == "remote"
            location = (
                v5.get("formatted_workplace_location")
                or data.get("location")
                or ("Remote" if is_remote else None)
            )

            # Skills
            raw_tools = v5.get("technical_tools") or data.get("skills_required") or []
            skills = [str(t) for t in raw_tools if t] if isinstance(raw_tools, list) else []

            # Experience
            min_yoe = v5.get("min_industry_and_role_yoe")
            experience = f"{min_yoe}+ years" if min_yoe else None

            # Job type
            job_type = data.get("employment_type") or v5.get("employment_type")

            # Apply URL
            apply_url = (
                data.get("apply_url")
                or f"{self.BASE}/viewjob/{requisition_id}"
            )

            job = ScrapedJob(
                title=title,
                company_name=company_name,
                description=description,
                location=location,
                salary_min=salary_min,
                salary_max=salary_max,
                job_type=job_type,
                remote=is_remote,
                source="hiring_cafe",
                source_url=apply_url,
                skills_required=skills,
                experience_required=experience,
                is_active=True,
                requisition_id=str(requisition_id),
                meta={
                    "workplace_type": workplace_type,
                    "industries": company_data.get("industries", []),
                    "hq_country": company_data.get("hq_country"),
                    "nb_employees": company_data.get("nb_employees"),
                },
            )
            logger.debug(f"Parsed job successfully: {job.title} | {job.company_name}")
            return job

        except Exception as exc:
            logger.error(f"Parse error: {exc}", exc_info=True)
            self.errors += 1
            return None

    # ─── Main Scrape Flow ─────────────────────────────────────────

    async def scrape(
        self,
        known_ids: Optional[set] = None,
    ) -> AsyncIterator[ScrapedJob]:
        """
        Full scrape cycle: discover IDs via search → fetch details → yield jobs.

        Args:
            known_ids: Set of requisition_ids already in DB (skip these).
        """
        known = known_ids or set()

        logger.info({"event": "scrape_start", "source": "hiring_cafe"})
        start_time = datetime.now(timezone.utc)

        # Step 1: Discover build ID
        await self._ensure_build_id()

        # Step 2: Get total count for progress logging
        total = await self._get_total_count()

        # Step 3: Paginate search results to collect requisition IDs
        offset = 0
        page_num = 0
        all_req_ids: List[str] = []

        while page_num < self._max_pages:
            try:
                page_data = await self._search_page(offset)
            except Exception as exc:
                logger.error({
                    "event": "search_page_error",
                    "offset": offset,
                    "error": str(exc),
                })
                self.errors += 1
                break

            hits = page_data.get("results") or page_data.get("hits") or []

            if not hits:
                logger.info({"event": "pagination_complete", "pages": page_num})
                break

            page_req_ids = []
            for card in hits:
                req_id = self._extract_requisition_id(card)
                if req_id and req_id not in known:
                    page_req_ids.append(req_id)
                    all_req_ids.append(req_id) # keep for final metrics

            # Immediately fetch details for this page's new IDs
            if page_req_ids:
                logger.info(f"Discovered {len(page_req_ids)} new jobs on page {page_num + 1}. Fetching details...")
                for rid in page_req_ids:
                    try:
                        result = await self._fetch_job_detail(rid)
                        if result:
                            job = self._parse_job(result)
                            if job:
                                self.jobs_found += 1
                                yield job
                    except Exception as exc:
                        logger.error(f"Detail fetch failed for {rid}: {exc}")
                        self.errors += 1

            self.pages_scraped += 1
            page_num += 1
            offset += self._page_size
            
            if page_num % 5 == 0:
                logger.info(f"Progress: {page_num}/{self._max_pages} search pages processed. Total found: {self.jobs_found}")
                
            if total and offset >= total:
                logger.info(f"Reached total {total} jobs")
                break

        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        logger.info({
            "event": "scrape_complete",
            "source": "hiring_cafe",
            "jobs_found": self.jobs_found,
            "pages_scraped": self.pages_scraped,
            "detail_fetches": self.detail_fetches,
            "errors": self.errors,
            "duration_seconds": round(duration, 2),
        })

    async def scrape_all(
        self,
        known_ids: Optional[set] = None,
    ) -> List[ScrapedJob]:
        """Scrape all jobs and return as a list."""
        jobs: List[ScrapedJob] = []
        async for job in self.scrape(known_ids):
            jobs.append(job)
        return jobs

    def get_metrics(self) -> Dict[str, Any]:
        """Return current cycle metrics."""
        return {
            "source": "hiring_cafe",
            "jobs_found": self.jobs_found,
            "pages_scraped": self.pages_scraped,
            "detail_fetches": self.detail_fetches,
            "errors": self.errors,
        }
