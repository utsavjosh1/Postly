# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Install Playwright browsers and dependencies
RUN playwright install chromium && \
    playwright install-deps chromium

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r scraper && useradd -r -g scraper scraper
RUN chown -R scraper:scraper /app
USER scraper

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import asyncio; from scraper.main import health_check; exit(0 if asyncio.run(health_check()) else 1)"

# Expose port for Cloud Run
EXPOSE 8080

# Default command
CMD ["python", "-m", "scraper.main", "--mode", "service"]
