#!/usr/bin/env python3
"""
hiring_cafe.py
aiohttp-based spider targeting hiring.cafe's real API endpoints.

Discovery flow:
  1. Fetch homepage → extract Next.js build ID from __NEXT_DATA__
  2. POST /api/search-jobs → paginate through all job requisition IDs
  3. GET /_next/data/{buildId}/viewjob/{id}.json → full structured JSON per job
"""

import asyncio
import logging
import re
import time
from decimal import Decimal
from typing import AsyncIterator, Optional, Dict, Any, List
from datetime import datetime
from html import unescape

import aiohttp
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from models import ScrapedJob

logger = logging.getLogger(__name__)


def _html_to_text(html: str) -> str:
    """Lightweight HTML → plain text (no BeautifulSoup dependency)."""
    if not html:
        return ""
    # Remove tags
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
    text = re.sub(r"</(p|div|h[1-6]|li|tr)>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    # Decode HTML entities
    text = unescape(text)
    # Collapse whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


class HiringCafeSpider:
    """
    Production spider for hiring.cafe.

    Features:
    - Auto-discovers Next.js build ID (refreshes every cycle)
    - Paginates through all jobs via POST /api/search-jobs
    - Fetches full structured JSON per job (100+ fields)
    - Exponential backoff on 429s
    - Rate limiting (configurable RPM)
    - Uses requisition_id as natural dedup key
    """

    BASE = "https://hiring.cafe"
    SEARCH_URL = "https://hiring.cafe/api/search-jobs"
    COUNT_URL = "https://hiring.cafe/api/search-jobs/get-total-count"

    # Browser-like headers to avoid blocks
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://hiring.cafe",
        "Referer": "https://hiring.cafe/",
        "Content-Type": "application/json",
    }

    def __init__(
        self,
        requests_per_minute: int = 20,
        page_size: int = 50,
        max_pages: int = 500,
    ):
        self.min_interval = 60.0 / requests_per_minute
        self.page_size = page_size
        self.max_pages = max_pages
        self.last_request_time = 0.0

        self._session: Optional[aiohttp.ClientSession] = None
        self._build_id: Optional[str] = None

        # Metrics
        self.jobs_found = 0
        self.pages_scraped = 0
        self.detail_fetches = 0
        self.errors = 0

    # ─── Session Management ───────────────────────────────────────

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                headers=self.HEADERS,
                timeout=aiohttp.ClientTimeout(total=30),
            )
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
            logger.info("HiringCafe spider session closed")

    # ─── Rate Limiting ────────────────────────────────────────────

    async def _rate_limit(self):
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            await asyncio.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()

    # ─── Build ID Discovery ───────────────────────────────────────

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=5, max=60),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError)),
    )
    async def _discover_build_id(self) -> str:
        """Fetch homepage and extract Next.js buildId from __NEXT_DATA__."""
        await self._rate_limit()
        session = await self._get_session()

        async with session.get(
            self.BASE,
            headers={"Accept": "text/html"},
        ) as resp:
            if resp.status != 200:
                raise aiohttp.ClientError(f"Homepage returned {resp.status}")
            html = await resp.text()

        # Extract buildId from <script id="__NEXT_DATA__">{"buildId":"xxx",...}
        match = re.search(r'"buildId"\s*:\s*"([^"]+)"', html)
        if not match:
            raise ValueError("Could not find buildId in __NEXT_DATA__")

        build_id = match.group(1)
        logger.info({"event": "build_id_discovered", "build_id": build_id})
        return build_id

    async def _ensure_build_id(self):
        if not self._build_id:
            self._build_id = await self._discover_build_id()

    # ─── Search API ───────────────────────────────────────────────

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=3, max=120),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError)),
    )
    async def _search_page(self, offset: int) -> Dict[str, Any]:
        """POST /api/search-jobs to fetch a page of job cards."""
        await self._rate_limit()
        session = await self._get_session()

        payload = {
            "query": "",
            "offset": offset,
            "limit": self.page_size,
        }

        async with session.post(self.SEARCH_URL, json=payload) as resp:
            if resp.status == 429:
                retry_after = int(resp.headers.get("Retry-After", 60))
                logger.warning({"event": "rate_limited", "retry_after": retry_after})
                await asyncio.sleep(retry_after)
                raise aiohttp.ClientError("Rate limited")
            if resp.status != 200:
                logger.error({"event": "search_error", "status": resp.status})
                raise aiohttp.ClientError(f"Search returned {resp.status}")
            return await resp.json()

    async def _get_total_count(self) -> int:
        """Get total number of available jobs."""
        await self._rate_limit()
        session = await self._get_session()

        try:
            async with session.post(self.COUNT_URL, json={"query": ""}) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    total = data if isinstance(data, int) else data.get("total", data.get("count", 0))
                    logger.info({"event": "total_count", "total": total})
                    return total
        except Exception as e:
            logger.warning(f"Could not get total count: {e}")
        return 0

    # ─── Job Detail Fetch ─────────────────────────────────────────

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError)),
    )
    async def _fetch_job_detail(self, requisition_id: str) -> Optional[Dict[str, Any]]:
        """GET /_next/data/{buildId}/viewjob/{id}.json for full job data."""
        await self._ensure_build_id()
        await self._rate_limit()
        session = await self._get_session()

        url = (
            f"{self.BASE}/_next/data/{self._build_id}"
            f"/viewjob/{requisition_id}.json"
            f"?requisitionId={requisition_id}"
        )

        async with session.get(url) as resp:
            if resp.status == 404:
                # Build ID may have rotated — refresh and retry once
                logger.warning("Build ID stale, refreshing...")
                self._build_id = await self._discover_build_id()
                url = (
                    f"{self.BASE}/_next/data/{self._build_id}"
                    f"/viewjob/{requisition_id}.json"
                    f"?requisitionId={requisition_id}"
                )
                async with session.get(url) as retry_resp:
                    if retry_resp.status != 200:
                        return None
                    data = await retry_resp.json()
            elif resp.status == 429:
                retry_after = int(resp.headers.get("Retry-After", 30))
                await asyncio.sleep(retry_after)
                raise aiohttp.ClientError("Rate limited on detail")
            elif resp.status != 200:
                logger.debug(f"Detail fetch {resp.status} for {requisition_id}")
                return None
            else:
                data = await resp.json()

        self.detail_fetches += 1
        return data

    # ─── Parsing ──────────────────────────────────────────────────

    def _parse_job(self, raw: Dict[str, Any]) -> Optional[ScrapedJob]:
        """
        Parse the /_next/data JSON into a ScrapedJob.

        The JSON structure is:
        {
          "pageProps": {
            "job_information": {
              "title": ...,
              "requisition_id": ...,
              "apply_url": ...,
              "description": "<html>...",
              "v5_processed_job_data": {
                "yearly_min_compensation": ...,
                "yearly_max_compensation": ...,
                "workplace_type": "Remote" | "Onsite" | "Hybrid",
                "formatted_workplace_location": ...,
                "technical_tools": [...],
                "min_industry_and_role_yoe": ...,
              },
              "enriched_company_data": {
                "name": ...,
                "industries": [...],
              }
            }
          }
        }
        """
        try:
            page_props = raw.get("pageProps", {})
            job_info = page_props.get("job_information", page_props)

            title = job_info.get("title") or job_info.get("job_title_raw", "")
            requisition_id = job_info.get("requisition_id", "")

            if not title or not requisition_id:
                return None

            # Company
            company_data = job_info.get("enriched_company_data", {})
            company_name = (
                company_data.get("name")
                or job_info.get("company_name")
                or "Unknown"
            )

            # Description: HTML → plain text
            description_html = job_info.get("description", "")
            description = _html_to_text(description_html)
            if len(description) < 50:
                # Try alternate field
                description = job_info.get("description_clean", description)
            if len(description) < 50:
                logger.debug(f"Description too short for {requisition_id}")
                return None

            # Processed data
            v5 = job_info.get("v5_processed_job_data", {})

            # Salary
            salary_min = v5.get("yearly_min_compensation")
            salary_max = v5.get("yearly_max_compensation")

            # Location & remote
            workplace_type = (v5.get("workplace_type") or "").lower()
            is_remote = workplace_type == "remote"
            location = (
                v5.get("formatted_workplace_location")
                or job_info.get("location")
                or ("Remote" if is_remote else None)
            )

            # Skills
            technical_tools = v5.get("technical_tools", [])
            if isinstance(technical_tools, list):
                skills = [str(t) for t in technical_tools if t]
            else:
                skills = []

            # Experience
            min_yoe = v5.get("min_industry_and_role_yoe")
            experience = f"{min_yoe}+ years" if min_yoe else None

            # Job type
            job_type = job_info.get("employment_type") or v5.get("employment_type")

            # Apply URL
            apply_url = job_info.get("apply_url") or f"{self.BASE}/viewjob/{requisition_id}"

            return ScrapedJob(
                title=title,
                company_name=company_name,
                description=description,
                location=location,
                salary_min=Decimal(str(salary_min)) if salary_min else None,
                salary_max=Decimal(str(salary_max)) if salary_max else None,
                job_type=job_type,
                remote=is_remote,
                source="hiring_cafe",
                source_url=apply_url,
                skills_required=skills,
                experience_required=experience,
                is_active=True,
                requisition_id=requisition_id,
                meta={
                    "workplace_type": workplace_type,
                    "industries": company_data.get("industries", []),
                    "hq_country": company_data.get("hq_country"),
                    "nb_employees": company_data.get("nb_employees"),
                },
            )

        except Exception as e:
            logger.error(f"Parse error: {e}")
            self.errors += 1
            return None

    def _parse_search_card(self, card: Dict[str, Any]) -> Optional[str]:
        """Extract requisition_id from a search result card."""
        return card.get("requisition_id") or card.get("objectID")

    # ─── Main Scrape Flow ─────────────────────────────────────────

    async def scrape(
        self,
        known_ids: Optional[set] = None,
    ) -> AsyncIterator[ScrapedJob]:
        """
        Full scrape: discover IDs via search, fetch details, yield ScrapedJobs.

        Args:
            known_ids: Set of requisition_ids already in DB (skip these)
        """
        known = known_ids or set()

        logger.info({"event": "scrape_start", "source": "hiring_cafe"})
        start_time = datetime.utcnow()

        # Step 1: Discover build ID
        await self._ensure_build_id()

        # Step 2: Get total count
        total = await self._get_total_count()

        # Step 3: Paginate search results
        offset = 0
        page_num = 0
        all_req_ids: List[str] = []

        while page_num < self.max_pages:
            try:
                page_data = await self._search_page(offset)
            except Exception as e:
                logger.error({"event": "search_page_error", "offset": offset, "error": str(e)})
                self.errors += 1
                break

            # Extract job cards — handle various response shapes
            hits = (
                page_data.get("hits")
                or page_data.get("jobs")
                or page_data.get("data")
                or []
            )

            if not hits:
                logger.info({"event": "pagination_complete", "pages": page_num})
                break

            for card in hits:
                req_id = self._parse_search_card(card)
                if req_id and req_id not in known:
                    all_req_ids.append(req_id)

            self.pages_scraped += 1
            page_num += 1
            offset += self.page_size

            # Check if we've reached the end
            if total and offset >= total:
                logger.info(f"Reached total {total} jobs")
                break

        logger.info({
            "event": "discovery_complete",
            "total_ids": len(all_req_ids),
            "pages_scraped": self.pages_scraped,
        })

        # Step 4: Fetch details in batches
        batch_size = 5
        for i in range(0, len(all_req_ids), batch_size):
            batch = all_req_ids[i : i + batch_size]
            tasks = [self._fetch_job_detail(rid) for rid in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for rid, result in zip(batch, results):
                if isinstance(result, Exception):
                    logger.error(f"Detail fetch failed for {rid}: {result}")
                    self.errors += 1
                    continue
                if result is None:
                    continue

                job = self._parse_job(result)
                if job:
                    self.jobs_found += 1
                    yield job

        duration = (datetime.utcnow() - start_time).total_seconds()
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
        """Scrape all jobs and return as list."""
        jobs = []
        async for job in self.scrape(known_ids):
            jobs.append(job)
        return jobs

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "source": "hiring_cafe",
            "jobs_found": self.jobs_found,
            "pages_scraped": self.pages_scraped,
            "detail_fetches": self.detail_fetches,
            "errors": self.errors,
        }
