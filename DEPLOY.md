# Postly Deployment Guide

## Quick Start (Production)

> [!NOTE]
> Optimized for low-resource VPS (~1GB RAM).

### 1. Initial Setup
Run the automated setup script. This will check dependencies, copy environment files, and generate secure secrets.

```bash
make setup
```

### 2. Configure Keys
Open `.env` and fill in any missing required keys found by the script (e.g., `GEMINI_API_KEY`, `DISCORD_TOKEN`).

```bash
nano .env
```

### 3. Launch
Start the entire stack in detached mode.

```bash
make up
```

---

## Management

| Action | Command | Description |
| :--- | :--- | :--- |
| **Start** | `make up` | Start all services (detached) |
| **Stop** | `make down` | Stop all services |
| **Logs** | `make logs` | Follow logs for all services |
| **Restart** | `make restart` | Soft restart all services |
| **Status** | `docker ps` | View running containers |

## Shell Access

```bash
# Enter API container
make shell-api

# Enter Database container
make shell-db
```

## Database Management

```bash
# Create a backup (saved to ./backups/)
make backup-db

# Restore from backup
# Cat the file into the restore command
cat backups/backup_FILE.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postly postly
```

## Troubleshooting

- **Permissions**: If `make setup` fails, try `chmod +x scripts/setup.sh`.
- **Memory Issues**: If services crash with `137` code, they are out of memory. 
    - Check usage: `docker stats`
    - Adjust `deploy.resources.limits` in `docker-compose.prod.yml`.
    - Adjust `NODE_OPTIONS="--max-old-space-size=..."` in `docker-compose.prod.yml`.


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

| Service     | RAM Limit |
| ----------- | --------- |
| PostgreSQL  | 180MB     |
| Redis       | 50MB      |
| Nginx (Web) | 20MB      |
| API         | 100MB     |
| Scraper     | 60MB      |

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
