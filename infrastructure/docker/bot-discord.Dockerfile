# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY packages/package*.json ./packages/
COPY apps/bot-discord/package*.json ./apps/bot-discord/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build packages and Discord bot
RUN npm run build --filter=@postly/*
RUN npm run build --filter=bot-discord

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies
COPY package*.json ./
COPY turbo.json ./
COPY packages/package*.json ./packages/
COPY apps/bot-discord/package*.json ./apps/bot-discord/

RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/apps/bot-discord/dist ./apps/bot-discord/dist
COPY --from=builder /app/packages/*/dist ./packages/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Start Discord bot
CMD ["node", "apps/bot-discord/dist/bot.js"]
