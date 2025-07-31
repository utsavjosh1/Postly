#!/bin/bash

# Setup script for local development
# Usage: ./setup.sh

set -e

echo "🔧 Setting up Job Scraper for local development..."

# Check Python version
if ! python --version | grep -qE "Python 3\.(11|12)"; then
    echo "❌ Python 3.11+ is required"
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv .venv

# Activate virtual environment
echo "🔄 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source .venv/Scripts/activate
else
    source .venv/bin/activate
fi

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
playwright install chromium

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please copy .env.example to .env and configure it."
    echo "💡 Make sure to set your SUPABASE_URL and SUPABASE_KEY"
else
    echo "✅ .env file found"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with Supabase credentials"
echo "2. Set up the database table (see README.md)"
echo "3. Run: python -m scraper.main --mode once --debug"
echo ""
echo "For production deployment:"
echo "1. Configure GCP: gcloud auth login"
echo "2. Run: ./deploy.sh your-project-id"
