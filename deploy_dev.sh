#!/bin/bash

set -e

echo "Deploying to DEVELOPMENT environment..."

# Check if .env.dev exists
if [ ! -f .env.dev ]; then
    echo "Error: .env.dev file not found!"
    exit 1
fi

# Stop and remove existing container and image if they exist
echo "Cleaning up previous deployment..."
docker stop wear-it-backend-dev 2>/dev/null || true
docker rm wear-it-backend-dev 2>/dev/null || true
docker rmi wear-it-backend:dev 2>/dev/null || true

# Build Docker image
echo "Building Docker image..."
docker build -t wear-it-backend:dev .

# Run the container
echo "Starting container..."
docker run -d \
  --name wear-it-backend-dev \
  --env-file .env.dev \
  -v $(pwd)/.env.dev:/app/.env \
  -e NODE_ENV=development \
  -p ${PORT:-3003}:3003 \
  --restart unless-stopped \
  wear-it-backend:dev

echo "Development deployment complete!"
docker logs --tail 200 -f wear-it-backend-dev
