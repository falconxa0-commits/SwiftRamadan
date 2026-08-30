#!/bin/bash
set -euo pipefail

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SwiftRamadan — PostgreSQL Migration (schema swap + push)
#
# This script swaps the active Prisma schema from SQLite to the PostgreSQL
# variant (`prisma/schema.postgresql.prisma`), regenerates the Prisma client,
# and pushes the schema to the PostgreSQL database pointed at by
# $DATABASE_URL. The SQLite dev setup is preserved:
#   - `prisma/schema.prisma` is backed up to `prisma/schema.sqlite.prisma.bak`
#     before being overwritten by the PostgreSQL variant.
#   - The SQLite database file itself (`db/custom.db`) is also backed up.
#   - To roll back: `cp prisma/schema.sqlite.prisma.bak prisma/schema.prisma`
#     and re-run `bun run db:generate`.
#
# For row-level data migration from SQLite to PostgreSQL, see the sibling
# script `scripts/migrate-sqlite-to-pg.sh` + `scripts/import-migration-data.ts`.
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "📋 SwiftRamadan PostgreSQL Migration"
echo ""

# Check DATABASE_URL is set and is postgresql
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL not set"
  echo "   Set it to: postgresql://user:pass@host:5432/swiftramadan"
  exit 1
fi

if [[ "$DATABASE_URL" != postgresql://* ]]; then
  echo "❌ DATABASE_URL must be a postgresql:// URL"
  echo "   Current: $DATABASE_URL"
  exit 1
fi

echo "✅ DATABASE_URL is PostgreSQL"
echo ""

# Backup SQLite data
if [[ -f db/custom.db ]]; then
  echo "📋 Backing up SQLite data..."
  cp db/custom.db "db/custom.db.backup-$(date +%Y%m%d-%H%M%S)"
  echo "✅ Backed up"
fi

# Switch schema to PostgreSQL
echo "📋 Switching to PostgreSQL schema..."
cp prisma/schema.prisma prisma/schema.sqlite.prisma.bak
cp prisma/schema.postgresql.prisma prisma/schema.prisma

# Generate Prisma client
echo "📋 Generating Prisma client..."
npx prisma generate

# Push schema to PostgreSQL
echo "📋 Pushing schema to PostgreSQL..."
npx prisma db push

echo ""
echo "✅ Migration complete!"
echo "   To rollback: cp prisma/schema.sqlite.prisma.bak prisma/schema.prisma"
