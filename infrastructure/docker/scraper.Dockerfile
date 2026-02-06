FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies GLOBALLY (not --user)
COPY apps/scraper/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && rm requirements.txt

# Install Playwright browsers in globally accessible location
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
RUN playwright install chromium && \
    chmod -R 755 /opt/ms-playwright

# Create non-root user
RUN useradd -m -u 1000 scraper && chown -R scraper:scraper /app

# Copy source code
COPY --chown=scraper:scraper apps/scraper/src/ ./src/

# Switch to non-root user
USER scraper

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=2 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Expose health check port
EXPOSE 8080

# Entry point
CMD ["python", "src/main.py"]
