"""Postly job spiders package."""
from .base import BaseSpider
from .remotive import RemotiveSpider
from .arbeitnow import ArbeitnowSpider
from .greenhouse import GreenhouseSpider

# HiringCafeSpider requires playwright — import conditionally
try:
    from .hiring_cafe import HiringCafeSpider
except ImportError:
    HiringCafeSpider = None

__all__ = [
    "BaseSpider",
    "RemotiveSpider",
    "ArbeitnowSpider",
    "GreenhouseSpider",
    "HiringCafeSpider",
]
