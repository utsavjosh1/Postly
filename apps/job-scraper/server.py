"""
Simple HTTP server for health checks and monitoring.
This can be used when deploying to Cloud Run to provide health endpoints.
"""

import json
import asyncio
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

from scraper.main import health_check
from scraper.scraper import JobScraper
from scraper.config import config


class HealthCheckHandler(BaseHTTPRequestHandler):
    """HTTP handler for health checks and monitoring endpoints."""
    
    def do_GET(self):
        """Handle GET requests."""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/health':
            self.handle_health_check()
        elif path == '/stats':
            self.handle_stats()
        elif path == '/':
            self.handle_root()
        else:
            self.send_error(404, "Not Found")
    
    def do_POST(self):
        """Handle POST requests."""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/trigger':
            self.handle_trigger_scrape()
        else:
            self.send_error(404, "Not Found")
    
    def handle_health_check(self):
        """Handle health check endpoint."""
        try:
            # Run async health check in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            is_healthy = loop.run_until_complete(health_check())
            loop.close()
            
            response = {
                "status": "healthy" if is_healthy else "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "service": "job-scraper",
                "version": "1.0.0"
            }
            
            status_code = 200 if is_healthy else 503
            self.send_json_response(response, status_code)
            
        except Exception as e:
            response = {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
            self.send_json_response(response, 500)
    
    def handle_stats(self):
        """Handle statistics endpoint."""
        try:
            async def get_stats():
                async with JobScraper() as scraper:
                    return await scraper.get_job_statistics()
            
            # Run async stats in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            stats = loop.run_until_complete(get_stats())
            loop.close()
            
            response = {
                "statistics": stats,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.send_json_response(response, 200)
            
        except Exception as e:
            response = {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
            self.send_json_response(response, 500)
    
    def handle_trigger_scrape(self):
        """Handle manual scrape trigger (for Cloud Scheduler)."""
        try:
            from scraper.main import run_daily_scrape
            
            # Run scrape in background thread to avoid blocking
            def run_scrape():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                result = loop.run_until_complete(run_daily_scrape())
                loop.close()
                return result
            
            # Start scrape in background
            thread = threading.Thread(target=run_scrape)
            thread.daemon = True
            thread.start()
            
            response = {
                "message": "Scraping job started",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.send_json_response(response, 202)  # Accepted
            
        except Exception as e:
            response = {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
            self.send_json_response(response, 500)
    
    def handle_root(self):
        """Handle root endpoint with service information."""
        response = {
            "service": "Job Scraper API",
            "version": "1.0.0",
            "endpoints": {
                "GET /health": "Health check",
                "GET /stats": "Job statistics",
                "POST /trigger": "Trigger manual scrape"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.send_json_response(response, 200)
    
    def send_json_response(self, data, status_code=200):
        """Send JSON response."""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        json_data = json.dumps(data, indent=2)
        self.wfile.write(json_data.encode())
    
    def log_message(self, format, *args):
        """Override to use our logging system."""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"{self.address_string()} - {format % args}")


def run_server(port=None):
    """Run the HTTP server."""
    import logging
    
    port = port or config.PORT
    
    logger = logging.getLogger(__name__)
    logger.info(f"Starting HTTP server on port {port}")
    
    server_address = ('', port)
    httpd = HTTPServer(server_address, HealthCheckHandler)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("HTTP server stopped")
    finally:
        httpd.server_close()


if __name__ == '__main__':
    import logging
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    run_server()
