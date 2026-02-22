# Stage 1: Build
FROM --platform=$BUILDPLATFORM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy root config files
COPY package*.json turbo.json ./

# Copy all workspace package.json files for installation
COPY packages/database/package.json ./packages/database/
COPY packages/ai-utils/package.json ./packages/ai-utils/
COPY packages/logger/package.json ./packages/logger/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/app-config/package.json ./packages/config/app-config/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY apps/api/package*.json ./apps/api/

# Install dependencies allowing native scripts to run
# HUSKY=0 prevents git hooks from failing in docker
RUN --mount=type=cache,target=/root/.npm HUSKY=0 npm ci --legacy-peer-deps

# Copy full source
COPY . .

# Build specific app
RUN npx turbo run build --filter=api

# Stage 2: Production
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy root config files
COPY package*.json turbo.json ./

# Copy workspace package.json files for production install
COPY packages/database/package.json ./packages/database/
COPY packages/ai-utils/package.json ./packages/ai-utils/
COPY packages/logger/package.json ./packages/logger/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/app-config/package.json ./packages/config/app-config/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY apps/api/package*.json ./apps/api/

# Production-only install with native scripts allowed
# We delete the prepare script to avoid husky failing since it's a devDependency
RUN --mount=type=cache,target=/root/.npm \
    npm pkg delete scripts.prepare && \
    HUSKY=0 npm ci --omit=dev --legacy-peer-deps

# Copy built artifacts from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/ai-utils/dist ./packages/ai-utils/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/config/app-config/dist ./packages/config/app-config/dist

# Secure user built into node image
USER node

EXPOSE 3000

# Pure Node healthcheck (No wget or curl required)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) process.exit(1)})" || exit 1

# Start API with optimized memory
CMD ["node", "--max-old-space-size=200", "apps/api/dist/server.js"]