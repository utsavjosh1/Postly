# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/package.json ./packages/database/
COPY packages/config/eslint/package.json ./packages/config/eslint/
COPY packages/config/typescript/package.json ./packages/config/typescript/
COPY apps/bot-discord/package.json ./apps/bot-discord/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages ./packages
COPY apps/bot-discord ./apps/bot-discord

# Build necessary packages first
RUN npm run build --workspace=@postly/shared-types
RUN npm run build --workspace=@postly/database
RUN npm run build --workspace=bot-discord

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/apps/bot-discord/dist ./apps/bot-discord/dist
COPY --from=builder /app/apps/bot-discord/package.json ./apps/bot-discord/

# Set working directory to bot app
WORKDIR /app/apps/bot-discord

CMD ["npm", "start"]
