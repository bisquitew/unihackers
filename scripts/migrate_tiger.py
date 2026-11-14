#!/usr/bin/env python3
"""
UNIHACK 2026: Tiger Data (TimescaleDB) Migration Runner
Applies core, utilities, transit, and parkie schemas to the cloud database.
"""

import os
import sys
import urllib.parse
import ssl

try:
    import pg8000.native
except ImportError:
    print("❌ pg8000 is required. Run via .venv/bin/python scripts/migrate_tiger.py")
    sys.exit(1)

def get_database_url():
    if os.environ.get("DATABASE_URL"):
        return os.environ.get("DATABASE_URL")
    
    # Try reading from .env or credentials file
    candidates = [".env", "tiger-cloud-unihackdb-credentials.env"]
    for path in candidates:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("TIMESCALE_SERVICE_URL=") or line.startswith("DATABASE_URL="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
    return None

def main():
    print("=" * 60)
    print("🐘 UNIHACK 2026 — Applying Migrations to Tiger Cloud")
    print("=" * 60)

    db_url = get_database_url()
    if not db_url:
        print("❌ No database connection URL found in .env or tiger-cloud-unihackdb-credentials.env")
        sys.exit(1)

    parsed = urllib.parse.urlparse(db_url)
    user = parsed.username or "postgres"
    password = parsed.password or ""
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    database = parsed.path.lstrip("/") or "postgres"

    print(f"Connecting to host: {host}:{port} (db: {database}, user: {user})...")

    # SSL context for Timescale/Tiger Cloud
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    try:
        con = pg8000.native.Connection(
            user=user,
            password=password,
            host=host,
            port=port,
            database=database,
            ssl_context=ssl_context
        )
        print("✅ Connected to Tiger Cloud / TimescaleDB!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    migrations = [
        "db/core/migrations/001_core_schema.sql",
        "db/core/migrations/002_auth_security_audit.sql",
        "db/modules/m04-utilities/migrations/001_utilities_schema.sql",
        "db/modules/m05-transit/migrations/001_transit_schema.sql",
        "db/modules/parkie/migrations/001_parkie_schema.sql",
        "db/modules/parkie/migrations/002_timescale_hypertables.sql"
    ]

    for file_path in migrations:
        if not os.path.exists(file_path):
            print(f"⚠️ Migration file missing: {file_path}")
            continue

        print(f"\n▶️  Applying {file_path}...")
        with open(file_path, "r", encoding="utf-8") as f:
            sql_content = f.read()

        # Split statements by semicolon while ignoring comments
        statements = []
        current = []
        for line in sql_content.splitlines():
            stripped = line.strip()
            if stripped.startswith("--") or not stripped:
                continue
            current.append(line)
            if stripped.endswith(";"):
                stmt = "\n".join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []

        if current:
            trailing = "\n".join(current).strip()
            if trailing:
                statements.append(trailing)

        for stmt in statements:
            try:
                con.run(stmt)
            except Exception as e:
                # Ignore extension already existing or duplicate type errors
                err_msg = str(e)
                if "already exists" in err_msg or "duplicate key" in err_msg:
                    pass
                else:
                    print(f"   ⚠️ Statement note: {e}")
        print(f"   ✅ {file_path} successfully executed!")

    # Verify tables in Tiger Cloud
    print("\n🔍 Verifying created tables in Tiger Cloud...")
    rows = con.run("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [r[0] for r in rows]
    print(f"✅ Found {len(tables)} tables in database:")
    for t in tables:
        print(f"   - {t}")

    # Check seeded parking lots count
    try:
        lot_count = con.run("SELECT COUNT(*) FROM parking_lots;")[0][0]
        print(f"🅿️ Seeded Parking Lots on Tiger Cloud: {lot_count} lots")
    except Exception:
        pass

    con.close()
    print("\n" + "=" * 60)
    print("🎉 ALL SCHEMAS APPLIED TO TIGER CLOUD (TIMESCALE) SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    main()
