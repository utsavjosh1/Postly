"""Configuration management for the job scraper."""

import os
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Application configuration."""
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Scraping Configuration
    MAX_CONCURRENT_REQUESTS: int = int(os.getenv("MAX_CONCURRENT_REQUESTS", "5"))
    REQUEST_DELAY_MIN: float = float(os.getenv("REQUEST_DELAY_MIN", "2.0"))
    REQUEST_DELAY_MAX: float = float(os.getenv("REQUEST_DELAY_MAX", "5.0"))
    
    # Job Search Keywords
    TECH_KEYWORDS: List[str] = [
        "python", "javascript", "developer", "ML", "react", "aws",
        "software engineer", "frontend", "backend", "fullstack",
        "data scientist", "devops", "cloud", "typescript", "node.js"
    ]
    
    # LinkedIn Configuration
    LINKEDIN_BASE_URL: str = "https://www.linkedin.com/jobs/search"
    
    # User Agent Rotation
    USER_AGENTS: List[str] = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ]
    
    # Proxy Configuration (optional)
    USE_PROXIES: bool = os.getenv("USE_PROXIES", "false").lower() == "true"
    PROXY_LIST: List[str] = os.getenv("PROXY_LIST", "").split(",") if os.getenv("PROXY_LIST") else []
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "30"))
    
    # Cloud Run Configuration
    PORT: int = int(os.getenv("PORT", "8080"))
    
    @classmethod
    def validate(cls) -> bool:
        """Validate that all required configuration is present."""
        if not cls.SUPABASE_URL or not cls.SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
        return True


# Create global config instance
config = Config()
