#!/usr/bin/env python3
"""
models.py
Pydantic V2 schemas aligned to the Drizzle `jobs` table.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re
import uuid


class ScrapedJob(BaseModel):
    """
    Validated job data that maps 1:1 to the Drizzle `jobs` table.

    Drizzle columns:
        id, title, company_name, description, location,
        salary_min, salary_max, job_type, remote, source,
        source_url, embedding, skills_required, experience_required,
        posted_at, expires_at, is_active, employer_id,
        created_at, updated_at
    """

    # Primary key — generated here, not by the DB, so we can dedup before insert
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    # Core required fields
    title: str = Field(..., min_length=3, description="Job title")
    company_name: str = Field(..., min_length=1, description="Company name")
    description: str = Field(..., min_length=10, description="Job description (plain text)")

    # Optional fields
    location: Optional[str] = None
    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    job_type: Optional[str] = None
    remote: bool = False
    source: str = "hiring_cafe"
    source_url: Optional[str] = None  # External apply URL
    skills_required: Optional[list[str]] = Field(default_factory=list)
    experience_required: Optional[str] = None
    posted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True
    employer_id: Optional[str] = None  # UUID — unused for scraped jobs

    # Embedding (768-dim for Drizzle schema)
    embedding: Optional[list[float]] = None

    # hiring.cafe specific — used for dedup, not stored in DB
    requisition_id: str = Field(..., description="hiring.cafe requisition ID for dedup")

    # Metadata (not stored in DB)
    meta: dict = Field(default_factory=dict, exclude=True)

    model_config = {
        "str_strip_whitespace": True,
        "validate_default": True,
    }

    @field_validator("title", "company_name", mode="before")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return " ".join(v.split())

    @field_validator("skills_required", mode="before")
    @classmethod
    def ensure_list(cls, v) -> list[str]:
        if v is None:
            return []
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return list(v)

    @field_validator("source_url", mode="before")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v and not re.match(r"^https?://", v):
            return None
        return v

    def to_db_dict(self) -> dict:
        """Convert to dict matching Drizzle column names for INSERT."""
        import json

        return {
            "id": self.id,
            "title": self.title,
            "company_name": self.company_name,
            "description": self.description,
            "location": self.location,
            "salary_min": float(self.salary_min) if self.salary_min else None,
            "salary_max": float(self.salary_max) if self.salary_max else None,
            "job_type": self.job_type,
            "remote": self.remote,
            "source": self.source,
            "source_url": self.source_url,
            "skills_required": json.dumps(self.skills_required) if self.skills_required else None,
            "experience_required": self.experience_required,
            "posted_at": self.posted_at,
            "expires_at": self.expires_at,
            "is_active": self.is_active,
            "embedding": self.embedding,
        }


class ScrapingMetrics(BaseModel):
    """Structured logging metrics for scraping operations."""

    source: str = "hiring_cafe"
    event: str = "metrics"
    jobs_found: int = 0
    jobs_stored: int = 0
    jobs_embedded: int = 0
    duplicates_skipped: int = 0
    errors: int = 0
    duration_seconds: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    def to_log_dict(self) -> dict:
        return {
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
            "event": self.event,
            "jobs_found": self.jobs_found,
            "jobs_stored": self.jobs_stored,
            "jobs_embedded": self.jobs_embedded,
            "duplicates_skipped": self.duplicates_skipped,
            "errors": self.errors,
            "duration_seconds": round(self.duration_seconds, 2),
        }
