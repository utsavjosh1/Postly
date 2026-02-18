#!/usr/bin/env python3
"""
Spiders package for job scraping.
"""

from .hiring_cafe import HiringCafeSpider
from .indeed import IndeedSpider

__all__ = ['HiringCafeSpider', 'IndeedSpider']
