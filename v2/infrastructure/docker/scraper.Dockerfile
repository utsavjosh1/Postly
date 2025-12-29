# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install Chromium for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY packages/package*.json ./packages/
COPY apps/scraper/package*.json ./apps/scraper/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build packages and scraper
RUN npm run build --filter=@postly/*
RUN npm run build --filter=scraper

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install Chromium and dependencies for scraper
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Install production dependencies
COPY package*.json ./
COPY turbo.json ./
COPY packages/package*.json ./packages/
COPY apps/scraper/package*.json ./apps/scraper/

RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/apps/scraper/dist ./apps/scraper/dist
COPY --from=builder /app/packages/*/dist ./packages/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Start scraper service
CMD ["node", "apps/scraper/dist/index.js"]
