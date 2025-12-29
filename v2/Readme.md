# Postly V2 - AI-Powered Job Matching Platform

An enterprise-grade AI job matching platform built with modern technologies, designed for scalability and performance.

## 🚀 Features

- **AI-Powered Job Matching**: Semantic search using Google Gemini API and pgvector
- **Resume Analysis**: Automated parsing and skill extraction from PDFs
- **ChatGPT-like Interface**: Conversational AI for job recommendations
- **Job Scraping**: Automated scraping from multiple sources (Indeed, LinkedIn, etc.)
- **Employer Dashboard**: Direct job posting for companies
- **Discord/Reddit Bots**: Community integrations (paid service)
- **Resume Builder**: AI-powered suggestions and ATS optimization
- **Mobile-Ready API**: Designed for future mobile app expansion

## 🏗️ Tech Stack

### Frontend
- **Vite + React** - Fast, modern build tool
- **TypeScript** - Type safety
- **Tailwind CSS + shadcn/ui** - Beautiful UI components
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management

### Backend
- **Node.js + Express** - High-performance API
- **PostgreSQL + pgvector** - Vector database for semantic search
- **Redis + BullMQ** - Queue system for job scraping
- **Google Gemini API** - AI/ML capabilities
- **LangChain** - AI orchestration

### Infrastructure
- **Docker + Docker Compose** - Containerization
- **Kubernetes** - Production orchestration
- **GitHub Actions** - CI/CD
- **Prometheus + Grafana** - Monitoring

## 📁 Project Structure

```
v2/
├── apps/
│   ├── web/          # Vite + React frontend
│   ├── api/          # Express.js backend
│   ├── scraper/      # Job scraping service
│   └── bot-discord/  # Discord bot
├── packages/
│   ├── database/     # PostgreSQL queries and migrations
│   ├── shared-types/ # TypeScript types
│   ├── ai-utils/     # Gemini API + LangChain
│   ├── logger/       # Winston logging
│   └── config/       # Shared configs
└── infrastructure/
    ├── docker/       # Dockerfiles
    └── k8s/          # Kubernetes manifests
```

## 🛠️ Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **Docker** and Docker Compose
- **npm** >= 10.9.0

### Installation

1. **Clone the repository**
   ```bash
   cd v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Start Docker services**
   ```bash
   cd infrastructure/docker
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL with pgvector (port 5432)
   - Redis (port 6379)
   - MinIO (ports 9000, 9001)

5. **Run database migrations**
   ```bash
   cd packages/database
   npm run migrate:up
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts all services in parallel:
   - Web app: http://localhost:3001
   - API: http://localhost:3000

## 📝 Available Scripts

### Root Level

```bash
npm run dev        # Start all apps in dev mode
npm run build      # Build all apps
npm run test       # Run all tests
npm run lint       # Lint all code
npm run format     # Format code with Prettier
npm run clean      # Clean all build artifacts
```

### Individual Apps

```bash
npm run dev --filter=web      # Run only frontend
npm run dev --filter=api      # Run only backend
npm run build --filter=web    # Build only frontend
npm run test --filter=api     # Test only backend
```

### Database

```bash
cd packages/database
npm run migrate:up       # Run migrations
npm run migrate:down     # Rollback migration
npm run migrate:create   # Create new migration
```

## 🗄️ Database Schema

The database uses PostgreSQL with the pgvector extension for semantic search.

### Core Tables

- **users** - User accounts (job seekers, employers, admins)
- **resumes** - Uploaded resumes with AI analysis
- **jobs** - Job listings (scraped + company-posted)
- **job_matches** - AI-generated job recommendations
- **bot_subscriptions** - Discord/Reddit community subscriptions
- **scraping_jobs** - Job scraping queue status

## 🐳 Docker Services

### PostgreSQL + pgvector
- Container: `postly-postgres`
- Port: 5432
- Credentials: postgres/postgres
- Database: postly

### Redis
- Container: `postly-redis`
- Port: 6379
- Used for caching and job queues

### MinIO (S3-compatible storage)
- Container: `postly-minio`
- Ports: 9000 (API), 9001 (Console)
- Credentials: minioadmin/minioadmin
- Used for resume file storage

### Useful Docker Commands

```bash
# View logs
docker logs postly-postgres
docker logs postly-redis

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Restart a service
docker-compose restart postgres
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test --filter=api -- --watch

# Run specific test file
npm run test --filter=api -- users.test.ts

# Generate coverage report
npm run test -- --coverage
```

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Docker Build

```bash
# Build all images
docker build -t postly-web -f infrastructure/docker/web.Dockerfile .
docker build -t postly-api -f infrastructure/docker/api.Dockerfile .
```

### Kubernetes Deployment

```bash
kubectl apply -f infrastructure/k8s/
```

## 🔒 Security

- JWT-based authentication with refresh tokens
- Bcrypt password hashing
- Rate limiting on all endpoints
- Helmet.js security headers
- Input validation with Zod
- SQL injection prevention (parameterized queries)
- XSS protection

## 📊 Monitoring

- **Prometheus** for metrics collection
- **Grafana** for visualization
- **Winston** for structured logging
- **Health check endpoints** for each service

## 💰 Cost Optimization

### Self-Hosted Services
- PostgreSQL (Docker)
- Redis (Docker)
- MinIO for file storage
- Nginx for load balancing

### Managed Services
- Google Gemini API (~$0.001/1K tokens)
- Cloudflare (free tier for DNS + CDN)
- GitHub Actions (free for public repos)

**Estimated Monthly Cost (MVP)**: $120-255

## 📄 License

Private - All rights reserved

---

Built with ❤️ using Turborepo, React, Node.js, and PostgreSQL