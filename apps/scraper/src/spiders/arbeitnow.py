#!/usr/bin/env python3
"""
arbeitnow.py
Spider for Arbeitnow's public REST API.

Endpoint: https://www.arbeitnow.com/api/job-board-api
- Free, no auth, no Cloudflare
- Focuses on EU + remote jobs
- Paginated results
"""

import logging
from datetime import datetime, timezone
from typing import AsyncIterator, Optional, Set

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


class ArbeitnowSpider(BaseSpider):
    """
    Production spider for Arbeitnow.com job listings.

    Features:
    - Pure aiohttp — no browser, no Playwright, no Cloudflare
    - Paginated API with clean JSON responses
    - Aggregates jobs from multiple ATS (Greenhouse, SmartRecruiters, Join.com)
    - Good coverage of EU + remote positions
    """

    SOURCE_NAME = "arbeitnow"
    BASE_URL = "https://www.arbeitnow.com/api/job-board-api"
    MAX_PAGES = 50  # Safety limit

    def __init__(self, requests_per_minute: int = 20):
        super().__init__(requests_per_minute=requests_per_minute)

    def _parse_job(self, raw: dict) -> Optional[ScrapedJob]:
        """Parse an Arbeitnow API job object into a ScrapedJob."""
        try:
            title = (raw.get("title") or "").strip()
            company = (raw.get("company_name") or "").strip()

            if not title or not company:
                return None

            # Description — HTML
            desc_html = raw.get("description", "")
            description = html_to_text(desc_html)
            if len(description) < 10:
                return None

            # URL
            source_url = raw.get("url", "") or raw.get("link", "")
            if not source_url:
                slug = raw.get("slug", "")
                if slug:
                    source_url = f"https://www.arbeitnow.com/view/{slug}"
            if not source_url:
                return None

            # Location
            location = raw.get("location", "")

            # Remote detection
            is_remote = raw.get("remote", False)
            if not is_remote:
                is_remote = detect_remote(description, location)

            # Tags → skills
            tags = raw.get("tags", []) or []
            skills = [str(t) for t in tags if t]

            # Job type — from tags or description
            job_type = None
            for tag in tags:
                jt = detect_job_type(str(tag))
                if jt:
                    job_type = jt
                    break
            if not job_type:
                job_type = detect_job_type(description[:1000])

            # Salary — extract from description
            salary_min, salary_max = extract_salary(description[:3000])

            # YOE — extract from description
            yoe = extract_yoe(description)

            # Posted date
            posted_at = None
            created_at_ts = raw.get("created_at")
            if created_at_ts:
                try:
                    if isinstance(created_at_ts, (int, float)):
                        posted_at = datetime.fromtimestamp(created_at_ts, tz=timezone.utc)
                    elif isinstance(created_at_ts, str):
                        posted_at = datetime.fromisoformat(created_at_ts.replace("Z", "+00:00"))
                except (ValueError, OSError):
                    pass

            # Generate a stable source_id for dedup  
            slug = raw.get("slug", "")
            requisition_id = slug or source_url

            return ScrapedJob(
                title=title,
                company_name=company,
                description=description,
                location=location if location else ("Remote" if is_remote else None),
                salary_min=salary_min,
                salary_max=salary_max,
                job_type=job_type,
                remote=is_remote,
                source=self.SOURCE_NAME,
                source_url=source_url,
                skills_required=skills,
                experience_required=yoe,
                posted_at=posted_at,
                is_active=True,
                requisition_id=requisition_id,
            )

        except Exception as e:
            logger.error(f"[arbeitnow] Parse error: {e}", exc_info=True)
            self.errors += 1
            return None

    async def scrape(
        self, known_ids: Optional[Set[str]] = None
    ) -> AsyncIterator[ScrapedJob]:
        """
        Scrape all Arbeitnow jobs with pagination.
        """
        known = known_ids or set()
        logger.info({"event": "scrape_start", "source": self.SOURCE_NAME})

        page = 1
        consecutive_empty = 0

        try:
            while page <= self.MAX_PAGES:
                data = await self._get_json(
                    self.BASE_URL,
                    params={"page": page},
                )

                if not data:
                    consecutive_empty += 1
                    if consecutive_empty >= 2:
                        break
                    page += 1
                    continue

                jobs_list = data.get("data", [])
                if not jobs_list:
                    logger.info(f"[arbeitnow] No more jobs at page {page}")
                    break

                self.pages_scraped += 1
                consecutive_empty = 0
                new_count = 0

                for raw_job in jobs_list:
                    slug = raw_job.get("slug", "")
                    url = raw_job.get("url", "") or raw_job.get("link", "")
                    dedup_key = slug or url

                    if dedup_key in known:
                        continue
                    known.add(dedup_key)
                    if url:
                        known.add(url)

                    job = self._parse_job(raw_job)
                    if job:
                        self.jobs_found += 1
                        new_count += 1
                        yield job

                if new_count > 0:
                    logger.info(f"[arbeitnow] Page {page}: {new_count} new jobs")

                # Check for next page
                meta = data.get("meta", {}) or data.get("links", {})
                has_next = bool(meta.get("next")) if meta else len(jobs_list) > 0

                if not has_next:
                    break

                page += 1

        except Exception as e:
            logger.error(f"[arbeitnow] Scrape failed: {e}", exc_info=True)
            self.errors += 1
        finally:
            await self.close()

        logger.info({
            "event": "scrape_complete",
            "source": self.SOURCE_NAME,
            "jobs_found": self.jobs_found,
            "pages_scraped": self.pages_scraped,
            "errors": self.errors,
        })
