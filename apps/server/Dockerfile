# Multi-stage Docker build for JobBot Server
FROM oven/bun:1 as base

# Set working directory
WORKDIR /app

# Copy root package files for monorepo
COPY package.json bun.lockb turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/server/package.json ./apps/server/

# Install all dependencies
RUN bun install --frozen-lockfile

# Copy shared packages source code
COPY packages/ ./packages/

# Build shared packages first (especially the database package)
WORKDIR /app/packages/db
RUN bun run build || echo "No build script found for db package"

# Copy server source code
WORKDIR /app
COPY apps/server ./apps/server

# Build the server application
WORKDIR /app/apps/server
RUN bun run build

# Production stage
FROM oven/bun:1-slim as production

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/apps/server/dist ./
COPY --from=base /app/apps/server/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages

# Create non-root user for security
RUN groupadd -r jobbot && useradd -r -g jobbot jobbot
RUN chown -R jobbot:jobbot /app
USER jobbot

# Expose port (Cloud Run will inject PORT env var)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Start the application
CMD ["bun", "run", "index.js"]
