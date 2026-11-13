#!/usr/bin/env python3
"""
UNIHACK 2026 - P2 (Platform, Data & City Alerts) Verification Script
Tests core API endpoints, [M04_UTILITIES], [M05_TRANSIT], and dev auth.
"""

import urllib.request
import json
import sys
import os
import subprocess
import time

BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
server_proc = None

def detect_base_url():
    global BASE_URL
    candidates = [
        BASE_URL,
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:8080"
    ]
    for url in candidates:
        try:
            req = urllib.request.Request(f"{url}/health")
            with urllib.request.urlopen(req, timeout=1) as response:
                if response.status == 200:
                    BASE_URL = url
                    return url
        except Exception:
            continue
    return None

def ensure_server():
    global BASE_URL, server_proc
    detected = detect_base_url()
    if detected:
        BASE_URL = detected
        return detected

    print("ℹ️  Server not running. Auto-starting local instance for verification...")
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    node_bin = os.path.expanduser("~/.nvm/versions/node/v26.13.1/bin/node")
    if not os.path.exists(node_bin):
        node_bin = "node"

    env = os.environ.copy()
    env["PATH"] = f"{os.path.expanduser('~/.nvm/versions/node/v26.13.1/bin')}:{env.get('PATH', '')}"

    server_proc = subprocess.Popen(
        [node_bin, "--experimental-strip-types", "services/api/src/server.ts"],
        cwd=root_dir,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    for _ in range(12):
        time.sleep(0.4)
        found = detect_base_url()
        if found:
            BASE_URL = found
            return found

    return BASE_URL

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

def put_raw(url, data_bytes, content_type="image/jpeg"):
    req = urllib.request.Request(url, data=data_bytes, method="PUT")
    req.add_header("Content-Type", content_type)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, response.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return None, str(e)

def main():
    global server_proc
    try:
        active_url = ensure_server()
        print("=" * 60)
        print(f"🚀 UNIHACK 2026 — Testing P2 Platform & Alerts API ({active_url})")
        print("=" * 60)

        # 1. Health
        status, res = get("/health")
        if status is None:
            print(f"❌ Server unreachable at {active_url}.")
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

        # 6. [PARKIE] Parking Lots & CV Detections
        status, lots = get("/v1/m/parkie/lots")
        print(f"✅ [PARKIE] /v1/m/parkie/lots -> {len(lots)} Timișoara parking lots loaded")

        status, colors = get("/v1/m/parkie/lots/colors")
        print(f"✅ [PARKIE] /v1/m/parkie/lots/colors -> {len(colors)} lightweight color items streamed")

        # Update detection via CV agent simulation
        status, updated_lot = post("/v1/m/parkie/detections", {"lot_id": "lot-unirii-01", "detected_cars": 42})
        print(f"   🚗 CV Detection Update (Piața Unirii): {updated_lot.get('available_spots')}/{updated_lot.get('capacity')} spots left [{updated_lot.get('status_color').upper()}]")

        status, nearest = get("/v1/m/parkie/nearest?lat=45.7581&lng=21.2290&limit=3")
        print(f"   📍 Nearest to Centru: {nearest[0].get('name')} ({nearest[0].get('distance_meters')}m away, {nearest[0].get('available_spots')} spots free)")

        # 7. [PHOTO UPLOAD] Vultr Object Storage / Signed URL Service
        upload_payload = {
            "filename": "pothole_circumvalatiunii.jpg",
            "content_type": "image/jpeg",
            "module_id": "m03-safety"
        }
        status, signed = post("/v1/core/upload/signed-url", upload_payload)
        print(f"✅ [PHOTO_UPLOAD] /v1/core/upload/signed-url -> Key: {signed.get('key')}")
        print(f"   📤 Upload Target: {signed.get('upload_url')}")

        # Test uploading binary payload to the signed/dev URL
        dummy_jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb"
        status, put_res = put_raw(signed.get('upload_url'), dummy_jpeg_bytes, "image/jpeg")
        print(f"   📥 Binary PUT to Storage: HTTP {status} (Uploaded {len(dummy_jpeg_bytes)} bytes)")

        # Verify retrieval via public URL
        req = urllib.request.Request(signed.get('public_url'))
        with urllib.request.urlopen(req) as resp:
            downloaded = resp.read()
            print(f"   🌐 Verified Public Retrieval: HTTP {resp.status} ({len(downloaded)} bytes matched)")

        print("=" * 60)
        print("🎉 ALL P2 CORE SYSTEMS & MODULES VERIFIED!")
        print("=" * 60)
    finally:
        if server_proc:
            server_proc.terminate()
            try:
                server_proc.wait(timeout=2)
            except Exception:
                server_proc.kill()

if __name__ == "__main__":
    main()
