# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/database/package.json ./packages/database/
COPY packages/ai-utils/package.json ./packages/ai-utils/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/logger/package.json ./packages/logger/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN npm ci

# Copy source code
COPY packages/database ./packages/database
COPY packages/ai-utils ./packages/ai-utils
COPY packages/config ./packages/config
COPY packages/shared-types ./packages/shared-types
COPY packages/logger ./packages/logger
COPY apps/api ./apps/api

# Build packages in order
RUN npm run build --workspace=@postly/shared-types
RUN npm run build --workspace=@postly/logger
RUN npm run build --workspace=@postly/database
RUN npm run build --workspace=@postly/ai-utils
RUN npm run build --workspace=api

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy package files for production install
COPY package*.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/ai-utils/package.json ./packages/ai-utils/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/logger/package.json ./packages/logger/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/ai-utils/dist ./packages/ai-utils/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Memory-optimized startup
CMD ["node", "--max-old-space-size=80", "apps/api/dist/server.js"]
