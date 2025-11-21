#############################################################
# Dockerfile for NestJS Application
#############################################################

# Use multi-stage build to reduce final image size and remove build dependencies
# Stage 1 - Builder
FROM node:22.14.0-alpine AS builder

# Create app directory and set working directory
WORKDIR /usr/src/app

# Install system dependencies (if needed)
RUN apk update && apk add --no-cache bash

# Copy package files first to leverage Docker cache
COPY package*.json tsconfig*.json ./

# Install dependencies
RUN npm ci --quiet --no-audit --no-fund

# Copy source code
COPY src/ src/
COPY nest-cli.json ./

# Build application
RUN npm run build

# Stage 2 - Production image
FROM node:22.14.0-alpine

WORKDIR /usr/src/app

# Copy built assets from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Remove dev dependencies
RUN npm prune --production

# Environment variables
ENV NODE_ENV=production

# Run as non-root user for security
RUN chown -R node:node .
USER node

# Expose port
EXPOSE 3000

CMD ["npm", "run", "start:prod"]
