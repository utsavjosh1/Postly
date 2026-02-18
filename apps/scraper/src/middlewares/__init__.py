#!/usr/bin/env python3
"""
Middlewares package for Scrapy pipeline.
"""

from .deduplication import DeduplicationMiddleware, generate_fingerprint

__all__ = ['DeduplicationMiddleware', 'generate_fingerprint']
