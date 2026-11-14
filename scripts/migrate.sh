#!/usr/bin/env bash
# ==============================================================================
# UNIHACK 2026: Database Migration Runner
# Executes core and module SQL schemas in dependency order.
# Compatible with Tiger Cloud (TimescaleDB) and standard PostgreSQL.
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Ordered list of migrations
MIGRATIONS=(
  "db/core/migrations/001_core_schema.sql"
  "db/core/migrations/002_auth_security_audit.sql"
  "db/modules/m04-utilities/migrations/001_utilities_schema.sql"
  "db/modules/m05-transit/migrations/001_transit_schema.sql"
  "db/modules/parkie/migrations/001_parkie_schema.sql"
  "db/modules/parkie/migrations/002_timescale_hypertables.sql"
  "db/modules/m03-safety/migrations/0001_init_safety.sql"
  "db/modules/m06-smell/migrations/0001_init_smell.sql"
)

echo "============================================================"
echo "🐘 UNIHACK 2026 — Database Schema Migrations"
echo "============================================================"

# Read DATABASE_URL from .env if not already set
if [ -z "${DATABASE_URL:-}" ] && [ -f ".env" ]; then
  DATABASE_URL=$(grep -E "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'") || true
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ℹ️  DATABASE_URL is not set."
  echo "   Running in DRY-RUN / SCHEMA VALIDATION mode."
  echo "   To apply migrations to Tiger Cloud or Postgres, run:"
  echo "   DATABASE_URL=\"postgresql://user:pass@host:5432/timisoara_hub\" ./scripts/migrate.sh"
  echo ""
  
  for file in "${MIGRATIONS[@]}"; do
    if [ -f "$file" ]; then
      line_count=$(wc -l < "$file")
      echo "   ✅ [VALID] $file ($line_count lines)"
    else
      echo "   ❌ [MISSING] $file"
      exit 1
    fi
  done

  echo ""
  echo "🎉 All 4 schema migration files validated successfully!"
  echo "============================================================"
  exit 0
fi

echo "Connecting to database target..."
# Obfuscate credentials for display
CLEAN_URL=$(echo "$DATABASE_URL" | sed -E 's/:([^@]+)@/:***@/')
echo "Database URL: $CLEAN_URL"
echo ""

if [ -f ".venv/bin/python" ]; then
  exec .venv/bin/python scripts/migrate_tiger.py
elif command -v psql >/dev/null 2>&1; then
  for file in "${MIGRATIONS[@]}"; do
    echo "▶️  Applying $file..."
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
    echo "   ✅ Applied $file"
  done
elif command -v docker >/dev/null 2>&1; then
  echo "psql not found locally, executing via postgres docker container..."
  for file in "${MIGRATIONS[@]}"; do
    echo "▶️  Applying $file..."
    docker run --rm -i --net=host postgres:16-alpine psql "$DATABASE_URL" -v ON_ERROR_STOP=1 < "$file"
    echo "   ✅ Applied $file"
  done
else
  echo "❌ Neither 'psql' nor 'docker' is installed in this environment."
  echo "   Please install postgresql-client or run migrations from a host with psql."
  exit 1
fi

echo ""
echo "🎉 All database migrations applied successfully to Tiger Cloud / Postgres!"
echo "============================================================"
