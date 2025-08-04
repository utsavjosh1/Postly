#!/bin/bash

# JobBot Server - Setup Script for Docker and GCP deployment

echo "🚀 JobBot Server Deployment Setup"
echo "=================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Check Docker
check_docker() {
    echo_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        echo_error "Docker is not installed."
        echo_info "Please install Docker Desktop from: https://docs.docker.com/get-docker/"
        return 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        echo_error "Docker is installed but not running."
        echo_info "Please start Docker Desktop and try again."
        return 1
    fi
    
    echo_success "Docker is installed and running"
    return 0
}

# Check Google Cloud CLI
check_gcloud() {
    echo_info "Checking Google Cloud CLI installation..."
    
    if ! command -v gcloud &> /dev/null; then
        echo_warning "Google Cloud CLI is not installed."
        echo_info "To install:"
        echo_info "1. Download from: https://cloud.google.com/sdk/docs/install"
        echo_info "2. Or run: curl https://sdk.cloud.google.com | bash"
        echo_info "3. Restart your terminal after installation"
        return 1
    fi
    
    echo_success "Google Cloud CLI is installed"
    gcloud --version
    return 0
}

# Create production environment file
setup_env() {
    echo_info "Setting up environment configuration..."
    
    if [ ! -f ".env.production" ]; then
        echo_info "Creating .env.production from template..."
        cp .env.production.template .env.production
        echo_warning "Please edit .env.production with your actual values:"
        echo "  - JWT_SECRET (generate with: openssl rand -base64 32)"
        echo "  - SESSION_SECRET (generate with: openssl rand -base64 32)"
        echo "  - Google OAuth credentials"
        echo "  - Frontend URL"
    else
        echo_success ".env.production already exists"
    fi
}

# Test local build
test_local_build() {
    echo_info "Testing local Docker build..."
    
    if check_docker; then
        echo_info "Building Docker image locally..."
        if ./build-local.sh; then
            echo_success "Local build test passed!"
        else
            echo_error "Local build test failed. Check the error messages above."
            return 1
        fi
    else
        echo_warning "Skipping local build test - Docker not ready"
        return 1
    fi
}

# Main setup function
main() {
    echo_info "Starting setup process..."
    echo ""
    
    # Check prerequisites
    docker_ok=false
    gcloud_ok=false
    
    if check_docker; then
        docker_ok=true
    fi
    
    if check_gcloud; then
        gcloud_ok=true
    fi
    
    # Set up environment
    setup_env
    
    echo ""
    echo_info "Setup Summary:"
    echo "=============="
    
    if [ "$docker_ok" = true ]; then
        echo_success "Docker: Ready for local development"
    else
        echo_error "Docker: Not ready - install and start Docker Desktop"
    fi
    
    if [ "$gcloud_ok" = true ]; then
        echo_success "Google Cloud CLI: Ready for deployment"
    else
        echo_warning "Google Cloud CLI: Not installed - needed for GCP deployment"
    fi
    
    echo ""
    echo_info "Next Steps:"
    echo "==========="
    
    if [ "$docker_ok" = true ]; then
        echo "1. ✅ Test local build: ./build-local.sh"
    else
        echo "1. ❌ Install and start Docker Desktop first"
    fi
    
    if [ "$gcloud_ok" = true ]; then
        echo "2. ✅ Deploy to GCP: ./deploy.sh"
    else
        echo "2. ❌ Install Google Cloud CLI first"
    fi
    
    echo "3. 📝 Edit .env.production with your actual values"
    echo "4. 🌐 Set up Google Cloud project"
    echo "5. 🚀 Deploy: GCP_PROJECT_ID=your-project ./deploy.sh"
    
    echo ""
    echo_info "📖 For detailed instructions, see DEPLOYMENT.md"
    
    # Try local build if Docker is ready
    if [ "$docker_ok" = true ]; then
        echo ""
        read -p "Test local build now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            test_local_build
        fi
    fi
}

main "$@"
