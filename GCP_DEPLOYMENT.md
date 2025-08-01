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

## Web App Deployment (Firebase Hosting)

### Build and deploy the web app to Firebase Hosting:

```bash
# Build the web app
cd apps/web
bun run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Environment Variables Setup

### Server Environment Variables (Cloud Run):

- `NODE_ENV=production`
- `SUPABASE_URL=your_production_supabase_url`
- `SUPABASE_ANON_KEY=your_production_anon_key`
- `SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key`
- `JWT_SECRET=your_production_jwt_secret`
- `PORT=8080` (Cloud Run uses port 8080)

### Web App Environment Variables:

- `VITE_SUPABASE_URL=your_production_supabase_url`
- `VITE_SUPABASE_ANON_KEY=your_production_anon_key`
- `VITE_API_BASE_URL=https://your-cloud-run-service-url/api`

## Prerequisites

1. **Google Cloud Project**: Create a project in Google Cloud Console
2. **Supabase Project**: Set up your production Supabase project
3. **Docker**: Install Docker for containerization
4. **Firebase CLI**: Install for web app deployment
5. **Google Cloud SDK**: Install gcloud CLI tool

## Security Considerations

1. **Environment Variables**: Never commit production secrets to version control
2. **CORS**: Configure CORS for your production domains
3. **Rate Limiting**: Adjust rate limits for production load
4. **SSL/TLS**: Cloud Run and Firebase Hosting provide HTTPS by default
5. **Database Security**: Enable RLS (Row Level Security) in Supabase

## Monitoring and Logging

- **Cloud Logging**: Automatically enabled for Cloud Run
- **Cloud Monitoring**: Set up alerts and dashboards
- **Supabase Analytics**: Monitor database performance
- **Error Reporting**: Implement error tracking (e.g., Sentry)

## Scaling Configuration

- **Cloud Run**: Auto-scales based on traffic
- **Supabase**: Scales automatically for most use cases
- **CDN**: Firebase Hosting includes global CDN

## Cost Optimization

- **Cloud Run**: Pay per request, scales to zero
- **Firebase Hosting**: Generous free tier
- **Supabase**: Affordable database and auth service
