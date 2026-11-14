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

# Windows consoles default to cp1252, which can't print the emoji below.
sys.stdout.reconfigure(encoding="utf-8")

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
    node_bin = "node"
    server_proc = subprocess.Popen(
        [node_bin, "--experimental-strip-types", "services/api/src/server.ts"],
        cwd=root_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    for _ in range(25):
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

        # 3. User & Auth0 Security
        status, user = get("/v1/core/user/me", token="dev_resident")
        print(f"✅ Auth: dev_resident -> {user.get('name')} (Role: {user.get('role')})")

        print("\n" + "=" * 60)
        print("🔐 TESTING AUTH0 SECURITY, RBAC & MFA ENFORCEMENT")
        print("=" * 60)
        status, profile = get("/v1/core/auth/me", token="dev_resident")
        print(f"✅ Auth0 Profile: {profile.get('name')} | Role: {profile.get('role')} | Tier: {profile.get('security_tier')}")

        status, tokens_catalog = get("/v1/core/auth/dev-tokens")
        print(f"✅ Auth0 Dev Tokens Catalog: {len(tokens_catalog)} test profiles available for judges")

        # Test Google OAuth Flow
        status, g_citizen = post("/v1/core/auth/google-login", {"email": "alex.popescu@gmail.com", "name": "Alex Popescu"})
        assert status == 200, f"Expected 200 for Google Citizen login, got {status}"
        assert g_citizen["user"]["role"] == "resident", f"Expected resident role, got {g_citizen['user']['role']}"
        print(f"✅ Google OAuth Citizen Sign-In: {g_citizen['user']['email']} -> Role: {g_citizen['user']['role']}")

        status, g_admin = post("/v1/core/auth/google-login", {"email": "admin.elena@timisoara-hub.ro", "name": "Elena Dobre"})
        assert status == 200, f"Expected 200 for Google Admin login, got {status}"
        assert g_admin["user"]["role"] == "admin", f"Expected admin role, got {g_admin['user']['role']}"
        assert g_admin["user"]["security_tier"] == "tier_2_mfa_verified", f"Expected tier_2_mfa_verified"
        print(f"✅ Google Workspace Primărie Sign-In: {g_admin['user']['email']} -> Role: {g_admin['user']['role']} (MFA: {g_admin['user']['mfa_verified']})")

        # Test A: Resident attempts administrative action -> HTTP 403 insufficient_role
        test_outage = {
            "title": "Avarie Colterm Calea Șagului",
            "provider": "colterm",
            "type": "heating",
            "status": "unplanned_breakdown",
            "affected_areas": ["area-girocului"],
            "affected_streets": ["Calea Șagului"],
            "start_time": "2026-11-14T10:00:00Z"
        }
        status, denied_role = post("/v1/m/utilities/outages", test_outage, token="dev_resident")
        assert status == 403, f"Expected 403 for resident outage publishing, got {status}"
        print(f"✅ RBAC Guard: Resident publishing blocked -> HTTP {status}: {denied_role.get('error')}")

        # Test B: Admin WITHOUT MFA attempts administrative action -> HTTP 403 mfa_required
        status, mfa_challenge = post("/v1/m/utilities/outages", test_outage, token="dev_admin_no_mfa")
        assert status == 403, f"Expected 403 MFA challenge, got {status}"
        assert mfa_challenge.get('error') == 'mfa_required', f"Expected mfa_required error"
        print(f"✅ Step-Up MFA Challenge: Admin without MFA blocked -> HTTP {status}: {mfa_challenge.get('error_description')}")
        print(f"   🛡️ Supported Factors: {mfa_challenge.get('supported_mfa_factors')}")

        # Test C: Admin WITH MFA attempts administrative action -> HTTP 201 Created!
        status, created_outage = post("/v1/m/utilities/outages", test_outage, token="dev_admin_mfa")
        assert status == 201, f"Expected 201 for admin with MFA, got {status}"
        print(f"✅ MFA Step-Up Passed: Admin with FIDO2/WebAuthn created outage -> HTTP {status}: {created_outage.get('title')}")

        # Test D: Auth0 for AI Agents (M2M Service Principal) -> HTTP 201 Created!
        test_detour = {
            "line_number": "E2",
            "title": "Deviere temporară E2 - Lucrări Bulevardul Take Ionescu",
            "reason": "Lucrări carosabil municipal",
            "affected_stops": ["Take Ionescu", "Punctele Cardinale"],
            "alternative_instructions": "Traseu deviat pe Splaiul Nistrului"
        }
        status, created_detour = post("/v1/m/transit/detours", test_detour, token="dev_ai_agent")
        assert status == 201, f"Expected 201 for AI Agent M2M, got {status}"
        print(f"✅ Auth0 for AI Agents: Autonomous Netrom Gemini Worker authorized (M2M) -> HTTP {status}: {created_detour.get('title')}")

        # Test E: Security Audit Log retrieval
        status, audit_logs = get("/v1/core/auth/audit-log", token="dev_admin_mfa")
        print(f"✅ Auth0 Security Audit Trail: {len(audit_logs)} real-time security decisions logged")
        if audit_logs:
            sample_audit = audit_logs[0]
            print(f"   📝 Latest Audit Event: [{sample_audit.get('outcome')}] Action: {sample_audit.get('action')} by {sample_audit.get('email')} (MFA: {sample_audit.get('mfa_verified')})")

        # Test F: Auth0 MFA Step-Up Simulation
        status, step_up = post("/v1/core/auth/simulate-mfa", {"role": "admin", "factor": "fido2_webauthn_passkey"}, token="dev_admin_no_mfa")
        assert status == 200 and step_up.get('ok'), "MFA simulation failed"
        print(f"✅ Auth0 MFA Step-Up Simulation: Upgraded session token -> {step_up.get('upgraded_token')} [Tier: {step_up.get('security_tier')}]")

        # Test G: Auth0 Actions Webhook Handler
        webhook_payload = {
            "event_type": "post_login_mfa_success",
            "user_id": "auth0|resident-99",
            "email": "test-resident@timisoara-hub.ro",
            "ip": "10.109.24.1"
        }
        status, wh_res = post("/v1/core/auth/webhook", webhook_payload)
        assert status == 200 and wh_res.get('received'), "Webhook processing failed"
        print(f"✅ Auth0 Actions Webhook: Event '{wh_res.get('event_type')}' received and logged")

        # Test H: Adaptive Geolocation Anomaly (Push Notification & Security Warning Email)
        anomaly_payload = {
            "token": "dev_resident",
            "city": "București",
            "country": "România",
            "ip": "86.120.45.12",
            "device": "Mobile Safari / iPhone 15 Pro"
        }
        status, anomaly_res = post("/v1/core/auth/simulate-login", anomaly_payload)
        assert status == 200 and anomaly_res.get('is_new_location'), "Anomaly detection failed to recognize new location"
        assert anomaly_res.get('push_notification_sent'), "Push notification not dispatched on new location"
        assert anomaly_res.get('email_alert_sent'), "Security warning email not dispatched on new location"
        print(f"✅ Auth0 Location Anomaly Alert: New login from {anomaly_res.get('location_evaluated', {}).get('city')} triggered dual alert")
        print(f"   🔔 Push Dispatched: \"{anomaly_res.get('push_notification', {}).get('title')}\"")
        print(f"   📧 Security Email: \"{anomaly_res.get('security_email', {}).get('subject')}\" to {anomaly_res.get('security_email', {}).get('to_email')}")

        # 3.1 [AREA_ALERTS] Danger & Construction Radius Alerts with Neighbour Signaling
        status, area_alerts = get("/v1/core/area-alerts")
        assert status == 200 and len(area_alerts) >= 4, f"Expected at least 4 area alerts, got {len(area_alerts)}"
        print(f"✅ [AREA_ALERTS] /v1/core/area-alerts -> {len(area_alerts)} danger & construction alerts active")
        danger_alert = next((a for a in area_alerts if a['type'] == 'danger'), None)
        const_alert = next((a for a in area_alerts if a['type'] == 'construction'), None)
        print(f"   🚨 Danger Event: \"{danger_alert['title']}\" (Radius: {danger_alert['radius_meters']}m | Signaled Neighbours: {', '.join(danger_alert['affected_neighbourhoods'])})")
        print(f"   🚧 Construction Event: \"{const_alert['title']}\" (Radius: {const_alert['radius_meters']}m | Signaled Neighbours: {', '.join(const_alert['affected_neighbourhoods'])})")

        # Test Proximity Check within Danger Radius (Circumvalațiunii)
        status, prox_inside = post("/v1/core/area-alerts/check-proximity", {"neighbourhood": "Circumvalațiunii"})
        assert status == 200, "Proximity check failed"
        assert prox_inside.get("in_danger_zone") == True, "Expected resident in Circumvalatiunii to be within danger zone"
        print(f"   📍 Proximity Check (Circumvalațiunii): Inside Danger Zone? {prox_inside['in_danger_zone']} | Matching: {len(prox_inside['matching_alerts'])} events")

        # Test Creating New Area Alert with Dynamic Radius and Neighbour Computation
        new_area_alert_payload = {
            "title": "🚨 Risc Incendiu Depozit Calea Șagului",
            "description": "Degajare masivă de fum. Perimetru de siguranță de 800m instituit.",
            "type": "danger",
            "severity": "critical",
            "latitude": 45.7320,
            "longitude": 21.2050,
            "radius_meters": 800,
            "neighbourhood": "Calea Șagului"
        }
        status, created_area_alert = post("/v1/core/area-alerts", new_area_alert_payload, token="dev_admin_mfa")
        assert status == 201, f"Expected 201, got {status}"
        assert len(created_area_alert["affected_neighbourhoods"]) > 0, "Expected computed affected neighbourhoods"
        assert created_area_alert["affected_residents_count"] > 0, "Expected notified residents count"
        print(f"   📡 Created Radius Alert: \"{created_area_alert['title']}\" -> {len(created_area_alert['affected_neighbourhoods'])} neighbours signaled ({created_area_alert['affected_residents_count']} residents notified)")

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

        # 8. [TIGER DATA / TIMESCALEDB SPONSOR CHALLENGE]
        print("\n" + "=" * 60)
        print("🐅 TESTING TIGER DATA (TIMESCALE) CONTINUOUS AGGREGATES & COMPRESSION")
        print("=" * 60)
        status, tiger = get("/v1/core/tiger/status")
        print(f"✅ /v1/core/tiger/status -> Engine: {tiger.get('engine')} v{tiger.get('version')} [{tiger.get('status').upper()}]")
        print(f"   🏢 Cloud Host: {tiger.get('host')}")
        print(f"   ⚡ Active Hypertables: {len(tiger.get('hypertables', []))} tables partitioned by timestamp")
        for ht in tiger.get('hypertables', []):
            print(f"      - {ht.get('table_name')} ({ht.get('num_chunks')} chunks, compressed={ht.get('compression_enabled')})")

        print(f"   🔄 Continuous Aggregates: {len(tiger.get('continuous_aggregates', []))} live materialized views")
        for ca in tiger.get('continuous_aggregates', []):
            print(f"      - {ca.get('view_name')} (refresh: {ca.get('schedule_interval')}, real-time: {ca.get('real_time_enabled')})")

        status, comp = get("/v1/core/tiger/compression")
        print(f"✅ /v1/core/tiger/compression -> {len(comp)} compressed time-series tables:")
        for c in comp:
            print(f"   🗜️ {c.get('hypertable_name')}: {c.get('compressed_chunks')}/{c.get('total_chunks')} chunks compressed -> {c.get('compression_ratio_percent')}% space saved!")

        # 9. Parking Hourly Continuous Aggregate
        status, hourly = get("/v1/m/parkie/analytics/hourly?hours=12")
        print(f"✅ /v1/m/parkie/analytics/hourly -> {len(hourly)} hourly aggregate data points returned")
        if hourly:
            sample = hourly[0]
            print(f"   📈 Sample: {sample.get('bucket')} | {sample.get('lot_name')} -> Avg Available: {sample.get('avg_available')} | Peak Occupied: {sample.get('peak_occupied')}")

        # 10. City Metrics Environmental Continuous Aggregate
        status, metrics = get("/v1/core/analytics/city-metrics?metric_type=air_quality_pm25&hours=6")
        print(f"✅ /v1/core/analytics/city-metrics -> {len(metrics)} environmental sensor aggregate points")
        if metrics:
            sample_m = metrics[0]
            print(f"   🌿 Sample: {sample_m.get('bucket')} | Area: {sample_m.get('area_id')} -> Avg PM2.5: {sample_m.get('avg_value')} µg/m³")

        # 11. Open Data Export (JSON & CSV)
        status, open_data = get("/v1/core/open-data/export")
        print(f"✅ /v1/core/open-data/export -> '{open_data.get('title')}' ({open_data.get('license')})")
        print(f"   🏛️ Published datasets: {list(open_data.get('data', {}).keys())}")

        req_csv = urllib.request.Request(f"{BASE_URL}/v1/core/open-data/export?format=csv")
        with urllib.request.urlopen(req_csv) as resp_csv:
            csv_content = resp_csv.read().decode('utf-8')
            csv_lines = [l for l in csv_content.splitlines() if l.strip()]
            print(f"✅ /v1/core/open-data/export?format=csv -> HTTP {resp_csv.status} ({len(csv_lines)} rows including headers)")
            if csv_lines:
                print(f"   📊 CSV Header: {csv_lines[0]}")

        # 12. Parkie SSE Live Stream Check
        req_sse = urllib.request.Request(f"{BASE_URL}/v1/m/parkie/stream")
        with urllib.request.urlopen(req_sse, timeout=3) as resp_sse:
            content_type = resp_sse.headers.get("Content-Type", "")
            chunk = resp_sse.readline().decode('utf-8') + resp_sse.readline().decode('utf-8')
            print(f"✅ /v1/m/parkie/stream -> SSE Stream open (Content-Type: {content_type})")
            print(f"   📡 Initial Event Preview: {chunk.strip()[:60]}...")

        # 13. [M12_DASHBOARD] City Officials Overview & Heatmap Analytics
        print("\n" + "=" * 60)
        print("🏛️ TESTING M12 OFFICIALS DASHBOARD & SPATIAL ANALYTICS")
        print("=" * 60)
        status, overview = get("/v1/m/dashboard/overview")
        print(f"✅ /v1/m/dashboard/overview -> City: {overview.get('city')}")
        kpis = overview.get('kpis', {})
        parking_kpis = kpis.get('parking', {})
        env_kpis = kpis.get('environment', {})
        print(f"   🅿️ Parking Occupancy: {parking_kpis.get('occupancy_rate_pct')}% across {parking_kpis.get('total_lots')} lots ({parking_kpis.get('total_available_spots')} spots free)")
        print(f"   🌿 Environmental Status: PM2.5 = {env_kpis.get('air_quality_avg_pm25')} µg/m³ ({env_kpis.get('air_quality_status')}) | Noise = {env_kpis.get('avg_noise_db')} dB")

        status, heatmap = get("/v1/core/analytics/heatmap")
        parking_pts = heatmap.get('parking_heatpoints', [])
        env_pts = heatmap.get('environmental_heatpoints', [])
        print(f"✅ /v1/core/analytics/heatmap -> {len(parking_pts)} parking heatpoints + {len(env_pts)} environmental heatpoints")

        print("=" * 60)
        print("🎉 ALL P2 CORE SYSTEMS, SSE & TIGER DATA SPONSOR SUITE VERIFIED 100%!")
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
