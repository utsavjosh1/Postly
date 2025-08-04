#!/bin/bash

# JobBot Server - Google Cloud Run Deployment Script
# This script builds and deploys your server to Google Cloud Run

set -e

echo "🚀 Starting JobBot Server deployment to Google Cloud Run..."

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-jobbot-production}"
SERVICE_NAME="jobbot-server"
REGION="${GCP_REGION:-us-central1}"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    echo_info "Checking requirements..."
    
    if ! command -v gcloud &> /dev/null; then
        echo_error "Google Cloud CLI is not installed. Please install it first:"
        echo "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo_error "Docker is not installed. Please install it first:"
        echo "https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    echo_success "All requirements met"
}

# Set up Google Cloud project
setup_gcloud() {
    echo_info "Setting up Google Cloud project..."
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    echo_info "Enabling required APIs..."
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    
    # Configure Docker for GCR
    gcloud auth configure-docker
    
    echo_success "Google Cloud setup complete"
}

# Build Docker image
build_image() {
    echo_info "Building Docker image..."
    
    # Build from the root directory to include monorepo context
    cd ../..
    docker build -f apps/server/Dockerfile -t $IMAGE_NAME .
    cd apps/server
    
    echo_success "Docker image built: $IMAGE_NAME"
}

# Push image to Google Container Registry
push_image() {
    echo_info "Pushing image to Google Container Registry..."
    
    docker push $IMAGE_NAME
    
    echo_success "Image pushed to GCR"
}

# Deploy to Cloud Run
deploy_service() {
    echo_info "Deploying to Cloud Run..."
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo_warning ".env.production not found. Creating from template..."
        cp .env.production.template .env.production
        echo_error "Please edit .env.production with your actual values and run this script again."
        exit 1
    fi
    
    # Create env vars array for Cloud Run
    ENV_VARS=""
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ ! $line =~ ^#.*$ ]] && [[ ! -z "$line" ]]; then
            # Extract key=value
            if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
                key="${BASH_REMATCH[1]}"
                value="${BASH_REMATCH[2]}"
                # Remove quotes if present
                value=$(echo $value | sed 's/^"\(.*\)"$/\1/')
                ENV_VARS="$ENV_VARS --set-env-vars $key=$value"
            fi
        fi
    done < .env.production
    
    # Deploy to Cloud Run
    gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --concurrency 80 \
        --timeout 300 \
        $ENV_VARS
    
    echo_success "Deployment complete!"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
    echo_success "Service URL: $SERVICE_URL"
    echo_info "Update your frontend NEXT_PUBLIC_API_URL to: $SERVICE_URL"
}

# Main deployment flow
main() {
    echo_info "Starting deployment for project: $PROJECT_ID"
    echo_info "Service: $SERVICE_NAME"
    echo_info "Region: $REGION"
    echo ""
    
    check_requirements
    setup_gcloud
    build_image
    push_image
    deploy_service
    
    echo ""
    echo_success "🎉 Deployment completed successfully!"
    echo_info "Your JobBot server is now running on Google Cloud Run"
}

# Run main function
main "$@"
