#!/bin/bash
set -euo pipefail

# SwiftRamadan PostgreSQL Backup Script
# Usage: ./scripts/backup-postgres.sh

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/swiftramadan-${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

echo "📋 Backing up PostgreSQL database..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
echo "✅ Backup saved: $BACKUP_FILE"

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/swiftramadan-*.sql | tail -n +8 | xargs rm -f 2>/dev/null || true
echo "✅ Old backups cleaned (keeping last 7)"
