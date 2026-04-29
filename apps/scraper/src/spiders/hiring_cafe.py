#!/usr/bin/env python3
"""
hiring_cafe.py
Spider for hiring.cafe's JSON API.

CHANGELOG:
- Implemented rotating User-Agents for robust Cloudflare bypassing
- Added pagination circuit breaker to prevent infinite loops on stale API offsets
- Skipping detail fetches automatically if job ID is in known_ids
- Migrated to Playwright and playwright-stealth to autonomously run JS and defeat Cloudflare Turnstile blocks, reusing cf_clearance cookies.
"""

import asyncio
import logging
import re
import time
import random
from decimal import Decimal, InvalidOperation
from typing import AsyncIterator, Optional, Dict, Any, List, Set, Tuple
from datetime import datetime, timezone
from html import unescape

import json
import os
import sys
from pathlib import Path

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from playwright.async_api import async_playwright, Page, Error as PlaywrightError
from playwright_stealth import Stealth

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
    Production spider for hiring.cafe using Playwright.

    Features:
    - Autonomously bypasses Cloudflare JS Challenges using a stealth Chromium instance
    - Reuses clearance cookies for raw headless HTTP fetches avoiding constant popups
    - GET /api/search-jobs for paginated search (returns full job records)
    - GET /api/search-jobs/get-total-count for total count
    - GET /_next/data/{buildId}/viewjob/{id}.json for extra detail (optional)
    - Configurable rate limiting (RPM)
    - Exponential backoff on 429 / transient errors
    - requisition_id as natural dedup key
    """

    BASE = "https://hiring.cafe"
    SEARCH_URL = "https://hiring.cafe/api/search-jobs"
    COUNT_URL = "https://hiring.cafe/api/search-jobs/get-total-count"

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

        self._build_id: Optional[str] = None
        
        # Session path
        self._abs_root = Path("/Users/apple/Desktop/Postly/apps/scraper")
        self._session_path = self._abs_root / ".sessions/hiring_cafe"
        self._cookies_file = self._session_path / "cookies.json"
        
        # Injected runtime via scrape() execution loop
        self._page: Optional[Page] = None

        # Metrics — reset between cycles by the orchestrator
        self.jobs_found = 0
        self.pages_scraped = 0
        self.detail_fetches = 0
        self.errors = 0

    async def close(self) -> None:
        """Compatibility signature."""
        pass

    # ─── Cloudflare Clearance & Session ───────────────────────────

    def _get_chromium_args(self) -> List[str]:
        """Return platform-specific Chromium arguments to avoid native segfaults."""
        if sys.platform == "darwin":  # macOS
            return [
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--disable-infobars",
                "--window-size=1920,1080",
                "--start-maximized",
                "--lang=en-US",
                "--exclude-switches=enable-automation",
                "--disable-extensions-except=",
                "--disable-gpu-sandbox",
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-features=IsolateOrigins,site-per-process",
            ]

    async def _simulate_human_behavior(self, page: Page):
        """Simulate realistic human interaction during the CF challenge window."""
        try:
            # Move mouse to a random spot
            await page.mouse.move(random.randint(100, 700), random.randint(100, 500), steps=10)
            
            # Natural scroll (shorter, less blocking)
            if random.random() > 0.5:
                scroll = random.randint(100, 400)
                await page.evaluate(f"window.scrollBy({{top: {scroll}, behavior: 'smooth'}});")
                await asyncio.sleep(0.5)
                await page.evaluate(f"window.scrollBy({{top: -{random.randint(50, 100)}, behavior: 'smooth'}});")
            
            await asyncio.sleep(random.uniform(0.1, 0.5))
        except Exception as e:
            logger.debug(f"Behavior simulation partial failure: {e}")

    async def _save_session(self, context) -> None:
        """Save cookies to the session file."""
        try:
            self._session_path.mkdir(parents=True, exist_ok=True)
            cookies = await context.cookies()
            with open(self._cookies_file, "w") as f:
                json.dump(cookies, f, indent=2)
            logger.info(f"💾 Saved {len(cookies)} cookies to {self._cookies_file}")
        except Exception as e:
            logger.warning(f"Failed to save session: {e}")

    async def _load_session(self, context) -> bool:
        """Load cookies from the session file. Returns True if restored."""
        try:
            if self._cookies_file.exists():
                with open(self._cookies_file, "r") as f:
                    cookies = json.load(f)
                await context.add_cookies(cookies)
                logger.info(f"♻️ Restored {len(cookies)} cookies from session.")
                return True
        except Exception as e:
            logger.warning(f"Failed to load session: {e}")
        return False

    async def _wait_for_clearance(self, page: Page, timeout_ms: int = 60000) -> bool:
        """
        Handles BOTH Managed (invisible) and Interactive (iframe) CF challenges.
        Returns True if clearance was obtained.
        """
        start_time = asyncio.get_event_loop().time()
        timeout_sec = timeout_ms / 1000.0
        
        TURNSTILE_SELECTORS = [
            "#AOzYg6", # Primary Turnstile container found by investigation
            "iframe[src*='challenges.cloudflare.com']",
            "iframe[src*='challenge-platform']",
            "iframe[title*='Cloudflare']",
            "iframe[id*='cf-chl-widget']",
            "#cf-turnstile",
            ".cf-turnstile",
        ]

        logger.info(f"Executing behavioral simulation and waiting for challenge to settle ({timeout_sec}s)...")

        while (asyncio.get_event_loop().time() - start_time) < timeout_sec:
            # 1. Behavioral simulation loop (partial)
            await self._simulate_human_behavior(page)
            
            # 2. Check: Cookie set (Managed Challenge solved silently or cookie restored)
            cookies = await page.context.cookies()
            if any(c["name"] == "cf_clearance" for c in cookies):
                logger.info("✅ cf_clearance cookie captured.")
                return True

            # 3. Check: Page title cleared
            try:
                title = await page.title()
                if "just a moment" not in title.lower() and "attention required" not in title.lower():
                    logger.info(f"✅ Challenge passed based on title: {title}")
                    return True
            except Exception:
                pass

            # 4. Check: Turnstile Challenge (Advanced Frame Search)
            solved_this_loop = False
            for selector in TURNSTILE_SELECTORS:
                try:
                    locator = page.locator(selector).first
                    if await locator.count() > 0:
                        # Fallback 1: Try to find the checkbox in ANY frame on the page
                        for frame in page.frames:
                            try:
                                checkbox = frame.locator("input[type='checkbox']").first
                                if await checkbox.count() > 0 and await checkbox.is_visible():
                                    logger.info(f"🔲 Turnstile checkbox found in frame '{frame.name or 'unnamed'}'. Clicking...")
                                    await checkbox.click(timeout=3000)
                                    solved_this_loop = True
                                    break
                            except Exception:
                                continue
                        
                        if solved_this_loop:
                            break

                        # Fallback 2: Pixel click the LEFT-CENTER of the container (where the box actually is)
                        logger.info(f"🔲 Turnstile container '{selector}' visible. Attempting left-side pixel click...")
                        box = await locator.bounding_box()
                        if box:
                            # The checkbox in Cloudflare Turnstile is typically on the left side.
                            # We click ~30px from the left and center vertically.
                            target_x = box["x"] + 30 
                            target_y = box["y"] + box["height"] / 2
                            await page.mouse.click(target_x, target_y)
                            solved_this_loop = True
                            break
                        
                        logger.info(f"🔲 Turnstile element '{selector}' detected. Waiting for settlement...")
                        break
                except Exception:
                    continue

            await asyncio.sleep(1)

        # Failure Diagnostics
        try:
            diag_path = self._abs_root / "debug_clearance.png"
            await page.screenshot(path=str(diag_path))
            logger.warning(f"❌ Clearance timed out. Screenshot saved to {diag_path}")
        except Exception as e:
            logger.debug(f"Failed to capture diagnostic screenshot: {e}")
            
        return False

    async def _get_clearance(self, playwright) -> Tuple[Any, Any, Page, str]:
        """
        Launch a real browser, solve the CF challenge, return browser, context, page, UA.
        """
        is_headless = os.getenv("HEADLESS", "True").lower() in ("true", "1", "t")
        logger.info(f"Initializing {'Headless' if is_headless else 'Headed'} Chromium/Chrome for Cloudflare Clearance...")
        
        launch_args = self._get_chromium_args()
        
        # Ensure no-sandbox for execution environment compatibility
        if "--no-sandbox" not in launch_args:
            launch_args.append("--no-sandbox")
        
        user_data_dir = self._session_path / "browser_data"
        user_data_dir.mkdir(parents=True, exist_ok=True)

        async def launch_with_retry():
            # Attempt 1: Real Chrome (Best TLS)
            # Attempt 2: Bundled Chromium (Fallback)
            channels = ["chrome", None] if sys.platform == "darwin" else [None]
            
            last_err = None
            for channel in channels:
                try:
                    logger.info(f"Targeting channel: {channel or 'bundled chromium'}...")
                    return await playwright.chromium.launch_persistent_context(
                        user_data_dir=str(user_data_dir.absolute()),
                        headless=is_headless,
                        args=launch_args,
                        channel=channel,
                        ignore_default_args=["--enable-automation"],
                        user_agent=(
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                            "AppleWebKit/537.36 (KHTML, like Gecko) "
                            "Chrome/131.0.0.0 Safari/537.36"
                        ),
                        viewport={"width": 1440, "height": 900},
                        device_scale_factor=2,
                        locale="en-US",
                    )
                except Exception as e:
                    last_err = e
                    if "SingletonSocket" in str(e) or "ProcessSingleton" in str(e):
                        logger.warning(f"Browser isolation error on {channel}: {e}. Retrying with different engine...")
                        continue
                    raise e
            raise last_err

        # Using 1440x900 Retina display scale for better fingerprint
        context = await launch_with_retry()

        # Patching detection vectors aggressively
        await context.add_init_script("""
            // 1. Remove webdriver
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            
            // 2. Mock chrome runtime
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };
            
            // 3. Mock permissions
            try {
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
                );
            } catch(e) {}
            
            // 4. Mock CPU cores (MacBook typically 8+)
            Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });

            // 5. Languages
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        """)

        page = context.pages[0] if context.pages else await context.new_page()
        
        # High-fidelity Stealth CDP Injection
        stealth = Stealth(
            navigator_plugins=True,
            navigator_permissions=True,
        )
        try:
            await stealth.apply_stealth_async(page)
            logger.info("playwright-stealth patches applied successfully")
        except Exception as e:
            logger.warning(f"playwright-stealth partial failure (continuing): {e}")

        # Try restoring existing session cookies
        await self._load_session(context)

        # Navigate
        logger.info(f"Navigating to {self.BASE} to verify session or clear challenges...")
        try:
            await page.goto(self.BASE, wait_until="domcontentloaded", timeout=30000)
        except Exception as e:
            logger.warning(f"Navigation error: {e}")

        # Wait for clearance
        success = await self._wait_for_clearance(page)
        
        if success:
            await self._save_session(context)
        else:
            logger.warning("Proceeding without confirmed clearance (may fail with 403)")

        ua = await page.evaluate("navigator.userAgent")
        return None, context, page, ua

    # ─── Rate Limiting ────────────────────────────────────────────

    async def _throttle(self) -> None:
        """Enforce minimum interval between outbound API requests."""
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
        logger.info(f"Fetching homepage for buildId using authorized session...")

        resp = await self._page.request.get(self.BASE)
        status = resp.status
        logger.info(f"Homepage response: {status}")

        if status == 403:
            logger.warning("Homepage 403 — Cloudflare block persists after clearance")
            await asyncio.sleep(30)
            raise PlaywrightError("Homepage 403 — Cloudflare block")

        if status != 200:
            raise PlaywrightError(f"Homepage returned {status}")

        body_bytes = await resp.body()
        html = body_bytes.decode('utf-8', errors='ignore')

        match = self._BUILD_ID_RE.search(html)
        if not match:
            logger.warning("Could not find buildId in homepage HTML.")
            raise PlaywrightError("buildId not found in homepage")

        build_id = match.group(1)
        logger.info({"event": "build_id_discovered", "build_id": build_id})
        return build_id

    async def _ensure_build_id(self) -> None:
        """Try to get buildId, but don't fail the whole scrape if it doesn't work."""
        if not self._build_id:
            try:
                self._build_id = await self._discover_build_id()
            except Exception as e:
                logger.warning(f"BuildId discovery failed: {e}. Skipping detail fetches.")
                self._build_id = None

    # ─── Search API ───────────────────────────────────────────────

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=2, min=3, max=120),
        retry=retry_if_exception_type((PlaywrightError, asyncio.TimeoutError)),
    )
    async def _search_page(self, offset: int) -> Dict[str, Any]:
        """GET /api/search-jobs — returns JSON directly."""
        await self._throttle()

        url = f"{self.SEARCH_URL}?offset={offset}&limit={self._page_size}"
        logger.debug(f"Searching offset {offset}...")

        resp = await self._page.request.get(url)
        status = resp.status

        if status == 429:
            retry_after = 60
            if "Retry-After" in resp.headers:
                retry_after = int(resp.headers["Retry-After"])
            logger.warning({"event": "rate_limited", "retry_after": retry_after})
            await asyncio.sleep(retry_after)
            raise PlaywrightError("Rate limited on search")

        if status == 403:
            logger.warning("Search 403 — Cloudflare challenge expired or failed.")
            await asyncio.sleep(30)
            raise PlaywrightError("Search returned 403")

        if status != 200:
            logger.error({"event": "search_error", "status": status})
            raise PlaywrightError(f"Search returned {status}")

        try:
            data = await resp.json()
        except Exception as e:
            body_bytes = await resp.body()
            text = body_bytes.decode('utf-8', errors='ignore')
            logger.error(f"Failed to parse search JSON. Body preview: {text[:300]}")
            raise PlaywrightError(f"Invalid JSON from search API: {e}")

        return data

    async def _get_total_count(self) -> int:
        """GET /api/search-jobs/get-total-count → total available jobs."""
        await self._throttle()

        try:
            resp = await self._page.request.get(self.COUNT_URL)
            if resp.status == 200:
                data = await resp.json()
                if isinstance(data, int):
                    total = data
                elif isinstance(data, dict):
                    total = data.get("total", data.get("count", 0))
                else:
                    total = 0
                logger.info({"event": "total_count", "total": total})
                return total
            else:
                logger.warning(f"Count API returned {resp.status}")
        except Exception as exc:
            logger.warning(f"Could not get total count: {exc}")
        return 0

    # ─── Job Detail (optional — needs buildId) ────────────────────

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((PlaywrightError, asyncio.TimeoutError)),
    )
    async def _fetch_job_detail(self, requisition_id: str) -> Optional[Dict[str, Any]]:
        """
        GET /_next/data/{buildId}/viewjob/{id}.json for full structured data.
        Returns None if buildId is not available.
        """
        if not self._build_id:
            return None

        await self._throttle()

        url = f"{self.BASE}/_next/data/{self._build_id}/viewjob/{requisition_id}.json"

        resp = await self._page.request.get(url)
        status = resp.status
        
        if status == 200:
            self.detail_fetches += 1
            try:
                data = await resp.json()
                return data.get("pageProps", data)
            except Exception:
                return None

        if status == 404:
            logger.debug(f"Detail 404 for {requisition_id} — buildId may be stale")
            return None

        if status == 429:
            await asyncio.sleep(30)
            raise PlaywrightError("Rate limited on detail")

        if status == 403:
            logger.warning("Detail 403 — blocked on individual fetch")
            await asyncio.sleep(30)
            raise PlaywrightError("Rate limited / blocked on detail")

        logger.debug(f"Detail {status} for {requisition_id}")
        return None

    # ─── Parsing ──────────────────────────────────────────────────

    @staticmethod
    def _extract_requisition_id(card: Dict[str, Any]) -> Optional[str]:
        """Extract requisition_id from a search result card."""
        return card.get("requisition_id") or card.get("objectID")

    def _parse_job(self, raw: Dict[str, Any]) -> Optional[ScrapedJob]:
        """
        Parse raw job data into ScrapedJob.
        Handles both search result cards and detail page JSON.
        """
        try:
            if not raw:
                return None

            data = raw.get("pageProps", raw) if "pageProps" in raw else raw

            for key in ["job", "job_information"]:
                nested = data.get(key)
                if isinstance(nested, dict):
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

            description_html = (
                data.get("description")
                or data.get("job_description_html")
                or data.get("job_description", "")
            )
            description = _html_to_text(description_html)

            if len(description) < 10:
                description = data.get("description_clean") or data.get("job_description_text") or description

            if len(description) < 10:
                logger.debug(f"Description too short for {requisition_id}. Content: {description[:50]}")
                return None

            v5 = data.get("v5_processed_job_data") or data.get("processed_data") or {}

            salary_min = _safe_decimal(v5.get("yearly_min_compensation") or data.get("yearly_min_compensation"))
            salary_max = _safe_decimal(v5.get("yearly_max_compensation") or data.get("yearly_max_compensation"))

            workplace_type = (v5.get("workplace_type") or "").lower()
            is_remote = workplace_type == "remote"
            location = (
                v5.get("formatted_workplace_location")
                or data.get("location")
                or ("Remote" if is_remote else None)
            )

            raw_tools = v5.get("technical_tools") or data.get("skills_required") or []
            skills = [str(t) for t in raw_tools if t] if isinstance(raw_tools, list) else []

            min_yoe = v5.get("min_industry_and_role_yoe")
            experience = f"{min_yoe}+ years" if min_yoe else None

            job_type = data.get("employment_type") or v5.get("employment_type")

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
            return job

        except Exception as exc:
            logger.error(f"Parse error: {exc}", exc_info=True)
            self.errors += 1
            return None

    # ─── Main Scrape Flow ─────────────────────────────────────────

    async def scrape(
        self,
        known_ids: Optional[Set[str]] = None,
    ) -> AsyncIterator[ScrapedJob]:
        """
        Full scrape cycle using Playwright to bypass protections.

        IMPORTANT: This is a best-effort spider. If Cloudflare blocks us,
        we log a warning and yield nothing — we never crash the pipeline.
        The other API-based spiders (Remotive, Arbeitnow, Greenhouse) will
        still provide jobs even if hiring.cafe is fully blocked.
        """
        known = known_ids or set()
        start_time = datetime.now(timezone.utc)
        logger.info({"event": "scrape_start", "source": "hiring_cafe"})

        try:
            async with async_playwright() as pw:
                try:
                    browser_obj, context, self._page, ua = await self._get_clearance(pw)
                except Exception as e:
                    logger.warning(
                        f"[hiring_cafe] Cloudflare clearance failed — skipping this source. "
                        f"Other sources will still run. Error: {e}"
                    )
                    self.errors += 1
                    return

                try:
                    async for job in self._run_scrape_loop(known, start_time, total=None):
                        yield job
                finally:
                    if browser_obj:
                        await browser_obj.close()
                    elif context:
                        await context.close()
                    self._page = None
        except Exception as e:
            logger.warning(
                f"[hiring_cafe] Spider crashed — skipping this source. Error: {e}"
            )
            self.errors += 1

    async def _run_scrape_loop(self, known: Set[str], start_time: datetime, total: Optional[int]) -> AsyncIterator[ScrapedJob]:
        """Isolates the central loop iteration."""
        
        await self._ensure_build_id()
        total = await self._get_total_count()

        offset = 0
        page_num = 0

        seen_ids: Set[str] = set()
        duplicate_streak: int = 0

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
            
            page_ids = {self._extract_requisition_id(c) for c in hits if self._extract_requisition_id(c)}
            
            if page_ids and page_ids.issubset(seen_ids):
                duplicate_streak += 1
                if duplicate_streak >= 2:
                    logger.warning(f"Pagination loop detected, stopping early at offset {offset}")
                    break
            else:
                duplicate_streak = 0
            
            seen_ids.update(page_ids)

            new_on_page = 0
            for card in hits:
                req_id = self._extract_requisition_id(card)
                if not req_id or req_id in known:
                    continue

                known.add(req_id)

                job = self._parse_job(card)

                if not job and self._build_id:
                    try:
                        detail = await self._fetch_job_detail(req_id)
                        if detail:
                            job = self._parse_job(detail)
                    except Exception as exc:
                        logger.debug(f"Detail fetch failed for {req_id}: {exc}")
                        self.errors += 1

                if job:
                    self.jobs_found += 1
                    new_on_page += 1
                    yield job

            if new_on_page > 0:
                logger.info(f"Page {page_num + 1}: found {new_on_page} new jobs")

            self.pages_scraped += 1
            page_num += 1
            offset += self._page_size

            if page_num % 5 == 0:
                logger.info(f"Progress: {page_num}/{self._max_pages} pages. Total found: {self.jobs_found}")

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
        known_ids: Optional[Set[str]] = None,
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
