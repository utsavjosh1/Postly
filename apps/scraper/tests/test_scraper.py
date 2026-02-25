#!/usr/bin/env python3
"""
test_scraper.py
Comprehensive test suite for the hiring.cafe scraper.

Covers:
- Models (ScrapedJob validation, serialization)
- Spider (parsing, build ID extraction, helpers)
- Database (parameterized queries)
- Pipeline (dedup, batch processing)
- Deduplication cache

Run:  python -m pytest tests/test_scraper.py -v
"""

import asyncio
import json
import re
import sys
from decimal import Decimal
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ─── Path setup ───────────────────────────────────────────────────
SRC_DIR = str(Path(__file__).parent.parent / "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from models import ScrapedJob, ScrapingMetrics
from spiders.hiring_cafe import HiringCafeSpider, _html_to_text, _safe_decimal
from middlewares.deduplication import DeduplicationCache


# ═══════════════════════════════════════════════════════════════════
#  FIXTURES
# ═══════════════════════════════════════════════════════════════════


@pytest.fixture
def sample_job_info() -> Dict[str, Any]:
    """Realistic job_information payload as returned by hiring.cafe."""
    return {
        "pageProps": {
            "job_information": {
                "title": "Senior Backend Engineer",
                "requisition_id": "abc123xyz",
                "company_name": "TechCorp",
                "description": (
                    "<p>We are looking for a senior backend engineer "
                    "to join our team. You will design and build "
                    "scalable distributed systems. "
                    "Requirements include 5+ years of experience.</p>"
                ),
                "apply_url": "https://techcorp.com/apply/abc123xyz",
                "employment_type": "Full Time",
                "location": "San Francisco, CA",
                "enriched_company_data": {
                    "name": "TechCorp Inc.",
                    "industries": ["Technology", "SaaS"],
                    "hq_country": "US",
                    "nb_employees": "50-200",
                },
                "v5_processed_job_data": {
                    "yearly_min_compensation": 150000,
                    "yearly_max_compensation": 220000,
                    "workplace_type": "Remote",
                    "formatted_workplace_location": "Remote (US)",
                    "technical_tools": ["Python", "PostgreSQL", "Kubernetes"],
                    "min_industry_and_role_yoe": 5,
                    "employment_type": "Full Time",
                },
            }
        }
    }


@pytest.fixture
def sample_job_info_minimal() -> Dict[str, Any]:
    """Minimal valid job_information payload."""
    return {
        "pageProps": {
            "job_information": {
                "title": "Junior Developer",
                "requisition_id": "min123",
                "description": (
                    "Join our engineering team as a junior developer. "
                    "This is an entry level role where you will learn "
                    "modern web development practices and grow."
                ),
            }
        }
    }


@pytest.fixture
def spider() -> HiringCafeSpider:
    return HiringCafeSpider(requests_per_minute=600, page_size=10, max_pages=5)


# ═══════════════════════════════════════════════════════════════════
#  HTML → TEXT
# ═══════════════════════════════════════════════════════════════════


class TestHtmlToText:
    def test_empty_input(self):
        assert _html_to_text("") == ""
        assert _html_to_text(None) == ""

    def test_strips_tags(self):
        assert "Hello World" in _html_to_text("<p>Hello <b>World</b></p>")

    def test_br_to_newline(self):
        result = _html_to_text("Line 1<br/>Line 2<br>Line 3")
        assert "Line 1\nLine 2\nLine 3" == result

    def test_block_tags_to_newline(self):
        result = _html_to_text("<p>Para 1</p><p>Para 2</p>")
        assert "Para 1" in result
        assert "Para 2" in result

    def test_decodes_entities(self):
        assert "&" in _html_to_text("Tom &amp; Jerry")
        assert "<" in _html_to_text("a &lt; b")

    def test_collapses_whitespace(self):
        result = _html_to_text("<p>   lots   of   spaces   </p>")
        assert "  " not in result


# ═══════════════════════════════════════════════════════════════════
#  SAFE DECIMAL
# ═══════════════════════════════════════════════════════════════════


class TestSafeDecimal:
    def test_none(self):
        assert _safe_decimal(None) is None

    def test_integer(self):
        assert _safe_decimal(100000) == Decimal("100000")

    def test_float(self):
        assert _safe_decimal(99999.99) == Decimal("99999.99")

    def test_string(self):
        assert _safe_decimal("150000") == Decimal("150000")

    def test_invalid(self):
        assert _safe_decimal("not-a-number") is None
        assert _safe_decimal("") is None
        assert _safe_decimal({}) is None


# ═══════════════════════════════════════════════════════════════════
#  SCRAPED JOB MODEL
# ═══════════════════════════════════════════════════════════════════


class TestScrapedJob:
    def test_valid_creation(self):
        job = ScrapedJob(
            title="Software Engineer",
            company_name="ACME Corp",
            description="A " * 30,  # > 50 chars
            requisition_id="req_001",
        )
        assert job.title == "Software Engineer"
        assert job.company_name == "ACME Corp"
        assert job.source == "hiring_cafe"
        assert job.is_active is True
        assert job.remote is False
        assert job.id  # UUID auto-generated

    def test_whitespace_stripping(self):
        job = ScrapedJob(
            title="  Senior   Software   Engineer  ",
            company_name="  ACME   Corp  ",
            description="X " * 30,
            requisition_id="req_002",
        )
        assert job.title == "Senior Software Engineer"
        assert job.company_name == "ACME Corp"

    def test_skills_from_string(self):
        job = ScrapedJob(
            title="Backend Dev",
            company_name="Corp",
            description="Y " * 30,
            requisition_id="req_003",
            skills_required="Python, Go, Rust",
        )
        assert job.skills_required == ["Python", "Go", "Rust"]

    def test_skills_from_list(self):
        job = ScrapedJob(
            title="Backend Dev",
            company_name="Corp",
            description="Y " * 30,
            requisition_id="req_004",
            skills_required=["Python", "Go"],
        )
        assert job.skills_required == ["Python", "Go"]

    def test_skills_none(self):
        job = ScrapedJob(
            title="Backend Dev",
            company_name="Corp",
            description="Y " * 30,
            requisition_id="req_005",
            skills_required=None,
        )
        assert job.skills_required == []

    def test_invalid_url_rejected(self):
        job = ScrapedJob(
            title="Dev",
            company_name="Corp",
            description="Z " * 30,
            requisition_id="req_006",
            source_url="not-a-url",
        )
        assert job.source_url is None

    def test_valid_url_accepted(self):
        job = ScrapedJob(
            title="Dev",
            company_name="Corp",
            description="Z " * 30,
            requisition_id="req_007",
            source_url="https://example.com/job/123",
        )
        assert job.source_url == "https://example.com/job/123"

    def test_title_too_short(self):
        with pytest.raises(Exception):
            ScrapedJob(
                title="AB",  # < 3 chars
                company_name="Corp",
                description="Z " * 30,
                requisition_id="req_008",
            )

    def test_description_too_short(self):
        with pytest.raises(Exception):
            ScrapedJob(
                title="Developer",
                company_name="Corp",
                description="Short",  # < 50 chars
                requisition_id="req_009",
            )

    def test_to_db_dict(self):
        job = ScrapedJob(
            title="Dev",
            company_name="Corp",
            description="Z " * 30,
            requisition_id="req_010",
            skills_required=["Python", "Go"],
            salary_min=Decimal("100000"),
            salary_max=Decimal("150000"),
            remote=True,
        )
        d = job.to_db_dict()

        assert d["title"] == "Dev"
        assert d["company_name"] == "Corp"
        assert d["salary_min"] == 100000.0
        assert d["salary_max"] == 150000.0
        assert d["remote"] is True
        assert d["source"] == "hiring_cafe"
        assert d["id"] is not None
        assert d["embedding"] is None

        # skills_required should be JSON string
        skills = json.loads(d["skills_required"])
        assert skills == ["Python", "Go"]

    def test_to_db_dict_nulls(self):
        job = ScrapedJob(
            title="Dev",
            company_name="Corp",
            description="Z " * 30,
            requisition_id="req_011",
        )
        d = job.to_db_dict()

        assert d["salary_min"] is None
        assert d["salary_max"] is None
        assert d["location"] is None
        assert d["job_type"] is None
        assert d["embedding"] is None

    def test_meta_excluded_from_dict(self):
        job = ScrapedJob(
            title="Dev",
            company_name="Corp",
            description="Z " * 30,
            requisition_id="req_012",
            meta={"extra": "data"},
        )
        d = job.to_db_dict()
        assert "meta" not in d

    def test_requisition_id_required(self):
        with pytest.raises(Exception):
            ScrapedJob(
                title="Developer",
                company_name="Corp",
                description="Z " * 30,
                # Missing requisition_id
            )


# ═══════════════════════════════════════════════════════════════════
#  SCRAPING METRICS
# ═══════════════════════════════════════════════════════════════════


class TestScrapingMetrics:
    def test_defaults(self):
        m = ScrapingMetrics()
        assert m.source == "hiring_cafe"
        assert m.jobs_found == 0
        assert m.jobs_stored == 0
        assert m.duplicates_skipped == 0
        assert m.errors == 0

    def test_to_log_dict(self):
        m = ScrapingMetrics(
            jobs_found=100,
            jobs_stored=80,
            duplicates_skipped=20,
            duration_seconds=45.678,
        )
        d = m.to_log_dict()
        assert d["jobs_found"] == 100
        assert d["jobs_stored"] == 80
        assert d["duplicates_skipped"] == 20
        assert d["duration_seconds"] == 45.68
        assert "timestamp" in d


# ═══════════════════════════════════════════════════════════════════
#  SPIDER — PARSING
# ═══════════════════════════════════════════════════════════════════


class TestSpiderParsing:
    def test_parse_full_job(self, spider, sample_job_info):
        job = spider._parse_job(sample_job_info)
        assert job is not None
        assert job.title == "Senior Backend Engineer"
        assert job.company_name == "TechCorp Inc."
        assert job.requisition_id == "abc123xyz"
        assert job.remote is True
        assert job.salary_min == Decimal("150000")
        assert job.salary_max == Decimal("220000")
        assert job.job_type == "Full Time"
        assert "Python" in job.skills_required
        assert "PostgreSQL" in job.skills_required
        assert "Kubernetes" in job.skills_required
        assert job.experience_required == "5+ years"
        assert job.location == "Remote (US)"
        assert job.source_url == "https://techcorp.com/apply/abc123xyz"
        assert job.meta["hq_country"] == "US"
        assert job.meta["industries"] == ["Technology", "SaaS"]

    def test_parse_minimal_job(self, spider, sample_job_info_minimal):
        job = spider._parse_job(sample_job_info_minimal)
        assert job is not None
        assert job.title == "Junior Developer"
        assert job.requisition_id == "min123"
        assert job.company_name == "Unknown"
        assert job.salary_min is None
        assert job.salary_max is None
        assert job.skills_required == []
        assert job.experience_required is None
        assert job.remote is False

    def test_parse_missing_title(self, spider):
        raw = {"pageProps": {"job_information": {"requisition_id": "x"}}}
        assert spider._parse_job(raw) is None

    def test_parse_missing_requisition_id(self, spider):
        raw = {"pageProps": {"job_information": {"title": "Dev"}}}
        assert spider._parse_job(raw) is None

    def test_parse_short_description(self, spider):
        raw = {
            "pageProps": {
                "job_information": {
                    "title": "Developer",
                    "requisition_id": "short1",
                    "description": "<p>Too short</p>",
                }
            }
        }
        assert spider._parse_job(raw) is None

    def test_parse_empty_dict(self, spider):
        assert spider._parse_job({}) is None

    def test_parse_malformed_data(self, spider):
        """Should not crash on garbage data."""
        assert spider._parse_job({"random": "data"}) is None
        assert spider.errors == 0  # None return, not an error

    def test_parse_invalid_salary(self, spider):
        """Non-numeric salary should not crash."""
        raw = {
            "pageProps": {
                "job_information": {
                    "title": "Developer",
                    "requisition_id": "sal1",
                    "description": "A " * 30,
                    "v5_processed_job_data": {
                        "yearly_min_compensation": "negotiable",
                        "yearly_max_compensation": None,
                    },
                }
            }
        }
        job = spider._parse_job(raw)
        assert job is not None
        assert job.salary_min is None
        assert job.salary_max is None

    def test_extract_requisition_id(self):
        assert HiringCafeSpider._extract_requisition_id(
            {"requisition_id": "abc123"}
        ) == "abc123"
        assert HiringCafeSpider._extract_requisition_id(
            {"objectID": "xyz789"}
        ) == "xyz789"
        assert HiringCafeSpider._extract_requisition_id({}) is None

    def test_parse_onsite_job(self, spider):
        """Onsite job should have remote=False."""
        raw = {
            "pageProps": {
                "job_information": {
                    "title": "Office Manager",
                    "requisition_id": "onsite1",
                    "description": "Manage office operations " * 5,
                    "v5_processed_job_data": {
                        "workplace_type": "Onsite",
                        "formatted_workplace_location": "New York, NY",
                    },
                }
            }
        }
        job = spider._parse_job(raw)
        assert job is not None
        assert job.remote is False
        assert job.location == "New York, NY"

    def test_parse_hybrid_job(self, spider):
        raw = {
            "pageProps": {
                "job_information": {
                    "title": "Product Manager",
                    "requisition_id": "hybrid1",
                    "description": "Lead product strategy and execution " * 5,
                    "v5_processed_job_data": {
                        "workplace_type": "Hybrid",
                        "formatted_workplace_location": "Austin, TX",
                    },
                }
            }
        }
        job = spider._parse_job(raw)
        assert job is not None
        assert job.remote is False
        assert job.location == "Austin, TX"

    def test_parse_fallback_apply_url(self, spider):
        """When no apply_url, should construct one from requisition_id."""
        raw = {
            "pageProps": {
                "job_information": {
                    "title": "Developer",
                    "requisition_id": "noapply1",
                    "description": "X " * 30,
                }
            }
        }
        job = spider._parse_job(raw)
        assert job is not None
        assert job.source_url == "https://hiring.cafe/viewjob/noapply1"


# ═══════════════════════════════════════════════════════════════════
#  SPIDER — BUILD ID
# ═══════════════════════════════════════════════════════════════════


class TestSpiderBuildId:
    def test_build_id_regex(self, spider):
        """Verify the regex extracts buildId from __NEXT_DATA__ JSON."""
        html = '''<script id="__NEXT_DATA__">{"buildId":"EwAUde_27rGDUUZJk9NkP","assetPrefix":"","runtimeConfig":{}}</script>'''
        match = spider._BUILD_ID_RE.search(html)
        assert match is not None
        assert match.group(1) == "EwAUde_27rGDUUZJk9NkP"

    def test_build_id_regex_no_match(self, spider):
        html = "<html><body>No next data here</body></html>"
        match = spider._BUILD_ID_RE.search(html)
        assert match is None


# ═══════════════════════════════════════════════════════════════════
#  SPIDER — METRICS
# ═══════════════════════════════════════════════════════════════════


class TestSpiderMetrics:
    def test_initial_metrics(self, spider):
        m = spider.get_metrics()
        assert m["source"] == "hiring_cafe"
        assert m["jobs_found"] == 0
        assert m["pages_scraped"] == 0
        assert m["detail_fetches"] == 0
        assert m["errors"] == 0

    def test_metrics_after_mutations(self, spider):
        spider.jobs_found = 42
        spider.pages_scraped = 5
        spider.detail_fetches = 40
        spider.errors = 2
        m = spider.get_metrics()
        assert m["jobs_found"] == 42
        assert m["pages_scraped"] == 5
        assert m["detail_fetches"] == 40
        assert m["errors"] == 2


# ═══════════════════════════════════════════════════════════════════
#  DEDUPLICATION CACHE
# ═══════════════════════════════════════════════════════════════════


class TestDeduplicationCache:
    def test_empty_not_duplicate(self):
        cache = DeduplicationCache()
        assert cache.is_duplicate("https://example.com/job/1") is False

    def test_mark_seen(self):
        cache = DeduplicationCache()
        url = "https://example.com/job/1"
        cache.mark_seen(url)
        assert cache.is_duplicate(url) is True

    def test_none_url_not_duplicate(self):
        cache = DeduplicationCache()
        assert cache.is_duplicate("") is False

    def test_clear_batch(self):
        cache = DeduplicationCache()
        url = "https://example.com/job/1"
        cache.mark_seen(url)
        cache.clear_batch()
        assert cache.is_duplicate(url) is False

    def test_clear_all(self):
        cache = DeduplicationCache()
        cache._db_urls = {"https://db.com/job/1"}
        cache.mark_seen("https://batch.com/job/1")
        cache.clear_all()
        assert cache.is_duplicate("https://db.com/job/1") is False
        assert cache.is_duplicate("https://batch.com/job/1") is False

    def test_db_cache_detection(self):
        cache = DeduplicationCache()
        cache._db_urls = {
            "https://hiring.cafe/viewjob/abc",
            "https://hiring.cafe/viewjob/def",
        }
        assert cache.is_duplicate("https://hiring.cafe/viewjob/abc") is True
        assert cache.is_duplicate("https://hiring.cafe/viewjob/xyz") is False

    @pytest.mark.asyncio
    async def test_load_from_db(self):
        mock_db = AsyncMock()
        mock_db.get_existing_source_urls.return_value = {
            "https://hiring.cafe/viewjob/existing1",
        }
        cache = DeduplicationCache(database=mock_db)

        await cache.load_from_db("hiring_cafe")

        assert cache._db_urls is not None
        assert cache.is_duplicate("https://hiring.cafe/viewjob/existing1") is True
        mock_db.get_existing_source_urls.assert_awaited_once_with("hiring_cafe")


# ═══════════════════════════════════════════════════════════════════
#  PIPELINE (unit-level)
# ═══════════════════════════════════════════════════════════════════


class TestPipeline:
    @pytest.mark.asyncio
    async def test_process_empty_list(self):
        from pipeline import JobProcessingPipeline

        mock_db = AsyncMock()
        mock_db.get_existing_source_urls.return_value = set()

        pipeline = JobProcessingPipeline(database=mock_db, batch_size=10)
        metrics = await pipeline.process([])

        assert metrics.jobs_found == 0
        assert metrics.jobs_stored == 0

    @pytest.mark.asyncio
    async def test_process_dedup(self):
        from pipeline import JobProcessingPipeline

        mock_db = AsyncMock()
        mock_db.get_existing_source_urls.return_value = {
            "https://hiring.cafe/viewjob/dup1",
        }
        mock_db.insert_jobs_batch.return_value = 1

        pipeline = JobProcessingPipeline(database=mock_db, batch_size=10)

        jobs = [
            ScrapedJob(
                title="New Job",
                company_name="Corp",
                description="Z " * 30,
                requisition_id="new1",
                source_url="https://hiring.cafe/viewjob/new1",
            ),
            ScrapedJob(
                title="Dup Job",
                company_name="Corp",
                description="Z " * 30,
                requisition_id="dup1",
                source_url="https://hiring.cafe/viewjob/dup1",
            ),
        ]

        metrics = await pipeline.process(jobs)

        assert metrics.jobs_found == 2
        assert metrics.duplicates_skipped == 1
        assert metrics.jobs_stored == 1

    @pytest.mark.asyncio
    async def test_process_no_embedder(self):
        from pipeline import JobProcessingPipeline

        mock_db = AsyncMock()
        mock_db.get_existing_source_urls.return_value = set()
        mock_db.insert_jobs_batch.return_value = 2

        pipeline = JobProcessingPipeline(
            database=mock_db, embedding_service=None, batch_size=10
        )

        jobs = [
            ScrapedJob(
                title="Job A",
                company_name="Corp",
                description="Z " * 30,
                requisition_id="a1",
                source_url="https://example.com/a",
            ),
            ScrapedJob(
                title="Job B",
                company_name="Corp",
                description="Z " * 30,
                requisition_id="b1",
                source_url="https://example.com/b",
            ),
        ]

        metrics = await pipeline.process(jobs)

        assert metrics.jobs_found == 2
        assert metrics.jobs_embedded == 0
        assert metrics.jobs_stored == 2


# ═══════════════════════════════════════════════════════════════════
#  EMBEDDING SERVICE (unit-level, mocked Voyage client)
# ═══════════════════════════════════════════════════════════════════


class TestEmbeddingService:
    def test_prepare_text(self):
        """Verify weighted text preparation."""
        # Import with voyage mock
        with patch.dict("sys.modules", {"voyageai": MagicMock()}):
            from embedding_service import VoyageEmbeddingService

            service = VoyageEmbeddingService.__new__(VoyageEmbeddingService)
            service.model = "voyage-4-lite"

            text = service._prepare_text({
                "job_title": "Backend Engineer",
                "skills_required": ["Python", "Go"],
                "job_description": "Build scalable systems",
                "company_name": "TechCo",
            })

            # Title should appear 3x (weighted)
            assert text.count("Backend Engineer") == 3
            # Skills should appear 2x
            assert text.count("Python, Go") == 2
            assert "Build scalable systems" in text
            assert "TechCo" in text

    def test_prepare_text_empty_fields(self):
        with patch.dict("sys.modules", {"voyageai": MagicMock()}):
            from embedding_service import VoyageEmbeddingService

            service = VoyageEmbeddingService.__new__(VoyageEmbeddingService)
            service.model = "voyage-4-lite"

            text = service._prepare_text({})
            assert text == ""

    def test_embedding_dim_is_768(self):
        with patch.dict("sys.modules", {"voyageai": MagicMock()}):
            from embedding_service import VoyageEmbeddingService
            assert VoyageEmbeddingService.EMBEDDING_DIM == 768

    def test_default_model(self):
        with patch.dict("sys.modules", {"voyageai": MagicMock()}):
            import os
            # Clear env override if present
            original = os.environ.get("VOYAGE_MODEL")
            os.environ.pop("VOYAGE_MODEL", None)

            # Re-import to pick up default
            import importlib
            import embedding_service
            importlib.reload(embedding_service)

            assert "voyage-4-lite" in embedding_service.VoyageEmbeddingService.MODEL

            if original is not None:
                os.environ["VOYAGE_MODEL"] = original


# ═══════════════════════════════════════════════════════════════════
#  JANITOR (unit-level)
# ═══════════════════════════════════════════════════════════════════


class TestJanitor:
    @pytest.mark.asyncio
    async def test_run_maintenance(self):
        from janitor import JanitorService

        mock_db = AsyncMock()
        mock_db.cleanup_expired_jobs.return_value = 5
        mock_db.deactivate_stale_jobs.return_value = 10
        mock_db.cleanup_old_jobs.return_value = 3
        mock_db.remove_duplicates.return_value = 2

        janitor = JanitorService(database=mock_db)
        summary = await janitor.run_maintenance()

        assert summary["success"] is True
        assert summary["tasks"]["expired_removed"] == 5
        assert summary["tasks"]["stale_deactivated"] == 10
        assert summary["tasks"]["old_removed"] == 3
        assert summary["tasks"]["duplicates_removed"] == 2

    @pytest.mark.asyncio
    async def test_maintenance_handles_errors(self):
        from janitor import JanitorService

        mock_db = AsyncMock()
        mock_db.cleanup_expired_jobs.side_effect = Exception("DB down")

        janitor = JanitorService(database=mock_db)
        # Should not raise — individual tasks catch their errors
        expired = await janitor.remove_expired_jobs()
        assert expired == 0


# ═══════════════════════════════════════════════════════════════════
#  HEALTH CHECK (unit-level)
# ═══════════════════════════════════════════════════════════════════


class TestHealthCheck:
    def test_initial_status(self):
        from health import HealthCheckServer

        server = HealthCheckServer(port=9999)
        assert server.status["healthy"] is True
        assert server.status["database_connected"] is False

    def test_update_status(self):
        from health import HealthCheckServer

        server = HealthCheckServer(port=9999)
        server.update_status(
            database_connected=True,
            last_scrape="2025-01-01T00:00:00",
            jobs_in_db=500,
        )
        assert server.status["database_connected"] is True
        assert server.status["jobs_in_db"] == 500
        assert server.status["last_scrape"] == "2025-01-01T00:00:00"


# ═══════════════════════════════════════════════════════════════════
#  INTEGRATION-ISH: Spider scrape flow with mocked HTTP
# ═══════════════════════════════════════════════════════════════════


class TestSpiderScrapeFlow:
    @pytest.mark.asyncio
    async def test_scrape_all_with_mocked_responses(self, spider, sample_job_info):
        """End-to-end scrape with mocked aiohttp session."""
        # --- Mock session ---
        mock_session = AsyncMock()
        spider._session = mock_session
        spider._build_id = "test_build_123"

        # Mock count response
        count_response = AsyncMock()
        count_response.status = 200
        count_response.json = AsyncMock(return_value={"total": 1})
        count_ctx = AsyncMock()
        count_ctx.__aenter__ = AsyncMock(return_value=count_response)
        count_ctx.__aexit__ = AsyncMock(return_value=False)

        # Mock search response
        search_response = AsyncMock()
        search_response.status = 200
        search_response.json = AsyncMock(return_value={
            "results": [{"requisition_id": "abc123xyz"}]
        })
        search_ctx = AsyncMock()
        search_ctx.__aenter__ = AsyncMock(return_value=search_response)
        search_ctx.__aexit__ = AsyncMock(return_value=False)

        # Mock detail response
        detail_response = AsyncMock()
        detail_response.status = 200
        detail_response.json = AsyncMock(return_value=sample_job_info)
        detail_ctx = AsyncMock()
        detail_ctx.__aenter__ = AsyncMock(return_value=detail_response)
        detail_ctx.__aexit__ = AsyncMock(return_value=False)

        # Wire up — GET is used for all three
        call_count = 0

        def get_side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            url = args[0] if args else kwargs.get("url", "")

            if "get-total-count" in str(url):
                return count_ctx
            elif "search-jobs" in str(url):
                return search_ctx
            else:
                return detail_ctx

        mock_session.get = MagicMock(side_effect=get_side_effect)
        mock_session.closed = False

        # Override throttle for speed
        spider._min_interval = 0.0

        jobs = await spider.scrape_all()

        assert len(jobs) == 1
        assert jobs[0].title == "Senior Backend Engineer"
        assert jobs[0].requisition_id == "abc123xyz"
        assert spider.jobs_found == 1
        assert spider.pages_scraped == 1
        assert spider.detail_fetches == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
