#!/bin/bash

set -e

echo "Deploying to PRODUCTION environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file based on .env.example"
    exit 1
fi

# Remove local node_modules to save storage as we use Docker
rm -rf node_modules
rm -rf dist

# Stop and remove existing container and image if they exist
echo "Cleaning up previous deployment..."
docker stop wear-it-backend-prod 2>/dev/null || true
docker rm wear-it-backend-prod 2>/dev/null || true
docker rmi wear-it-backend:prod 2>/dev/null || true

# Build Docker image
echo "Building Docker image..."
docker build -t wear-it-backend:prod .

# Run the container
echo "Starting container..."
docker run -d \
  --name wear-it-backend-prod \
  --env-file .env \
  -v $(pwd)/.env:/app/.env \
  -e NODE_ENV=production \
  -p ${PORT:-3003}:3003 \
  --restart unless-stopped \
  wear-it-backend:prod

echo "Production deployment complete!"
docker logs --tail 200 -f wear-it-backend-prod
