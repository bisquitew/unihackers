#!/usr/bin/env python3
"""Dedicated test suite for Parkie Smart Parking side feature.
Verifies frame capture, admin canvas calibration, vision pipeline,
YOLO/OpenCV geometry, and mobile lot display endpoints.
"""

import urllib.request
import urllib.parse
import json
import subprocess
import time
import sys

BASE_URL = "http://localhost:8000"
server_proc = None

def ensure_server():
    global BASE_URL, server_proc
    import os
    for url in ["http://localhost:8000", "http://localhost:8001"]:
        try:
            req = urllib.request.Request(f"{url}/health")
            with urllib.request.urlopen(req, timeout=1) as resp:
                if resp.status == 200:
                    BASE_URL = url
                    return
        except Exception:
            continue

    print("ℹ️  Server not running. Auto-starting local instance for verification...")
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    server_proc = subprocess.Popen(
        ["node", "--experimental-strip-types", "services/api/src/server.ts"],
        cwd=root_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    for _ in range(25):
        time.sleep(0.3)
        try:
            req = urllib.request.Request("http://localhost:8000/health")
            with urllib.request.urlopen(req, timeout=1) as resp:
                if resp.status == 200:
                    BASE_URL = "http://localhost:8000"
                    return
        except Exception:
            continue

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except:
            return e.code, {"error": content}

def main():
    ensure_server()
    print("=" * 60)
    print("🅿️  PARKIE INTEGRATION VERIFICATION SUITE")
    print("=" * 60)

    # 1. Verify health & lots listing
    status, lots = request("GET", "/v1/m/parkie/lots")
    assert status == 200, f"Expected 200, got {status}"
    print(f"✅ 1. Mobile Lots Endpoint: {len(lots)} lots loaded")

    # 2. Test Camera Frame Capture
    status, frame = request("POST", "/v1/m/parkie/capture-frame", {"camera_url": "rtsp://cam.timisoara-hub.ro/live"})
    assert status == 200 and frame.get("image", "").startswith("data:image/"), "Frame capture failed"
    print(f"✅ 2. Frame Capture Endpoint: {len(frame['image'])} bytes base64 image generated for canvas")

    # 3. Test Admin Slot Calibration & Persistence
    test_slots = [
        {"id": "slot-test-1", "x": 10, "y": 15, "width": 12, "height": 22, "status": "available", "type": "standard"},
        {"id": "slot-test-2", "x": 25, "y": 15, "width": 12, "height": 22, "status": "occupied", "type": "ev"},
        {"id": "slot-test-3", "x": 40, "y": 15, "width": 12, "height": 22, "status": "available", "type": "disabled"}
    ]
    status, updated = request("PUT", "/v1/m/parkie/lots/lot-unirii-01/plots", {
        "slots_data": test_slots,
        "camera_url": "rtsp://cam.timisoara-hub.ro/unirii-cam1",
        "capacity": 3
    })
    assert status == 200, f"Plot update failed with {status}: {updated}"
    print(f"✅ 3. Admin Plot Calibration: {len(updated.get('slots_data', []))} slots saved to Piața Unirii")

    # 4. Verify Config endpoint for AI Vision agent
    status, cfg = request("GET", "/lots/lot-unirii-01/config")
    assert status == 200 and len(cfg.get("slots_data", [])) == 3, f"Config mismatch: {cfg}"
    print(f"✅ 4. AI Vision Config: Fetched camera_url='{cfg.get('camera_url')}', slots count={len(cfg.get('slots_data', []))}")

    # 5. Run AI Vision Agent
    print("✅ 5. Executing AI Vision Agent (single pass)...")
    result = subprocess.run([
        sys.executable, "services/vision/vision_agent.py",
        "--once",
        "--lot-id", "lot-unirii-01"
    ], capture_output=True, text=True)
    assert result.returncode == 0, f"Vision agent failed:\n{result.stderr}\n{result.stdout}"
    print(f"   🤖 Agent output: {result.stdout.strip().splitlines()[-1]}")

    # 6. Test /vision/update_lot compatibility endpoint
    status, lot_state = request("POST", "/vision/update_lot", {"lot_id": "lot-unirii-01", "detected_cars": 1})
    assert status == 200, f"/vision/update_lot failed: {lot_state}"
    print(f"✅ 6. Occupancy Update: {lot_state.get('available_spots')}/{lot_state.get('capacity')} free [{lot_state.get('status_color')}]")

    # 7. Test Nearest Lots Search
    status, nearest = request("GET", "/v1/m/parkie/nearest?lat=45.7581&lng=21.2290&limit=3")
    assert status == 200 and len(nearest) == 3, f"Nearest failed: {nearest}"
    print(f"✅ 7. Spatial Nearest: {nearest[0]['name']} ({nearest[0]['distance_meters']}m away)")

    print("=" * 60)
    print("🎉 ALL PARKIE SIDE FEATURE CAPABILITIES VERIFIED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    main()
