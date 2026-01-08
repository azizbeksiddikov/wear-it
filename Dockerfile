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

# Expose port (default 3003, can be overridden via env)
EXPOSE 3003

# Health check (uses PORT env var or defaults to 3003)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3003; require('http').get(`http://localhost:${port}`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Run the application
CMD ["node", "dist/server.js"]
