# Use Bun base image
FROM oven/bun:1 as base
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/server ./apps/server

# Build the application
WORKDIR /app/apps/server
RUN bun run build

# Production stage
FROM oven/bun:1-slim as production
WORKDIR /app

# Copy built application
COPY --from=base /app/apps/server/dist ./dist
COPY --from=base /app/apps/server/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Set default port for Cloud Run
ENV PORT=8080

# Start the application
CMD ["bun", "run", "dist/index.js"]
