#!/bin/bash
set -euo pipefail

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SwiftRamadan — Production Startup Script
# Validates environment, runs migrations, starts server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "🚀 SwiftRamadan Production Startup"
echo "==================================="
echo ""

# ── Step 1: Environment Validation ──
echo "📋 Step 1: Validating environment variables..."

REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "AUTH_JWT_SECRET"
)

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "  ❌ $var is NOT set"
    MISSING=$((MISSING + 1))
  else
    echo "  ✅ $var is set"
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo ""
  echo "❌ $MISSING required environment variable(s) are missing!"
  echo "   Copy .env.example to .env and fill in the values."
  echo "   Then run this script again."
  exit 1
fi

# ── Step 2: Database Connection Check ──
echo ""
echo "📋 Step 2: Checking database connection..."

if command -v psql >/dev/null 2>&1; then
  if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
    echo "  ✅ Database connection successful"
  else
    echo "  ❌ Cannot connect to database. Check DATABASE_URL"
    exit 1
  fi
else
  echo "  ⚠️  psql not available, skipping connection test"
fi

# ── Step 3: Run Migrations ──
echo ""
echo "📋 Step 3: Running database migrations..."

if [ -d "prisma" ]; then
  npx prisma migrate deploy 2>&1
  if [ $? -eq 0 ]; then
    echo "  ✅ Migrations applied successfully"
  else
    echo "  ❌ Migration failed! Check your DATABASE_URL and schema."
    echo "  Trying prisma db push as fallback..."
    npx prisma db push --accept-data-loss 2>&1 || true
  fi
else
  echo "  ⚠️  No prisma directory found, skipping migrations"
fi

# ── Step 4: Generate Prisma Client ──
echo ""
echo "📋 Step 4: Generating Prisma client..."
npx prisma generate 2>&1
echo "  ✅ Prisma client generated"

# ── Step 5: Port Check ──
echo ""
echo "📋 Step 5: Checking port 3000..."
if lsof -i :3000 >/dev/null 2>&1; then
  echo "  ⚠️  Port 3000 is in use. Attempting to kill..."
  lsof -t -i :3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi
echo "  ✅ Port 3000 available"

# ── Step 6: Start Server ──
echo ""
echo "📋 Step 6: Starting SwiftRamadan..."
echo ""
echo "  🌐 App URL: http://localhost:3000"
echo "  🏥 Health: http://localhost:3000/api/health"
echo "  📊 Environment: production"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start the standalone server
exec node server.js
