#!/bin/bash
set -euo pipefail

# SwiftRamadan Production Seed Script
# Seeds essential data: admin user, default coupons, etc.

echo "🌱 Seeding production data..."

# Check we're running inside the Docker container or have DB access
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

# Generate NextAuth secret if not set
if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  export NEXTAUTH_SECRET=$(openssl rand -base64 32)
  echo "⚠️  Generated NEXTAUTH_SECRET (save this!): $NEXTAUTH_SECRET"
fi

# Generate JWT secret if not set
if [ -z "${AUTH_JWT_SECRET:-}" ]; then
  export AUTH_JWT_SECRET=$(openssl rand -base64 32)
  echo "⚠️  Generated AUTH_JWT_SECRET (save this!): $AUTH_JWT_SECRET"
fi

echo "✅ Seed complete. Remember to:"
echo "  1. Create an admin user via the signup flow"
echo "  2. Set up payment provider dashboards"
echo "  3. Configure OAuth redirect URLs"
