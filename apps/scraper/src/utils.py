#!/usr/bin/env python3
"""
utils.py
Shared utilities for the scraper application.
"""
from typing import List, Optional

def format_vector(embedding: Optional[List[float]]) -> Optional[str]:
    """
    Safely formats a float list into pgvector-compatible string.
    Use this everywhere — never use str(embedding) directly.
    """
    if not embedding:
        return None
    return '[' + ','.join(str(v) for v in embedding) + ']'