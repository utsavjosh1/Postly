# Quick Start Guide - Job Scraper

This guide will get you up and running with the Job Scraper in under 10 minutes.

## 🚀 Quick Setup (Local Development)

### 1. Prerequisites

- Python 3.11+ installed
- Git installed
- Supabase account created

### 2. Clone and Setup

```bash
# Clone the repository (if from git)
git clone <your-repo-url>
cd job-scraper

# Or if you have the files already, navigate to the directory
cd job-scraper

# Run the setup script
chmod +x setup.sh
./setup.sh
```

### 3. Configure Environment

```bash
# Copy the environment template
cp .env .env.local

# Edit with your Supabase credentials
nano .env  # or use your preferred editor
```

Required environment variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

### 4. Setup Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the query to create tables and indexes

### 5. Test Run

```bash
# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate     # Windows

# Test the scraper
python -m scraper.main --mode once --debug --max-results 5
```

## ☁️ Quick Deploy to Google Cloud Run

### 1. Prerequisites

- Google Cloud account
- `gcloud` CLI installed and authenticated

### 2. Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy (replace with your project ID)
./deploy.sh your-gcp-project-id us-central1
```

### 3. Set Environment Variables

After deployment, add your Supabase credentials:

```bash
gcloud run services update job-scraper \
    --region us-central1 \
    --set-env-vars "SUPABASE_URL=https://your-project.supabase.co,SUPABASE_KEY=your-key"
```

## 📊 Monitoring Your Deployment

### Health Check

```bash
curl https://your-service-url/health
```

### View Statistics

```bash
curl https://your-service-url/stats
```

### Trigger Manual Scrape

```bash
curl -X POST https://your-service-url/trigger
```

### View Logs

```bash
gcloud logs read --service job-scraper --limit 50
```

## 🧪 Test Examples

Run the example script to test different functionalities:

```bash
# Run all examples
python examples.py --all

# Run specific example
python examples.py --example 1
```

## 🎯 Common Commands

### Local Development

```bash
# One-time scrape with custom keywords
python -m scraper.main --mode once --keywords "python,django" --location "San Francisco"

# Get statistics
python -m scraper.main --mode stats

# Run in service mode (continuous)
python -m scraper.main --mode service

# Debug mode
python -m scraper.main --mode once --debug
```

### Docker Commands

```bash
# Build image
docker build -t job-scraper .

# Run container
docker run --env-file .env job-scraper

# Run with custom command
docker run --env-file .env job-scraper python -m scraper.main --mode once --debug
```

### Production Commands

```bash
# Check service status
gcloud run services describe job-scraper --region us-central1

# Update service
gcloud run services update job-scraper --region us-central1 --memory 4Gi

# View metrics
gcloud logging read "resource.type=cloud_run_revision" --limit 100
```

## 🔧 Configuration Options

Key environment variables:

| Variable                         | Default | Description                    |
| -------------------------------- | ------- | ------------------------------ |
| `MAX_CONCURRENT_REQUESTS`        | 5       | Concurrent scraping requests   |
| `REQUEST_DELAY_MIN`              | 2.0     | Minimum delay between requests |
| `REQUEST_DELAY_MAX`              | 5.0     | Maximum delay between requests |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | 30      | Rate limiting threshold        |

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**

   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt
   playwright install chromium
   ```

2. **Supabase Connection Issues**
   - Check URL and key in `.env`
   - Verify network connectivity
   - Ensure database table exists

3. **Playwright Issues**

   ```bash
   # Reinstall browsers
   playwright uninstall
   playwright install chromium
   ```

4. **Cloud Run Memory Issues**
   ```bash
   # Increase memory allocation
   gcloud run services update job-scraper --memory 4Gi --region us-central1
   ```

### Getting Help

- Check logs: `python -m scraper.main --mode once --debug`
- Run health check: `python -c "import asyncio; from scraper.main import health_check; print(asyncio.run(health_check()))"`
- Test database: Check Supabase dashboard for recent data

## 📈 Scaling Tips

### For High Volume

1. Increase memory and CPU on Cloud Run
2. Adjust concurrent request limits
3. Use multiple service instances
4. Implement request queuing

### For Multiple Sites

1. Add new scraper modules
2. Extend the `SearchQuery` model
3. Update configuration for new sites
4. Test rate limits for each platform

## 🔐 Security Checklist

- ✅ Environment variables for secrets
- ✅ Non-root Docker container
- ✅ Rate limiting implemented
- ✅ Input validation with Pydantic
- ✅ Structured logging
- ✅ Health check endpoints

## 📞 Support

For issues or questions:

1. Check the main README.md
2. Review the examples.py file
3. Check logs for detailed error messages
4. Ensure all prerequisites are met

---

Happy scraping! 🎉
