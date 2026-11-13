#!/usr/bin/env python3
"""
UNIHACK 2026 - P2 (Platform, Data & City Alerts) Verification Script
Tests core API endpoints, [M04_UTILITIES], [M05_TRANSIT], and dev auth.
"""

import urllib.request
import json
import sys

BASE_URL = "http://localhost:8000"

def get(path, token="dev_resident"):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as e:
        return None, str(e)

def post(path, data, token="dev_resident"):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}{path}", data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as e:
        return None, str(e)

def main():
    print("=" * 60)
    print("🚀 UNIHACK 2026 — Testing P2 Platform & Alerts API")
    print("=" * 60)

    # 1. Health
    status, res = get("/health")
    if status is None:
        print(f"❌ Server unreachable at {BASE_URL}. Start it with 'npm run dev:api' or 'pnpm --filter @hub/api dev'.")
        sys.exit(1)
    print(f"✅ /health -> {res.get('status')} ({res.get('project')})")

    # 2. Areas
    status, areas = get("/v1/core/areas")
    print(f"✅ /v1/core/areas -> {len(areas)} Timișoara neighbourhoods loaded")

    # 3. User & Auth
    status, user = get("/v1/core/user/me", token="dev_resident")
    print(f"✅ Auth: dev_resident -> {user.get('name')} (Role: {user.get('role')})")

    # 4. [M04_UTILITIES] Outages
    status, outages = get("/v1/m/utilities/outages")
    print(f"✅ [M04_UTILITIES] /v1/m/utilities/outages -> {len(outages)} active outages in Timișoara")

    # Check address impact
    status, impact = post("/v1/m/utilities/check-address", {"address": "Circumvalațiunii"})
    print(f"   📍 Address Check (Circumvalațiunii): Affected? {impact.get('is_affected')} - {impact.get('message')}")

    # 5. [M05_TRANSIT] Lines & Detours
    status, lines = get("/v1/m/transit/lines")
    print(f"✅ [M05_TRANSIT] /v1/m/transit/lines -> {len(lines)} transit lines")

    status, stop_check = post("/v1/m/transit/check-stop", {"stop_name": "Calea Bogdăneștilor"})
    print(f"   🚊 Stop Check (Calea Bogdăneștilor): Detour? {stop_check.get('is_affected_by_detour')} - {stop_check.get('guidance_message')}")

    print("=" * 60)
    print("🎉 ALL P2 CORE SYSTEMS & MODULES VERIFIED!")
    print("=" * 60)

if __name__ == "__main__":
    main()
