#!/bin/bash

# Pull latest changes
git pull

# Build and start containers
docker-compose down
docker-compose build
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run migrate

echo "Deployment completed successfully!" 