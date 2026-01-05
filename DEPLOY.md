# Postly Deployment Guide

## Quick Reference

| Environment | Command |
|-------------|---------|
| Local Dev | `npm run dev` |
| Docker Build | `docker compose -f docker-compose.prod.yml build` |
| Docker Start | `docker compose -f docker-compose.prod.yml up -d` |
| Docker Stop | `docker compose -f docker-compose.prod.yml down` |
| View Logs | `docker compose -f docker-compose.prod.yml logs -f` |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# 3. Start infrastructure (PostgreSQL, Redis)
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 4. Run migrations
npm run migrate:up --workspace=@postly/database

# 5. Start all services
npm run dev
```

**Services:**
- Web: http://localhost:3001
- API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## Docker Production (1GB RAM Optimized)

### Initial Setup

```bash
# 1. Clone and enter directory
git clone <your-repo> postly && cd postly

# 2. Create environment file
cp .env.example .env

# 3. Edit .env for production
nano .env
```

**Required .env changes for Docker:**
```env
NODE_ENV=production

# Use Docker container names
DB_HOST=postgres
DB_USER=postly
DB_PASSWORD=<secure-password>

REDIS_HOST=redis

# Generate secure secrets
JWT_SECRET=<run: openssl rand -hex 32>
JWT_REFRESH_SECRET=<run: openssl rand -hex 32>

# Your API key
GEMINI_API_KEY=<your-key>

# Your domain
WEB_URL=https://yourdomain.com
```

### Deploy

```bash
# Build containers
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Generate Secrets

```bash
# JWT secrets (run twice, use different values)
openssl rand -hex 32

# Database password
openssl rand -base64 24
```

---

## Memory Budget (~450MB)

| Service | RAM Limit |
|---------|-----------|
| PostgreSQL | 180MB |
| Redis | 50MB |
| Nginx (Web) | 20MB |
| API | 100MB |
| Scraper | 60MB |

---

## Common Operations

### Restart a Service
```bash
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart web
```

### View Service Logs
```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f postgres
```

### Update and Redeploy
```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Database Backup
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postly postly > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postly postly
```

### Enter Container Shell
```bash
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec postgres psql -U postly postly
```

---

## Health Checks

```bash
# API health
curl http://localhost:3000/health

# Nginx health
curl http://localhost/nginx-health

# All containers status
docker compose -f docker-compose.prod.yml ps
```

---

## Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker compose -f docker-compose.prod.yml logs api

# Check if port is in use
netstat -tulpn | grep 80
```

### Database connection failed
```bash
# Verify postgres is healthy
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Check environment variables
docker compose -f docker-compose.prod.yml exec api env | grep DB_
```

### Out of memory
```bash
# Check memory usage
docker stats

# Reduce limits in docker-compose.prod.yml if needed
```
