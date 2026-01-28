# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/config/typescript-config/package.json ./packages/config/typescript-config/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY packages/config/typescript-config ./packages/config/typescript-config
COPY packages/config/eslint-config ./packages/config/eslint-config
COPY apps/web ./apps/web

# Build shared-types first, then web
RUN npm run build --workspace=@postly/shared-types
RUN npm run build --workspace=web

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && adduser -S nginx-user -u 1001 -G nginx-user

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
