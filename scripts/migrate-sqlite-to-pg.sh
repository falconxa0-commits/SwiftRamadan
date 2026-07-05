#!/bin/bash
set -euo pipefail

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SwiftRamadan — SQLite to PostgreSQL Data Migration
# Moves data from dev SQLite to production PostgreSQL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SQLITE_DB="${1:-db/custom.db}"
PG_URL="${2:-$DATABASE_URL}"

if [ -z "$PG_URL" ]; then
  echo "❌ DATABASE_URL not set. Usage: ./migrate-sqlite-to-pg.sh [sqlite_path] [pg_url]"
  exit 1
fi

echo "📦 SwiftRamadan Data Migration"
echo "   Source: SQLite ($SQLITE_DB)"
echo "   Target: PostgreSQL ($PG_URL)"
echo ""

# Check if sqlite3 is available
if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "❌ sqlite3 CLI not found. Install it first."
  exit 1
fi

if [ ! -f "$SQLITE_DB" ]; then
  echo "❌ SQLite database not found at $SQLITE_DB"
  exit 1
fi

# ── Export data from SQLite as JSON ──
echo "📋 Exporting data from SQLite..."

TABLES=("User" "Product" "Order" "CartItem" "Notification" "PantryItem" "CookingSession" "CommunityPost" "CommunityComment" "Video" "VideoComment" "WishlistItem" "Address" "Review" "Coupon" "Payment" "Follow" "SavedVideo" "ChatMessage" "UserSetting")

EXPORT_DIR="/tmp/swiftramadan-migration"
mkdir -p "$EXPORT_DIR"

for table in "${TABLES[@]}"; do
  COUNT=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null || echo "0")
  if [ "$COUNT" -gt 0 ]; then
    echo "  📤 $table: $COUNT rows"
    sqlite3 "$SQLITE_DB" -json "SELECT * FROM \"$table\";" > "$EXPORT_DIR/${table}.json" 2>/dev/null || true
  else
    echo "  ⏭️  $table: empty (skipping)"
  fi
done

echo ""
echo "✅ Export complete. Data saved to $EXPORT_DIR/"
echo ""
echo "⚠️  Next steps:"
echo "  1. Ensure PostgreSQL schema is created: npx prisma migrate deploy"
echo "  2. Import data using the Node.js migration script:"
echo "     bun run scripts/import-migration-data.ts"
echo ""
echo "💡 For small datasets, you can also use Prisma Studio to manually import."
