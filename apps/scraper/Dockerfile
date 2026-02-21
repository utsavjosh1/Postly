# stage 1: builder - for python dependencies
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# stage 2: final - minimal runtime
FROM python:3.12-slim-bookworm

WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Chromium and minimal dependencies
# We use playwright to install the browser but manually handle dependencies
# to keep the image size low and avoid problematic packages.
RUN apt-get update && apt-get install -y --no-install-recommends \
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
    && pip install playwright \
    && playwright install chromium \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 scraper && \
    chown -R scraper:scraper /app /opt/venv

COPY --chown=scraper:scraper src/ ./src/

ENV PYTHONPATH=/app/src
USER scraper

HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=2 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')" || exit 1

EXPOSE 8080

CMD ["python", "-m", "src.main"]
