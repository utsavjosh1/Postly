#!/usr/bin/env python3
"""
greenhouse.py
Spider for Greenhouse ATS public job board API.

Endpoint: https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
- Free, no auth, no Cloudflare
- Returns richly structured job data per company
- Targets curated list of high-profile tech companies
"""

import logging
from datetime import datetime, timezone
from typing import AsyncIterator, Optional, Set, List

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import ScrapedJob
from spiders.base import (
    BaseSpider,
    html_to_text,
    extract_yoe,
    extract_salary,
    detect_remote,
    detect_job_type,
    safe_decimal,
)

logger = logging.getLogger(__name__)

# Curated list of high-profile companies with public Greenhouse boards.
# Board tokens are typically the company subdomain on greenhouse.
# Add/remove companies as needed — these are all verified public boards.
COMPANY_BOARDS = [
    # Big Tech / Unicorns
    "stripe",
    "figma",
    "notion",
    "cloudflare",
    "datadog",
    "vercel",
    "linear",
    "supabase",
    "dbt labs",
    "airbyte",
    "gitlabcom",
    "hashicorp",
    "confluent",
    "snyk",
    # Growth Stage
    "postman",
    "retool",
    "airtable",
    "mux",
    "render",
    "sentry",
    "grafanalabs",
    "planetscale",
    "railway",
    # Enterprise
    "twilio",
    "gusto",
    "brex",
    "ramp",
    "navan",
    "plaid",
    "benchling",
    "vanta",
]


class GreenhouseSpider(BaseSpider):
    """
    Production spider for Greenhouse ATS public job boards.

    Features:
    - Pure aiohttp — no browser, no Playwright, zero Cloudflare friction
    - Iterates through curated list of company boards
    - Returns richest structured data: departments, offices, content (HTML)
    - Parses compensation, YOE, remote status from content
    """

    SOURCE_NAME = "greenhouse"
    API_BASE = "https://boards-api.greenhouse.io/v1/boards"

    def __init__(
        self,
        requests_per_minute: int = 30,
        company_boards: Optional[List[str]] = None,
    ):
        super().__init__(requests_per_minute=requests_per_minute)
        self.boards = company_boards or COMPANY_BOARDS

    def _parse_job(self, raw: dict, board_token: str) -> Optional[ScrapedJob]:
        """Parse a Greenhouse API job object into a ScrapedJob."""
        try:
            gh_id = raw.get("id")
            title = (raw.get("title") or "").strip()

            if not title or not gh_id:
                return None

            # Content — Greenhouse provides rich HTML content
            content_html = raw.get("content", "")
            description = html_to_text(content_html)
            if len(description) < 10:
                return None

            # Company name — from the board token, capitalized
            company_name = board_token.replace("-", " ").replace("_", " ").title()

            # Location — from offices and location fields
            location_obj = raw.get("location", {}) or {}
            location_name = location_obj.get("name", "")

            offices = raw.get("offices", []) or []
            if not location_name and offices:
                office_names = [o.get("name", "") for o in offices if o.get("name")]
                location_name = ", ".join(office_names[:3])

            # Remote detection — from location and content
            is_remote = detect_remote(description, location_name)

            # Departments → skills/categories
            departments = raw.get("departments", []) or []
            dept_names = [d.get("name", "") for d in departments if d.get("name")]

            # Job URL
            source_url = raw.get("absolute_url", "")
            if not source_url:
                source_url = f"https://boards.greenhouse.io/{board_token}/jobs/{gh_id}"

            # Salary — extract from content
            salary_min, salary_max = extract_salary(description[:5000])

            # Check metadata for compensation (some boards include it)
            metadata = raw.get("metadata", []) or []
            for meta in metadata:
                if meta.get("name", "").lower() in ("compensation", "salary", "pay"):
                    comp_text = str(meta.get("value", ""))
                    if comp_text:
                        s_min, s_max = extract_salary(comp_text)
                        if s_min:
                            salary_min = s_min
                        if s_max:
                            salary_max = s_max

            # YOE — extract from content
            yoe = extract_yoe(description)

            # Job type — from content
            job_type = detect_job_type(description[:2000])

            # Posted date
            posted_at = None
            updated_at_str = raw.get("updated_at") or raw.get("first_published_at")
            if updated_at_str:
                try:
                    posted_at = datetime.fromisoformat(
                        updated_at_str.replace("Z", "+00:00")
                    )
                except (ValueError, AttributeError):
                    pass

            return ScrapedJob(
                title=title,
                company_name=company_name,
                description=description,
                location=location_name or ("Remote" if is_remote else None),
                salary_min=salary_min,
                salary_max=salary_max,
                job_type=job_type,
                remote=is_remote,
                source=self.SOURCE_NAME,
                source_url=source_url,
                skills_required=dept_names,
                experience_required=yoe,
                posted_at=posted_at,
                is_active=True,
                requisition_id=f"gh-{board_token}-{gh_id}",
            )

        except Exception as e:
            logger.error(f"[greenhouse] Parse error for {board_token}: {e}", exc_info=True)
            self.errors += 1
            return None

    async def _scrape_board(
        self, board_token: str, known: Set[str]
    ) -> AsyncIterator[ScrapedJob]:
        """Scrape all jobs from a single Greenhouse board."""
        url = f"{self.API_BASE}/{board_token}/jobs"
        data = await self._get_json(url, params={"content": "true"})

        if not data:
            return

        jobs_list = data.get("jobs", [])
        if not jobs_list:
            return

        self.pages_scraped += 1
        new_count = 0

        for raw_job in jobs_list:
            gh_id = raw_job.get("id")
            dedup_key = f"gh-{board_token}-{gh_id}"

            if dedup_key in known:
                continue
            known.add(dedup_key)

            job = self._parse_job(raw_job, board_token)
            if job:
                self.jobs_found += 1
                new_count += 1
                yield job

        if new_count > 0:
            logger.info(f"[greenhouse] Board '{board_token}': {new_count} jobs")

    async def scrape(
        self, known_ids: Optional[Set[str]] = None
    ) -> AsyncIterator[ScrapedJob]:
        """
        Scrape all jobs across all configured Greenhouse company boards.
        """
        known = known_ids or set()
        logger.info({
            "event": "scrape_start",
            "source": self.SOURCE_NAME,
            "boards": len(self.boards),
        })

        try:
            for board_token in self.boards:
                try:
                    async for job in self._scrape_board(board_token, known):
                        yield job
                except Exception as e:
                    logger.warning(f"[greenhouse] Board '{board_token}' failed: {e}")
                    self.errors += 1

        except Exception as e:
            logger.error(f"[greenhouse] Scrape failed: {e}", exc_info=True)
            self.errors += 1
        finally:
            await self.close()

        logger.info({
            "event": "scrape_complete",
            "source": self.SOURCE_NAME,
            "jobs_found": self.jobs_found,
            "boards_scraped": self.pages_scraped,
            "errors": self.errors,
        })
