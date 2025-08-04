# 🚀 JobBot Server - Docker & GCP Deployment Guide

## Prerequisites

### 1. Install Required Tools

#### Docker Desktop
- Download from: https://docs.docker.com/get-docker/
- **IMPORTANT**: Start Docker Desktop before running any docker commands

#### Google Cloud CLI
```bash
# Windows (PowerShell as Administrator)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 2. Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing for the project
4. Note your Project ID (e.g., `jobbot-production-12345`)

## 🐳 Local Development & Testing

### 1. Start Docker Desktop
Make sure Docker Desktop is running before proceeding.

### 2. Test Local Build
```bash
# From the server directory
cd apps/server
./build-local.sh
```

This will:
- Build the Docker image
- Start a container
- Test health endpoints
- Show you the running server

### 3. Manual Docker Commands
```bash
# Build image
docker build -f Dockerfile -t jobbot-server:local ../../

# Run container
docker run -p 8000:8000 --env-file .env jobbot-server:local

# View logs
docker logs <container-name>

# Stop container
docker stop <container-name>
```

## ☁️ Google Cloud Platform Deployment

### 1. Initial Setup

#### Authenticate with Google Cloud
```bash
gcloud auth login
gcloud auth application-default login
```

#### Set Your Project
```bash
gcloud config set project YOUR_PROJECT_ID
```

### 2. Prepare Environment Configuration

#### Copy and Edit Production Environment
```bash
cp .env.production.template .env.production
```

Edit `.env.production` with your actual values:
```env
# Use your actual values!
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-cloud-run-url/api/auth/google/callback
SESSION_SECRET=your-super-secure-session-secret-at-least-32-characters-long
FRONTEND_URL=https://your-frontend-domain.com
```

#### Update Database Configuration
Make sure your `packages/db/.env` has the production database URL:
```env
DATABASE_URL="postgresql://postgres:password@host:5432/database"
DIRECT_URL="postgresql://postgres:password@host:5432/database"
```

### 3. Deploy to Google Cloud Run

#### Option A: Automated Script (Recommended)
```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Run deployment script
./deploy.sh
```

#### Option B: Manual Deployment
```bash
# 1. Set project
gcloud config set project YOUR_PROJECT_ID

# 2. Enable APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. Build and push image
IMAGE_NAME="gcr.io/YOUR_PROJECT_ID/jobbot-server"
docker build -f Dockerfile -t $IMAGE_NAME ../../
docker push $IMAGE_NAME

# 4. Deploy to Cloud Run
gcloud run deploy jobbot-server \
    --image $IMAGE_NAME \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --set-env-vars "JWT_SECRET=your-secret,NODE_ENV=production"
```

### 4. Set Up Continuous Deployment (Optional)

#### Connect GitHub Repository
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Create Trigger"
3. Connect your GitHub repository
4. Set trigger to run on pushes to `main` branch
5. Use the `cloudbuild.yaml` file in your repo root

## 🔧 Configuration

### Environment Variables for Cloud Run

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret for JWT tokens (32+ chars) | ✅ |
| `SESSION_SECRET` | Secret for sessions (32+ chars) | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ✅ |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | ✅ |
| `FRONTEND_URL` | Your frontend domain | ✅ |
| `NODE_ENV` | Set to `production` | ✅ |
| `PORT` | Port (Cloud Run sets this) | Auto |

### Database Configuration
- Database is configured in `packages/db/.env`
- Make sure production database URL is set
- Run migrations: `cd packages/db && npx prisma migrate deploy`

## 🚨 Troubleshooting

### Common Issues

#### Docker Build Fails
- Ensure Docker Desktop is running
- Check if all dependencies are properly installed
- Verify Dockerfile syntax

#### Cloud Run Deploy Fails
- Check that all required environment variables are set
- Verify Google Cloud APIs are enabled
- Ensure billing is enabled on your project

#### Database Connection Issues
- Verify database URL is correct in `packages/db/.env`
- Check if database is accessible from Cloud Run
- For Supabase: ensure connection pooling is enabled

#### OAuth Callback Issues
- Update Google OAuth settings with your Cloud Run URL
- Set `GOOGLE_CALLBACK_URL` to: `https://your-service-url/api/auth/google/callback`

### Useful Commands

```bash
# View Cloud Run logs
gcloud run services logs tail jobbot-server --region us-central1

# Get service URL
gcloud run services describe jobbot-server --region us-central1

# Update environment variables
gcloud run services update jobbot-server \
    --region us-central1 \
    --set-env-vars "KEY=value"

# View container logs locally
docker logs <container-id> -f
```

## 📈 Monitoring & Scaling

### Cloud Run automatically handles:
- **Scaling**: 0 to 10 instances based on traffic
- **Load balancing**: Distributes requests across instances
- **Health checks**: Monitors `/health` endpoint
- **SSL/HTTPS**: Automatic certificate management

### Custom Monitoring
- Set up Cloud Monitoring alerts
- Monitor response times and error rates
- Set up log-based metrics

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit secrets to git
2. **IAM Roles**: Use least privilege principle
3. **Network Security**: Cloud Run provides HTTPS by default
4. **Container Security**: Regular image updates
5. **Database**: Use SSL connections and strong passwords

## 💰 Cost Optimization

- **Cold Starts**: Expect ~1-2 second cold start
- **Pricing**: Pay only for actual usage
- **Memory**: 512Mi is usually sufficient
- **CPU**: 1 vCPU handles moderate traffic

## 🎯 Next Steps

1. Start Docker Desktop
2. Test local build: `./build-local.sh`
3. Set up Google Cloud project
4. Configure `.env.production`
5. Deploy: `./deploy.sh`
6. Update OAuth settings with new URL
7. Test your deployed API!

---

**Need help?** Check the logs and troubleshooting section above!
