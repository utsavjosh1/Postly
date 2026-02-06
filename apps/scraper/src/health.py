#!/usr/bin/env python3
"""
health.py
Health check HTTP endpoint for container orchestration.
"""

import asyncio
import logging
from aiohttp import web
from datetime import datetime
from typing import Dict, Any, Callable

logger = logging.getLogger(__name__)

class HealthCheckServer:
    """Lightweight HTTP server for health checks and simple API endpoints."""
    
    def __init__(self, port: int = 8080):
        self.port = port
        self.app = web.Application()
        self.runner = None
        self.site = None
        self.start_time = datetime.utcnow()
        
        # Health status
        self.status = {
            "healthy": True,
            "database_connected": False,
            "browser_ready": False,
            "last_scrape": None,
            "errors": []
        }
        
        # Setup default routes
        self.app.router.add_get('/health', self.health_check)
        self.app.router.add_get('/ready', self.readiness_check)
        self.app.router.add_get('/metrics', self.metrics)

    def add_route(self, method: str, path: str, handler: Callable):
        """Add a custom route to the server."""
        self.app.router.add_route(method, path, handler)
    
    async def health_check(self, request) -> web.Response:
        """Liveness probe - is the service running?"""
        uptime = (datetime.utcnow() - self.start_time).total_seconds()
        
        return web.json_response({
            "status": "healthy" if self.status["healthy"] else "unhealthy",
            "uptime_seconds": uptime,
            "timestamp": datetime.utcnow().isoformat()
        }, status=200 if self.status["healthy"] else 503)
    
    async def readiness_check(self, request) -> web.Response:
        """Readiness probe - is the service ready to accept traffic?"""
        ready = (
            self.status["database_connected"] and 
            self.status["browser_ready"]
        )
        
        return web.json_response({
            "ready": ready,
            "database": self.status["database_connected"],
            "browser": self.status["browser_ready"],
            "timestamp": datetime.utcnow().isoformat()
        }, status=200 if ready else 503)
    
    async def metrics(self, request) -> web.Response:
        """Prometheus-style metrics endpoint."""
        uptime = (datetime.utcnow() - self.start_time).total_seconds()
        
        metrics_text = f"""# HELP scraper_uptime_seconds Total uptime in seconds
# TYPE scraper_uptime_seconds gauge
scraper_uptime_seconds {uptime}

# HELP scraper_healthy Health status (1=healthy, 0=unhealthy)
# TYPE scraper_healthy gauge
scraper_healthy {1 if self.status["healthy"] else 0}

# HELP scraper_database_connected Database connection status
# TYPE scraper_database_connected gauge
scraper_database_connected {1 if self.status["database_connected"] else 0}

# HELP scraper_browser_ready Browser ready status
# TYPE scraper_browser_ready gauge
scraper_browser_ready {1 if self.status["browser_ready"] else 0}

# HELP scraper_errors_total Total number of errors
# TYPE scraper_errors_total counter
scraper_errors_total {len(self.status["errors"])}
"""
        return web.Response(text=metrics_text, content_type='text/plain')
    
    def update_status(self, **kwargs):
        """Update health status."""
        self.status.update(kwargs)
    
    async def start(self):
        """Start the health check server."""
        try:
            self.runner = web.AppRunner(self.app)
            await self.runner.setup()
            self.site = web.TCPSite(self.runner, '0.0.0.0', self.port)
            await self.site.start()
            logger.info(f"Health check server started on port {self.port}")
        except Exception as e:
            logger.error(f"Failed to start health server: {e}")
            raise # Propagate error to fail fast
    
    async def stop(self):
        """Stop the health check server."""
        if self.site:
            await self.site.stop()
        if self.runner:
            await self.runner.cleanup()
        logger.info("Health check server stopped")
