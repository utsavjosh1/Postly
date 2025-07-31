# Job Scraper - Production-Ready Tech Job Listings Scraper

A high-performance, production-ready web scraper designed to collect tech job listings from major platforms like LinkedIn. Built with Python, featuring async concurrency, rate limiting, and seamless deployment to Google Cloud Run.

## 🚀 Features

- **Multi-platform Support**: LinkedIn with expandable architecture for additional job sites
- **Async Concurrency**: High-performance scraping using `asyncio`, `aiohttp`, and `httpx`
- **JavaScript Support**: Playwright integration for dynamic content (LinkedIn, etc.)
- **Smart Rate Limiting**: Respects anti-bot measures with configurable delays
- **Data Storage**: Supabase PostgreSQL integration with automatic deduplication
- **Cloud-Ready**: Optimized for Google Cloud Run deployment
- **Monitoring**: Comprehensive logging and health checks
- **Configurable**: Environment-based configuration for different deployment scenarios

## 📦 Tech Stack

- **Python 3.11+** - Modern Python with type hints
- **Playwright** - JavaScript-heavy site scraping (LinkedIn)
- **aiohttp/httpx** - Async HTTP requests for static sites
- **lxml** - Fast HTML parsing
- **Pydantic** - Data validation and serialization
- **Supabase** - PostgreSQL database with real-time features
- **Docker** - Containerization for consistent deployments

## 🗂️ Project Structure

```
job-scraper/
├── scraper/
│   ├── __init__.py          # Package initialization
│   ├── main.py              # Entry point and CLI
│   ├── scraper.py           # Core scraping orchestrator
│   ├── playwright_utils.py  # Playwright utilities for dynamic sites
│   ├── models.py            # Pydantic data models
│   ├── supabase_client.py   # Database operations
│   └── config.py            # Configuration management
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container configuration
├── deploy.sh               # GCP deployment script
├── .env                    # Environment variables (template)
├── .gitignore             # Git ignore rules
├── .dockerignore          # Docker ignore rules
└── README.md              # This file
```

## 🛠️ Installation

### Prerequisites

- Python 3.11+
- Docker (for containerization)
- Google Cloud SDK (for deployment)
- Supabase account

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd job-scraper
```

2. **Create virtual environment**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
playwright install chromium
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

5. **Set up Supabase database**

Create a table called `jobs` in your Supabase project:

```sql
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    tags TEXT[],
    description TEXT,
    salary_range TEXT,
    employment_type TEXT,
    experience_level TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_scraped_at ON jobs(scraped_at);
CREATE INDEX idx_jobs_source ON jobs(source);
```

## 🚀 Usage

### Command Line Interface

The scraper supports multiple modes:

```bash
# One-time scrape with default tech keywords
python -m scraper.main --mode once

# Custom keyword search
python -m scraper.main --mode once --keywords "python,django,fastapi" --location "San Francisco"

# Continuous service mode (runs every 30 minutes)
python -m scraper.main --mode service

# Get statistics
python -m scraper.main --mode stats

# Debug mode
python -m scraper.main --mode once --debug
```

### Programmatic Usage

```python
import asyncio
from scraper import run_custom_scrape, JobScraper, SearchQuery

# Simple custom scrape
async def example_scrape():
    result = await run_custom_scrape(
        keywords=["python", "machine learning"],
        location="Remote",
        max_results=50
    )
    print(f"Found {result.jobs_saved} jobs")

# Advanced usage with custom queries
async def advanced_scrape():
    async with JobScraper() as scraper:
        queries = [
            SearchQuery(
                keywords=["react", "typescript"],
                location="New York",
                max_results=30
            ),
            SearchQuery(
                keywords=["devops", "kubernetes"],
                location="Remote",
                max_results=20
            )
        ]
        result = await scraper.scrape_jobs(queries)
        return result

asyncio.run(example_scrape())
```

## 🐳 Docker Usage

### Build and Run Locally

```bash
# Build the image
docker build -t job-scraper .

# Run with environment file
docker run --env-file .env job-scraper

# Run one-time scrape
docker run --env-file .env job-scraper python -m scraper.main --mode once

# Run with custom parameters
docker run --env-file .env job-scraper python -m scraper.main --mode once --keywords "python,aws"
```

## ☁️ Google Cloud Run Deployment

### Automated Deployment

Use the provided deployment script:

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to GCP (replace with your project ID)
./deploy.sh your-gcp-project-id us-central1
```

### Manual Deployment

```bash
# Build and push image
docker build -t gcr.io/your-project/job-scraper .
docker push gcr.io/your-project/job-scraper

# Deploy to Cloud Run
gcloud run deploy job-scraper \
    --image gcr.io/your-project/job-scraper \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 3600 \
    --set-env-vars "SUPABASE_URL=your-url,SUPABASE_KEY=your-key"
```

### Cloud Scheduler Setup

For automated scraping every 30 minutes:

```bash
# Enable API
gcloud services enable cloudscheduler.googleapis.com

# Create scheduled job
gcloud scheduler jobs create http job-scraper-schedule \
    --schedule="*/30 * * * *" \
    --uri="https://your-service-url/trigger" \
    --http-method=POST \
    --time-zone="America/New_York"
```

## ⚙️ Configuration

### Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Scraping Configuration
MAX_CONCURRENT_REQUESTS=5          # Concurrent request limit
REQUEST_DELAY_MIN=2.0              # Minimum delay between requests
REQUEST_DELAY_MAX=5.0              # Maximum delay between requests
RATE_LIMIT_REQUESTS_PER_MINUTE=30  # Rate limiting

# Optional Proxy Support
USE_PROXIES=false
PROXY_LIST=proxy1:port,proxy2:port

# Cloud Run
PORT=8080
```

### Search Keywords

Default tech keywords (configurable in `config.py`):
- python, javascript, developer, ML, react, aws
- software engineer, frontend, backend, fullstack
- data scientist, devops, cloud, typescript, node.js

## 📊 Monitoring and Logging

### Health Checks

The application includes comprehensive health checks:

```bash
# Check application health
curl https://your-service-url/health

# View recent statistics
python -m scraper.main --mode stats
```

### Logging

Structured logging is available at multiple levels:

- **INFO**: General operation status
- **DEBUG**: Detailed scraping information
- **WARNING**: Non-critical issues
- **ERROR**: Critical errors requiring attention

### Cloud Run Monitoring

Monitor your deployment:

```bash
# View logs
gcloud logs read --service job-scraper

# Monitor metrics
gcloud monitoring dashboards list
```

## 🧪 Testing

Run tests (when implemented):

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/

# Run with coverage
pytest --cov=scraper tests/
```

## 🔒 Security

- **Non-root container**: Runs as dedicated user
- **Environment variables**: Sensitive data via env vars
- **Rate limiting**: Respects website policies
- **User agent rotation**: Reduces detection risk
- **Proxy support**: Optional proxy rotation

## 🚨 Rate Limiting & Ethics

This scraper implements responsible scraping practices:

- Configurable delays between requests
- Respect for robots.txt (when applicable)
- Rate limiting to avoid overwhelming servers
- User agent rotation
- Graceful error handling

**Please use responsibly and in accordance with website terms of service.**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Playwright Installation Issues**
```bash
# Reinstall Playwright
playwright uninstall
playwright install chromium
```

2. **Supabase Connection Errors**
- Verify SUPABASE_URL and SUPABASE_KEY
- Check network connectivity
- Ensure database table exists

3. **Rate Limiting**
- Increase delays in configuration
- Reduce concurrent requests
- Check for IP blocking

4. **Memory Issues on Cloud Run**
- Increase memory allocation
- Reduce concurrent requests
- Optimize batch sizes

### Getting Help

- Check logs: `docker logs <container-id>`
- Enable debug mode: `--debug`
- Monitor Cloud Run metrics
- Review Supabase logs

## 🎯 Roadmap

- [ ] Additional job site integrations (Indeed, Glassdoor)
- [ ] Advanced filtering and matching algorithms
- [ ] Real-time notifications via Discord/Slack
- [ ] Machine learning for job relevance scoring
- [ ] API endpoint for external integrations
- [ ] Comprehensive test suite
- [ ] Performance optimization
- [ ] Advanced proxy rotation

---

Built with ❤️ for the developer community. Happy job hunting! 🎉
