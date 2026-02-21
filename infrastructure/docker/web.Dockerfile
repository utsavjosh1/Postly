# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./

# Explicitly copy workspace packages
COPY packages/database/package.json ./packages/database/
COPY packages/ai-utils/package.json ./packages/ai-utils/
COPY packages/logger/package.json ./packages/logger/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/app-config/package.json ./packages/config/app-config/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci --ignore-scripts --legacy-peer-deps

# Copy source code
COPY . .

# Build packages and web app
RUN npx turbo run build --filter=web

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3001

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start web app
CMD ["serve", "-s", "apps/web/dist", "-l", "3001"]
