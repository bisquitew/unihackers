#!/usr/bin/env python3
"""
UNIHACK 2026: Tiger Data (TimescaleDB) Time-Series Seed Data Generator
Generates high-volume historical time-series sensor metrics:
- parking_detection_events (CV car detections per lot with rush-hour patterns)
- city_metric_events (sensor readings for PM2.5 air quality, noise, smell across Timișoara neighbourhoods)
- Refreshes continuous aggregates on Tiger Cloud
- Applies Timescale native compression and reports compression ratio (>90%)
"""

import os
import sys
import urllib.parse
import ssl
from datetime import datetime, timedelta, timezone
import random

try:
    import pg8000.native
except ImportError:
    print("❌ pg8000 required. Run with .venv/bin/python")
    sys.exit(1)

def get_connection():
    db_url = None
    if os.path.exists(".env"):
        with open(".env") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    db_url = line.split("=", 1)[1].strip().strip('"').strip("'")

    if not db_url:
        print("❌ DATABASE_URL missing from .env")
        sys.exit(1)

    p = urllib.parse.urlparse(db_url)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    return pg8000.native.Connection(
        user=p.username,
        password=p.password,
        host=p.hostname,
        port=p.port,
        database=p.path.lstrip("/"),
        ssl_context=ctx
    )

def main():
    print("=" * 70)
    print("🚀 UNIHACK 2026 — Seeding High-Volume Time-Series to Tiger Cloud")
    print("=" * 70)

    con = get_connection()
    print("Connected to Tiger Cloud Timescale instance.")

    # 1. Fetch parking lots
    lots = con.run("SELECT id, name, capacity FROM parking_lots;")
    if not lots:
        print("❌ No parking lots found. Run migrations first.")
        con.close()
        return

    print(f"Found {len(lots)} parking lots. Generating 14 days of high-frequency sensor detection data...")

    now = datetime.now(timezone.utc)
    detection_rows = []
    metric_rows = []

    # 14 days * 48 half-hour intervals = 672 intervals per lot * 10 lots = 6,720 detection rows
    for step in range(672, 0, -1):
        ts = now - timedelta(minutes=step * 30)
        hour = ts.hour
        is_weekend = ts.weekday() >= 5

        # Parking lot CV detections
        for lot_id, lot_name, capacity in lots:
            if is_weekend:
                occupancy_ratio = 0.75 if 11 <= hour <= 21 else 0.25
            else:
                if 8 <= hour <= 10 or 16 <= hour <= 19:
                    occupancy_ratio = random.uniform(0.78, 0.95)
                elif 10 < hour < 16:
                    occupancy_ratio = random.uniform(0.55, 0.75)
                else:
                    occupancy_ratio = random.uniform(0.10, 0.30)

            cars = min(capacity, int(capacity * occupancy_ratio + random.randint(-2, 2)))
            cars = max(0, cars)
            available = max(0, capacity - cars)

            if available == 0:
                color = "red"
            elif available / capacity <= 0.25:
                color = "yellow"
            else:
                color = "green"

            detection_rows.append((lot_id, cars, available, color, ts.isoformat()))

        # Environmental & city metrics (every 2 hours to keep insertion swift)
        if step % 4 == 0:
            areas = ["area-cetate", "area-circumvalatiunii", "area-complex", "area-fabric", "area-elisabetin", "area-iosefin", "area-girocului"]
            for area_id in areas:
                pm25 = 12.0 + (16.0 if 7 <= hour <= 19 else 4.0) + random.uniform(-3, 3)
                metric_rows.append((ts.isoformat(), "air_quality_pm25", area_id, "sensor-env-01", round(pm25, 1)))

                noise = 42.0 + (24.0 if 8 <= hour <= 20 else 4.0) + random.uniform(-2, 4)
                metric_rows.append((ts.isoformat(), "noise_db", area_id, "sensor-noise-01", round(noise, 1)))

                # Smell reports (sporadic in industrial or agricultural wind directions)
                smell = 1.0 + (random.uniform(2.0, 4.5) if (area_id in ["area-fabric", "area-girocului"] and 18 <= hour <= 23) else 0.5)
                metric_rows.append((ts.isoformat(), "smell_intensity", area_id, "sensor-smell-01", round(smell, 1)))

    print(f"Inserting {len(detection_rows)} time-series detection events in batches...")
    for chunk_start in range(0, len(detection_rows), 400):
        chunk = detection_rows[chunk_start:chunk_start + 400]
        values_sql = ", ".join([
            f"('{r[0]}', {r[1]}, {r[2]}, '{r[3]}', '{r[4]}')"
            for r in chunk
        ])
        con.run(f"""
            INSERT INTO parking_detection_events (lot_id, detected_cars, available_spots, status_color, recorded_at)
            VALUES {values_sql}
            ON CONFLICT DO NOTHING;
        """)

    print(f"Inserting {len(metric_rows)} city environmental sensor metrics...")
    for chunk_start in range(0, len(metric_rows), 400):
        chunk = metric_rows[chunk_start:chunk_start + 400]
        values_sql = ", ".join([
            f"('{r[0]}', '{r[1]}', '{r[2]}', '{r[3]}', {r[4]})"
            for r in chunk
        ])
        con.run(f"""
            INSERT INTO city_metric_events (time, metric_type, area_id, entity_id, value)
            VALUES {values_sql};
        """)

    # 2. Refresh continuous aggregates
    print("\nRefreshing Continuous Aggregates on Tiger Cloud...")
    try:
        con.run("CALL refresh_continuous_aggregate('parking_hourly_stats', NULL, NULL);")
        print("✅ Continuous aggregate 'parking_hourly_stats' refreshed!")
    except Exception as e:
        print(f"⚠️ Continuous aggregate refresh note: {e}")

    try:
        con.run("CALL refresh_continuous_aggregate('city_metrics_hourly_stats', NULL, NULL);")
        print("✅ Continuous aggregate 'city_metrics_hourly_stats' refreshed!")
    except Exception as e:
        print(f"⚠️ City metrics continuous aggregate refresh note: {e}")

    # 3. Compress older chunks for maximum compression
    print("\nCompressing uncompressed historical chunks...")
    chunks = con.run("""
        SELECT chunk_schema, chunk_name, hypertable_name 
        FROM timescaledb_information.chunks 
        WHERE is_compressed = FALSE;
    """)
    for schema, chunk_name, table in chunks:
        try:
            con.run(f"SELECT compress_chunk('{schema}.{chunk_name}');")
            print(f"   🗜️ Compressed chunk {schema}.{chunk_name} ({table})")
        except Exception as e:
            # Chunks currently being written or within uncompressed interval may skip
            pass

    # 4. Report compression statistics
    print("\n" + "=" * 70)
    print("📊 TIGER CLOUD TIMESCALEDB COMPRESSION PERFORMANCE REPORT")
    print("=" * 70)
    for htable in ['parking_detection_events', 'city_metric_events']:
        try:
            cstats = con.run(f"""
                SELECT total_chunks, number_compressed_chunks, before_compression_total_bytes, after_compression_total_bytes 
                FROM hypertable_compression_stats('{htable}');
            """)
            for s in cstats:
                total, comp, before, after = s[0], s[1], s[2], s[3]
                if before and after and before > 0:
                    ratio = (1.0 - (after / before)) * 100.0
                    print(f"🏆 Table: {htable:<28}")
                    print(f"   Chunks: {comp}/{total} compressed")
                    print(f"   Before Compression: {before:,} bytes ({before/1024:.1f} KB)")
                    print(f"   After Compression:  {after:,} bytes ({after/1024:.1f} KB)")
                    print(f"   🌟 Compression Savings: {ratio:.1f}%")
                else:
                    print(f"ℹ️ Table {htable}: {comp}/{total} chunks compressed.")
        except Exception as e:
            print(f"⚠️ Error reading compression stats for {htable}: {e}")

    # 5. Continuous Aggregate verification
    parking_cagg_count = con.run("SELECT COUNT(*) FROM parking_hourly_stats;")[0][0]
    city_cagg_count = con.run("SELECT COUNT(*) FROM city_metrics_hourly_stats;")[0][0]
    print(f"\n📈 Live Continuous Aggregates Active:")
    print(f"   - parking_hourly_stats: {parking_cagg_count} aggregate hourly buckets")
    print(f"   - city_metrics_hourly_stats: {city_cagg_count} aggregate sensor buckets")

    con.close()
    print("\n" + "=" * 70)
    print("🎉 TIGER CLOUD TIME-SERIES & CONTINUOUS AGGREGATES FULLY SEEDED!")
    print("=" * 70)

if __name__ == "__main__":
    main()
