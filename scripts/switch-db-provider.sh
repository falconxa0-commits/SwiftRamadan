#!/bin/bash
set -euo pipefail

# SwiftRamadan DB Provider Switch
# Usage: ./scripts/switch-db-provider.sh [sqlite|postgresql]

PROVIDER="${1:-sqlite}"

if [ "$PROVIDER" = "postgresql" ]; then
  echo "📋 Switching to PostgreSQL..."
  cp prisma/schema.postgresql.prisma prisma/schema.prisma
  echo "✅ Active schema: PostgreSQL"
  echo "   Make sure DATABASE_URL is set to a postgresql:// URL"
elif [ "$PROVIDER" = "sqlite" ]; then
  echo "📋 Switching to SQLite..."
  cp src/__ui_backup__/phase16/infrastructure/schema.prisma.sqlite prisma/schema.prisma
  echo "✅ Active schema: SQLite"
  echo "   Make sure DATABASE_URL is set to file:./db/custom.db"
else
  echo "❌ Unknown provider: $PROVIDER"
  echo "   Usage: ./scripts/switch-db-provider.sh [sqlite|postgresql]"
  exit 1
fi

# Regenerate Prisma client
npx prisma generate
echo "✅ Prisma client regenerated"
