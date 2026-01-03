# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY packages/package*.json ./packages/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build packages and web app
RUN npm run build --filter=@postly/*
RUN npm run build --filter=web

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies
COPY package*.json ./
COPY turbo.json ./
COPY packages/package*.json ./packages/
COPY apps/web/package*.json ./apps/web/

RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/packages/*/dist ./packages/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3001

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start web app
CMD ["npm", "run", "start", "--workspace=web"]
