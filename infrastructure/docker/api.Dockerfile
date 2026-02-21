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
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci --ignore-scripts --legacy-peer-deps

# Copy source code
COPY . .

# Build API and its dependencies
RUN npx turbo run build --filter=api

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY turbo.json ./

# Explicitly copy workspace packages for prod install
COPY packages/database/package.json ./packages/database/
COPY packages/ai-utils/package.json ./packages/ai-utils/
COPY packages/logger/package.json ./packages/logger/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/app-config/package.json ./packages/config/app-config/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY apps/api/package*.json ./apps/api/

RUN npm ci --omit=dev --ignore-scripts --legacy-peer-deps

# Copy built files from builder
# Explicitly copy dist folders to ensure correct structure
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/ai-utils/dist ./packages/ai-utils/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start API
CMD ["node", "apps/api/dist/server.js"]
