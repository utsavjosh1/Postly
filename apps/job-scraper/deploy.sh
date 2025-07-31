#!/bin/bash

# Deploy script for Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

# Configuration
PROJECT_ID=${1:-"your-gcp-project-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="job-scraper"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying Job Scraper to Google Cloud Run"
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Authenticate with gcloud (if needed)
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "Please authenticate with gcloud:"
    gcloud auth login
fi

# Set the project
echo "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the Docker image
echo "🏗️  Building Docker image..."
docker build -t $IMAGE_NAME .

# Push the image to Google Container Registry
echo "📤 Pushing image to GCR..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 3600 \
    --concurrency 10 \
    --max-instances 5 \
    --set-env-vars "ENVIRONMENT=production" \
    --port 8080

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo "📊 To view logs: gcloud logs read --service $SERVICE_NAME"

# Optional: Set up Cloud Scheduler
read -p "Do you want to set up Cloud Scheduler to run the scraper every 30 minutes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⏰ Setting up Cloud Scheduler..."
    
    # Enable Cloud Scheduler API
    gcloud services enable cloudscheduler.googleapis.com
    
    # Create the scheduled job
    gcloud scheduler jobs create http job-scraper-schedule \
        --schedule="*/30 * * * *" \
        --uri="${SERVICE_URL}/trigger" \
        --http-method=POST \
        --time-zone="America/New_York" \
        --description="Trigger job scraper every 30 minutes" \
        --attempt-deadline=3600s
    
    echo "✅ Cloud Scheduler job created!"
    echo "📅 The scraper will run every 30 minutes"
fi

echo "🎉 All done! Your job scraper is now running on Google Cloud Run."
