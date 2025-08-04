# Google Cloud Platform Deployment Configuration

## Server Deployment (Cloud Run)

### Build and deploy the server to Cloud Run:

```bash
# Build the server
cd apps/server
bun run build

# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/jobbot-server .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/jobbot-server

# Deploy to Cloud Run
gcloud run deploy jobbot-server \
  --image gcr.io/YOUR_PROJECT_ID/jobbot-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,SUPABASE_URL=your_production_supabase_url,SUPABASE_ANON_KEY=your_production_anon_key,SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key,JWT_SECRET=your_production_jwt_secret"
```