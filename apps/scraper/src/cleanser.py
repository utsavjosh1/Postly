#!/usr/bin/env python3
"""
cleanser.py
Content cleaning utility using trafilatura and regex for noise removal.
"""

import re
import logging
from typing import Optional
import trafilatura
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class JobContentCleanser:
    """
    Cleanses raw HTML job postings into clean Markdown.
    
    Features:
    - Main content extraction via trafilatura
    - HTML → Markdown conversion
    - Removal of navbars, footers, tracking scripts
    - Noise pattern removal (boilerplates, disclaimers)
    - Unicode normalization
    """
    
    # Common job board noise patterns to remove
    NOISE_PATTERNS = [
        # Equal Opportunity statements
        re.compile(
            r'(equal\s+opportunity\s+employer|eeo\s+statement|we\s+are\s+an?\s+equal|'
            r'affirmative\s+action|diversity\s+and\s+inclusion\s+statement)',
            re.IGNORECASE
        ),
        # Share/Social prompts
        re.compile(
            r'(share\s+this\s+job|share\s+on\s+(linkedin|twitter|facebook)|'
            r'refer\s+a\s+friend|tell\s+a\s+friend)',
            re.IGNORECASE
        ),
        # Cookie/Privacy notices
        re.compile(
            r'(cookie\s+(policy|notice|consent)|privacy\s+policy|terms\s+of\s+service|'
            r'gdpr|accept\s+cookies)',
            re.IGNORECASE
        ),
        # Apply now spam
        re.compile(
            r'(click\s+here\s+to\s+apply|apply\s+now\s+button|submit\s+your\s+resume|'
            r'create\s+an?\s+account\s+to\s+apply)',
            re.IGNORECASE
        ),
        # Job board branding
        re.compile(
            r'(powered\s+by\s+\w+|posted\s+on\s+\w+\.com|via\s+\w+\s+jobs|'
            r'this\s+job\s+was\s+posted)',
            re.IGNORECASE
        ),
        # Tracking noise
        re.compile(
            r'(utm_\w+=[^&\s]+|ref=[^&\s]+|\?source=\w+)',
            re.IGNORECASE
        ),
    ]
    
    # Sections to remove entirely (case-insensitive headers)
    REMOVABLE_SECTIONS = [
        'similar jobs',
        'related positions',
        'you may also like',
        'recommended for you',
        'more jobs at',
        'about our company',
        'company overview',
        'share this job',
        'follow us',
    ]
    
    # Elements to strip from HTML before extraction
    STRIP_TAGS = [
        'script', 'style', 'nav', 'header', 'footer', 'aside',
        'iframe', 'noscript', 'form', 'button', 'input',
        'svg', 'img', 'video', 'audio',
    ]
    
    def __init__(self, min_content_length: int = 100):
        self.min_content_length = min_content_length
    
    def _preprocess_html(self, html: str) -> str:
        """Remove noisy HTML elements before extraction."""
        try:
            soup = BeautifulSoup(html, 'lxml')
            
            # Remove unwanted tags
            for tag in self.STRIP_TAGS:
                for element in soup.find_all(tag):
                    element.decompose()
            
            # Remove elements with noise-indicating classes/ids
            noise_indicators = ['cookie', 'banner', 'popup', 'modal', 'sidebar', 'widget', 'ad-']
            for indicator in noise_indicators:
                for element in soup.find_all(class_=re.compile(indicator, re.I)):
                    element.decompose()
                for element in soup.find_all(id=re.compile(indicator, re.I)):
                    element.decompose()
            
            return str(soup)
        except Exception as e:
            logger.warning(f"HTML preprocessing failed: {e}")
            return html
    
    def _extract_main_content(self, html: str) -> Optional[str]:
        """Extract main content using trafilatura."""
        try:
            preprocessed = self._preprocess_html(html)
            
            extracted = trafilatura.extract(
                preprocessed,
                include_comments=False,
                include_tables=True,  # Job descriptions often use tables for requirements
                include_images=False,
                include_links=False,
                no_fallback=False,
                favor_precision=True,
                output_format='markdown',  # Direct markdown output
            )
            
            return extracted
        except Exception as e:
            logger.error(f"Trafilatura extraction failed: {e}")
            return None
    
    def _remove_noise_patterns(self, text: str) -> str:
        """Remove common job board noise patterns."""
        result = text
        
        for pattern in self.NOISE_PATTERNS:
            # Find and remove entire sentences containing noise patterns
            sentences = re.split(r'(?<=[.!?])\s+', result)
            clean_sentences = [s for s in sentences if not pattern.search(s)]
            result = ' '.join(clean_sentences)
        
        return result
    
    def _remove_sections(self, text: str) -> str:
        """Remove entire sections with noisy headers."""
        lines = text.split('\n')
        result_lines = []
        skip_until_next_header = False
        
        for line in lines:
            # Check if this is a header (markdown # or all caps)
            is_header = line.strip().startswith('#') or (
                len(line.strip()) > 3 and 
                line.strip().isupper() and 
                len(line.strip()) < 100
            )
            
            if is_header:
                # Check if this header indicates a removable section
                header_text = line.strip().lower().lstrip('#').strip()
                skip_until_next_header = any(
                    section in header_text for section in self.REMOVABLE_SECTIONS
                )
                
                if not skip_until_next_header:
                    result_lines.append(line)
            elif not skip_until_next_header:
                result_lines.append(line)
        
        return '\n'.join(result_lines)
    
    def _normalize_whitespace(self, text: str) -> str:
        """Normalize whitespace and line breaks."""
        # Collapse multiple blank lines to maximum 2
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Remove trailing whitespace from lines
        text = '\n'.join(line.rstrip() for line in text.split('\n'))
        
        # Collapse multiple spaces to single space
        text = re.sub(r'[ \t]+', ' ', text)
        
        return text.strip()
    
    def _normalize_unicode(self, text: str) -> str:
        """Normalize unicode characters."""
        # Common unicode replacements
        replacements = {
            '\u2018': "'",  # Left single quote
            '\u2019': "'",  # Right single quote
            '\u201c': '"',  # Left double quote
            '\u201d': '"',  # Right double quote
            '\u2013': '-',  # En dash
            '\u2014': '-',  # Em dash
            '\u2026': '...',  # Ellipsis
            '\u00a0': ' ',  # Non-breaking space
            '\u200b': '',   # Zero-width space
            '\ufeff': '',   # BOM
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text
    
    def cleanse(self, html: str, source: str = "unknown") -> Optional[str]:
        """
        Full cleansing pipeline: HTML → Clean Markdown.
        
        Args:
            html: Raw HTML content
            source: Job source for logging
            
        Returns:
            Cleaned markdown text, or None if extraction failed
        """
        if not html or len(html.strip()) < 50:
            logger.warning(f"[{source}] HTML too short for extraction")
            return None
        
        # Step 1: Extract main content with trafilatura
        extracted = self._extract_main_content(html)
        if not extracted:
            logger.warning(f"[{source}] Content extraction failed")
            return None
        
        # Step 2: Remove noise patterns
        cleaned = self._remove_noise_patterns(extracted)
        
        # Step 3: Remove noisy sections
        cleaned = self._remove_sections(cleaned)
        
        # Step 4: Normalize unicode
        cleaned = self._normalize_unicode(cleaned)
        
        # Step 5: Normalize whitespace
        cleaned = self._normalize_whitespace(cleaned)
        
        # Validate minimum length
        if len(cleaned) < self.min_content_length:
            logger.warning(f"[{source}] Cleaned content too short ({len(cleaned)} chars)")
            return None
        
        logger.debug(f"[{source}] Cleansed content: {len(html)} HTML → {len(cleaned)} markdown")
        return cleaned
    
    def cleanse_api_content(self, description: str, source: str = "unknown") -> str:
        """
        Cleanse already-extracted API content (e.g., Hiring Cafe's description_clean).
        
        Lighter processing since content is already somewhat clean.
        """
        if not description:
            return ""
        
        # Remove noise patterns
        cleaned = self._remove_noise_patterns(description)
        
        # Normalize unicode and whitespace
        cleaned = self._normalize_unicode(cleaned)
        cleaned = self._normalize_whitespace(cleaned)
        
        return cleaned


# Singleton instance for convenience
_cleanser = None

def get_cleanser() -> JobContentCleanser:
    """Get singleton cleanser instance."""
    global _cleanser
    if _cleanser is None:
        _cleanser = JobContentCleanser()
    return _cleanser


def cleanse_html(html: str, source: str = "unknown") -> Optional[str]:
    """Convenience function for cleansing HTML content."""
    return get_cleanser().cleanse(html, source)


def cleanse_api_content(description: str, source: str = "unknown") -> str:
    """Convenience function for cleansing API content."""
    return get_cleanser().cleanse_api_content(description, source)
