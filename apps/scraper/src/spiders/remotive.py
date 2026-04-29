#!/usr/bin/env python3
"""
remotive.py
Spider for Remotive's public REST API.

Endpoint: https://remotive.com/api/remote-jobs
- Free, no auth, no Cloudflare
- Returns remote-only jobs with salary, category, tags
- Rate limit: max 2 requests/minute (TOS)
"""

import logging
import re
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
    detect_job_type,
    safe_decimal,
)

logger = logging.getLogger(__name__)

# Categories to scrape — covers tech, design, data, devops, marketing
CATEGORIES = [
    "software-dev",
    "design",
    "data",
    "devops-sysadmin",
    "product",
    "customer-support",
    "marketing",
    "qa",
    "writing",
    "hr",
    "finance-legal",
    "business",
    "all-others",
]


class RemotiveSpider(BaseSpider):
    """
    Production spider for Remotive.com remote job listings.

    Features:
    - Pure aiohttp — no browser, no Playwright, no Cloudflare issues
    - Category-based iteration for broad coverage
    - Rich field extraction: salary, YOE, job_type
    - All results are remote by definition
    """

    SOURCE_NAME = "remotive"
    BASE_URL = "https://remotive.com/api/remote-jobs"

    def __init__(self, requests_per_minute: int = 2):
        # Remotive TOS: max 2 req/min, max 4 fetches/day
        super().__init__(requests_per_minute=requests_per_minute)

    def _parse_job(self, raw: dict) -> Optional[ScrapedJob]:
        """Parse a Remotive API job object into a ScrapedJob."""
        try:
            job_id = raw.get("id")
            title = raw.get("title", "").strip()
            company = raw.get("company_name", "").strip()
            
            if not title or not company:
                return None

            # Description
            desc_html = raw.get("description", "")
            description = html_to_text(desc_html)
            if len(description) < 10:
                return None

            # URL
            source_url = raw.get("url", "")
            if not source_url:
                return None

            # Location — Remotive provides candidate_required_location
            location = raw.get("candidate_required_location", "Worldwide")

            # Salary — Remotive provides salary field as text
            salary_text = raw.get("salary", "")
            salary_min, salary_max = None, None
            if salary_text:
                salary_min, salary_max = extract_salary(salary_text)

            # Also try extracting from description if no salary found
            if not salary_min and not salary_max:
                salary_min, salary_max = extract_salary(description[:2000])

            # Job type
            raw_job_type = raw.get("job_type", "")
            job_type = self._normalize_job_type(raw_job_type)
            if not job_type:
                job_type = detect_job_type(description[:1000])

            # YOE — extract from description
            yoe = extract_yoe(description)

            # Category/tags as skills
            category = raw.get("category", "")
            tags = raw.get("tags", []) or []
            skills = [t for t in tags if t] if isinstance(tags, list) else []
            if category and category not in skills:
                skills.insert(0, category)

            # Posted date
            posted_at = None
            pub_date = raw.get("publication_date")
            if pub_date:
                try:
                    posted_at = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
                except (ValueError, AttributeError):
                    pass

            return ScrapedJob(
                title=title,
                company_name=company,
                description=description,
                location=location,
                salary_min=salary_min,
                salary_max=salary_max,
                job_type=job_type,
                remote=True,  # All Remotive jobs are remote
                source=self.SOURCE_NAME,
                source_url=source_url,
                skills_required=skills,
                experience_required=yoe,
                posted_at=posted_at,
                is_active=True,
                requisition_id=str(job_id) if job_id else source_url,
            )

        except Exception as e:
            logger.error(f"[remotive] Parse error: {e}", exc_info=True)
            self.errors += 1
            return None

    @staticmethod
    def _normalize_job_type(raw: str) -> Optional[str]:
        """Normalize Remotive job_type strings."""
        if not raw:
            return None
        lower = raw.lower().replace("_", " ").replace("-", " ")
        if "full" in lower:
            return "full_time"
        if "part" in lower:
            return "part_time"
        if "contract" in lower or "freelance" in lower:
            return "contract"
        if "intern" in lower:
            return "internship"
        return raw.lower().replace(" ", "_")

    async def scrape(
        self, known_ids: Optional[Set[str]] = None
    ) -> AsyncIterator[ScrapedJob]:
        """
        Scrape all Remotive jobs across categories.
        """
        known = known_ids or set()
        logger.info({"event": "scrape_start", "source": self.SOURCE_NAME})

        try:
            for category in CATEGORIES:
                data = await self._get_json(
                    self.BASE_URL,
                    params={"category": category, "limit": 100},
                )

                if not data:
                    continue

                jobs_list = data.get("jobs", [])
                if not jobs_list:
                    logger.debug(f"[remotive] No jobs in category: {category}")
                    continue

                self.pages_scraped += 1
                new_count = 0

                for raw_job in jobs_list:
                    job_id = str(raw_job.get("id", ""))
                    url = raw_job.get("url", "")

                    # Dedup: check by source URL or job ID
                    if url in known or job_id in known:
                        continue

                    known.add(url)
                    known.add(job_id)

                    job = self._parse_job(raw_job)
                    if job:
                        self.jobs_found += 1
                        new_count += 1
                        yield job

                if new_count > 0:
                    logger.info(f"[remotive] Category '{category}': {new_count} new jobs")

        except Exception as e:
            logger.error(f"[remotive] Scrape failed: {e}", exc_info=True)
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
