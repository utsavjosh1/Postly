#!/usr/bin/env python3
"""
models.py
Pydantic V2 schemas for type-safe job data handling.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator, computed_field
import hashlib
import re


class JobListing(BaseModel):
    """Raw scraped job data input from spiders."""
    
    url: str = Field(..., description="Original job posting URL")
    raw_html: Optional[str] = Field(None, description="Raw HTML content if available")
    source: Literal["linkedin", "indeed", "hiring_cafe", "weworkremotely", "remoteok", "glassdoor"] = Field(
        ..., description="Job board source"
    )
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Core fields (may be extracted from HTML or API)
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    location: Optional[str] = None
    job_description: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[Literal["full-time", "part-time", "contract", "internship", "temporary"]] = None
    remote_status: Optional[Literal["remote", "hybrid", "onsite", "unknown"]] = "unknown"
    application_link: Optional[str] = None
    
    # API-specific fields (e.g., Hiring Cafe's description_clean)
    description_clean: Optional[str] = None
    
    model_config = {
        "str_strip_whitespace": True,
        "validate_default": True,
    }


class ProcessedJob(BaseModel):
    """Validated and enriched job data with embeddings."""
    
    # Fingerprint for deduplication (computed from title + company + location)
    fingerprint: str = Field(..., description="SHA-256 hash for cross-source deduplication")
    
    # Core required fields
    job_id: str = Field(..., description="Unique job identifier")
    job_title: str = Field(..., min_length=5, description="Job title")
    job_description: str = Field(..., min_length=100, description="Cleaned markdown description")
    application_link: str = Field(..., pattern=r'^https?://', description="Application URL")
    job_source: str = Field(..., description="Source job board")
    
    # Optional enriched fields
    company_name: Optional[str] = None
    normalized_location: Optional[str] = None
    job_type: Optional[str] = None
    industry: Optional[str] = None
    salary_range: Optional[str] = None
    experience_required: Optional[str] = None
    skills_required: list[str] = Field(default_factory=list)
    employment_mode: Optional[str] = None
    remote_status: str = "unknown"
    posting_date: Optional[str] = None
    expiry_date: Optional[str] = None
    
    # Embedding (1024-dim for Voyage AI voyage-3.5-lite)
    embedding: Optional[list[float]] = Field(None, description="1024-dim Voyage embedding vector")
    
    # Glassdoor enrichment fields
    employee_rating: Optional[float] = Field(None, ge=0, le=5, description="Glassdoor rating")
    salary_estimate: Optional[str] = None
    
    # Metadata
    meta: dict = Field(default_factory=dict)
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "str_strip_whitespace": True,
        "validate_default": True,
    }
    
    @field_validator('job_title', 'company_name', mode='before')
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return ' '.join(v.split())
    
    @field_validator('skills_required', mode='before')
    @classmethod
    def ensure_list(cls, v) -> list[str]:
        if v is None:
            return []
        if isinstance(v, str):
            return [s.strip() for s in v.split(',') if s.strip()]
        return list(v)


def normalize_location(location: Optional[str]) -> str:
    """
    Normalize location string for consistent fingerprinting.
    
    Examples:
        "San Francisco, CA" -> "san francisco ca"
        "SF, California" -> "sf california"
        "Remote (US)" -> "remote us"
    """
    if not location:
        return ""
    
    # Lowercase and remove special characters
    normalized = location.lower()
    normalized = re.sub(r'[^\w\s]', ' ', normalized)
    normalized = ' '.join(normalized.split())
    
    return normalized


def generate_fingerprint(title: str, company: str, location: str) -> str:
    """
    Generate SHA-256 fingerprint for cross-source deduplication.
    
    Args:
        title: Job title
        company: Company name
        location: Job location
        
    Returns:
        64-character hex digest
    """
    # Normalize all inputs
    normalized_title = title.lower().strip() if title else ""
    normalized_company = company.lower().strip() if company else ""
    normalized_location = normalize_location(location)
    
    content = f"{normalized_title}|{normalized_company}|{normalized_location}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


class ScrapingMetrics(BaseModel):
    """Structured logging metrics for scraping operations."""
    
    source: str
    event: str
    jobs_found: int = 0
    jobs_embedded: int = 0
    duplicates_skipped: int = 0
    tokens_consumed: int = 0
    errors: int = 0
    duration_seconds: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    def to_log_dict(self) -> dict:
        """Convert to structured log format."""
        return {
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
            "event": self.event,
            "jobs_found": self.jobs_found,
            "jobs_embedded": self.jobs_embedded,
            "duplicates_skipped": self.duplicates_skipped,
            "tokens_consumed": self.tokens_consumed,
            "errors": self.errors,
            "duration_seconds": round(self.duration_seconds, 2),
        }
