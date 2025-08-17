# Backend Dockerfile for Fastify API
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build:api

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Copy built application
COPY --from=builder --chown=fastify:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=fastify:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules

USER fastify

EXPOSE 3001

ENV PORT 3001
ENV HOST "0.0.0.0"

CMD ["node", "apps/api/dist/server.js"]