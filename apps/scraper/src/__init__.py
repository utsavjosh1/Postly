#!/usr/bin/env python3
"""
Postly Job Scraper Package

Production-grade multi-source job aggregator:
- Sources: Remotive, Arbeitnow, Greenhouse ATS, hiring.cafe
- Voyage AI embeddings (768-dim, matches Drizzle schema)
- Source-URL-based deduplication across all sources
- aiohttp async spiders (API-first) + Playwright (hiring.cafe fallback)
- Structured JSON logging
"""

__version__ = "3.0.0"
