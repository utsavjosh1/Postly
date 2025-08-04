#!/bin/bash

# Local Docker build and test script for JobBot Server

set -e

echo "🐳 Building JobBot Server Docker image locally..."

# Configuration
IMAGE_NAME="jobbot-server:local"
CONTAINER_NAME="jobbot-server-test"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Clean up any existing container
cleanup() {
    echo_info "Cleaning up existing containers..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Build the image
build_image() {
    echo_info "Building Docker image..."
    cd ../..
    docker build -f apps/server/Dockerfile -t $IMAGE_NAME .
    cd apps/server
    echo_success "Image built successfully: $IMAGE_NAME"
}

# Test the image
test_image() {
    echo_info "Testing the Docker image..."
    
    # Check if .env exists for local testing
    if [ ! -f ".env" ]; then
        echo_error ".env file not found. Please create one for local testing."
        exit 1
    fi
    
    # Run container in detached mode
    docker run -d \
        --name $CONTAINER_NAME \
        --env-file .env \
        -p 8000:8000 \
        $IMAGE_NAME
    
    echo_info "Container started. Waiting for server to be ready..."
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo_success "✅ Health check passed!"
    else
        echo_error "❌ Health check failed!"
        docker logs $CONTAINER_NAME
        cleanup
        exit 1
    fi
    
    # Test auth status endpoint
    if curl -f http://localhost:8000/api/auth/status > /dev/null 2>&1; then
        echo_success "✅ Auth endpoint working!"
    else
        echo_error "❌ Auth endpoint failed!"
        docker logs $CONTAINER_NAME
        cleanup
        exit 1
    fi
    
    echo_success "🎉 All tests passed!"
    echo_info "Server is running at http://localhost:8000"
    echo_info "To stop: docker stop $CONTAINER_NAME"
    echo_info "To view logs: docker logs $CONTAINER_NAME -f"
}

# Main function
main() {
    cleanup
    build_image
    test_image
}

# Show container logs and cleanup on script exit
trap cleanup EXIT

main "$@"
