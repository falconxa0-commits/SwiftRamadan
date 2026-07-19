#!/bin/bash
set -euo pipefail

# SwiftRamadan Production Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

ENV=${1:-production}
echo "🚀 Deploying SwiftRamadan to $ENV..."

# Check required tools
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Install Docker first."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose not found."; exit 1; }

# Check .env file exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example and fill in your values."
  exit 1
fi

# Check required environment variables
REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "AUTH_JWT_SECRET"
)
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "❌ Required environment variable $var is not set"
    exit 1
  fi
done

echo "📦 Building Docker images..."
docker compose build --no-cache app

echo "🗄️ Starting services..."
docker compose up -d

echo "⏳ Waiting for database..."
sleep 5

echo "📊 Running database migrations..."
docker compose exec app npx prisma migrate deploy

echo "✅ Deployment complete!"
echo ""
echo "Health check: curl http://localhost/api/health"
echo "App URL: http://localhost:3000"
echo ""
echo "📋 Useful commands:"
echo "  docker compose logs -f app     # View app logs"
echo "  docker compose logs -f postgres # View database logs"
echo "  docker compose down             # Stop all services"
echo "  docker compose restart app      # Restart app only"
