"""Pydantic models for job data structures."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, HttpUrl, Field, validator


class JobListing(BaseModel):
    """Model for a job listing."""
    
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Job location")
    url: HttpUrl = Field(..., description="Job posting URL")
    tags: List[str] = Field(default_factory=list, description="Relevant tags/keywords")
    description: Optional[str] = Field(None, description="Job description")
    salary_range: Optional[str] = Field(None, description="Salary information if available")
    employment_type: Optional[str] = Field(None, description="Full-time, Part-time, Contract, etc.")
    experience_level: Optional[str] = Field(None, description="Entry, Mid, Senior, etc.")
    scraped_at: datetime = Field(default_factory=datetime.utcnow, description="When the job was scraped")
    source: str = Field(..., description="Source platform (e.g., LinkedIn, Indeed)")
    
    @validator('tags')
    def validate_tags(cls, v):
        """Ensure tags are non-empty strings."""
        return [tag.strip() for tag in v if tag.strip()]
    
    @validator('title', 'company', 'location')
    def validate_required_strings(cls, v):
        """Ensure required string fields are not empty."""
        if not v or not v.strip():
            raise ValueError("Required field cannot be empty")
        return v.strip()
    
    class Config:
        """Pydantic configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ScrapingResult(BaseModel):
    """Model for scraping operation results."""
    
    total_jobs_found: int = Field(..., description="Total number of jobs found")
    jobs_saved: int = Field(..., description="Number of jobs successfully saved")
    jobs_filtered: int = Field(..., description="Number of jobs filtered out")
    errors: List[str] = Field(default_factory=list, description="Any errors encountered")
    duration_seconds: float = Field(..., description="Time taken for the operation")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When the scraping completed")
    
    @property
    def success_rate(self) -> float:
        """Calculate the success rate of the scraping operation."""
        if self.total_jobs_found == 0:
            return 0.0
        return (self.jobs_saved / self.total_jobs_found) * 100


class SearchQuery(BaseModel):
    """Model for job search parameters."""
    
    keywords: List[str] = Field(..., description="Keywords to search for")
    location: Optional[str] = Field(None, description="Location to search in")
    max_results: int = Field(default=100, description="Maximum number of results to scrape")
    experience_level: Optional[str] = Field(None, description="Experience level filter")
    employment_type: Optional[str] = Field(None, description="Employment type filter")
    
    @validator('keywords')
    def validate_keywords(cls, v):
        """Ensure keywords are not empty."""
        if not v or not any(keyword.strip() for keyword in v):
            raise ValueError("At least one keyword must be provided")
        return [keyword.strip().lower() for keyword in v if keyword.strip()]
