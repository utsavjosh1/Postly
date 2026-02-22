# Stage 1: Build
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native modules
RUN apk add --no-cache python3 make g++

# Copy package files for dependency installation
COPY package*.json ./
COPY turbo.json ./

# Copy all package.json files for workspaces
COPY packages/database/package.json ./packages/database/
COPY packages/ai-utils/package.json ./packages/ai-utils/
COPY packages/logger/package.json ./packages/logger/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/app-config/package.json ./packages/config/app-config/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY apps/api/package*.json ./apps/api/

# Install dependencies (removed --ignore-scripts so native modules can build)
RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build API and its dependencies using turbo
RUN npx turbo run build --filter=api

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files for production install
COPY package*.json ./
COPY turbo.json ./

# Copy package.json files for production workspaces
COPY packages/database/package.json ./packages/database/
COPY packages/ai-utils/package.json ./packages/ai-utils/
COPY packages/logger/package.json ./packages/logger/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/app-config/package.json ./packages/config/app-config/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY apps/api/package*.json ./apps/api/

# Install python/make/g++ temporarily to build production native modules,
# then install without --ignore-scripts, and finally remove the build tools
RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    npm ci --omit=dev --legacy-peer-deps && \
    apk del .build-deps

# Copy built files from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/ai-utils/dist ./packages/ai-utils/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/config/app-config/dist ./packages/config/app-config/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Health check (architecture check)
# Using wget which is more robust in Alpine and avoids unmatched quote issues
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start API with memory optimization
CMD ["node", "--max-old-space-size=80", "apps/api/dist/server.js"]
