# Multi-stage build for production
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source code and build the application
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files and install ONLY production dependencies, then clean cache in same layer
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy static assets
COPY src/views ./dist/views
COPY src/public ./dist/public

# Copy health check script
COPY healthcheck.js ./healthcheck.js

# Port: container port = host port. Prod 4011, dev 4111, local 4211 (set PORT at run time).
ENV PORT=4011
EXPOSE 4011

# Health check (uses the PORT env var)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "healthcheck.js"]

# Run the application
CMD ["node", "dist/server.js"]
