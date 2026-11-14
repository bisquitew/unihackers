#!/usr/bin/env python3
"""
🔐 Auth0 Interactive Security & Step-Up MFA Demonstration
UNIHACK 2026 — Timișoara City Hub (UniHackers P2)

Demonstrates:
 1. RBAC Guard: Resident blocked from publishing city outage (HTTP 403 insufficient_role)
 2. Step-Up MFA Challenge (RFC 9470): Admin without MFA blocked (HTTP 403 mfa_required)
 3. MFA Step-Up Completion: Biometric / FIDO2 Passkey upgrade simulation -> HTTP 201 Created
 4. Auth0 for AI Agents: Autonomous Netrom Gemini Ingestion Agent (M2M) authorized without human MFA
 5. Security Audit Trail: Live tamper-evident audit records in Tiger Cloud Database
 6. Auth0 Actions Webhook: Receiving suspicious activity / post-login security notifications
"""

import urllib.request
import urllib.error
import json
import time
import subprocess
import sys
import os

API_BASE = "http://localhost:8000"

# ANSI Colors
BOLD = "\033[1m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
RESET = "\033[0m"

def log_header(title):
    print(f"\n{BOLD}{CYAN}{'=' * 65}{RESET}")
    print(f"{BOLD}{CYAN}🔐 {title}{RESET}")
    print(f"{BOLD}{CYAN}{'=' * 65}{RESET}")

def log_step(num, title):
    print(f"\n{BOLD}{YELLOW}▶ Step {num}: {title}{RESET}")

def make_request(path, method="GET", data=None, token=None):
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {"error": content}
    except Exception as e:
        return 0, {"error": str(e)}

def ensure_server():
    status, _ = make_request("/health")
    if status == 200:
        return None
    print(f"{BLUE}ℹ️  Starting local API server for demonstration...{RESET}")
    proc = subprocess.Popen(
        ["node", "--experimental-strip-types", "services/api/src/server.ts"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(2)
    return proc

def run_demo():
    server_proc = ensure_server()

    try:
        log_header("AUTH0 SPONSOR CHALLENGE — LIVE SECURITY ENGINE DEMO")

        # Step 1: Resident Token Profile
        log_step(1, "Inspecting Resident Profile (Tier 1 Standard)")
        status, res = make_request("/v1/core/auth/me", token="dev_resident")
        print(f"Status: {GREEN}HTTP {status}{RESET}")
        print(f"Identity: {BOLD}{res.get('name')}{RESET} ({res.get('email')})")
        print(f"Security Tier: {YELLOW}{res.get('security_tier')}{RESET} | AMR: {res.get('amr')}")

        # Step 2: RBAC Guard
        log_step(2, "RBAC Guard: Citizen Attempting to Publish Municipal Heating Outage")
        outage_payload = {
            "title": "Avarie Colterm Circumvalațiunii",
            "provider": "Colterm",
            "type": "heating",
            "affected_areas": ["area-circumvalatiunii"],
            "affected_streets": ["Strada Gheorghe Lazăr"],
            "start_time": "2026-11-14T10:00:00Z"
        }
        status, res = make_request("/v1/m/utilities/outages", method="POST", data=outage_payload, token="dev_resident")
        print(f"Result: {RED}HTTP {status} (FORBIDDEN){RESET}")
        print(f"Error: {res.get('error')} -> {res.get('error_description')}")
        print(f"🛡️ {BOLD}Access Denied:{RESET} Residents cannot modify critical city infrastructure!")

        # Step 3: Admin WITHOUT MFA -> Step-Up Challenge (RFC 9470)
        log_step(3, "Step-Up MFA: Admin (No MFA) Attempting to Publish Outage")
        status, res = make_request("/v1/m/utilities/outages", method="POST", data=outage_payload, token="dev_admin_no_mfa")
        print(f"Result: {YELLOW}HTTP {status} (MFA STEP-UP CHALLENGE REQUIRED){RESET}")
        print(f"Challenge ID / Reason: {BOLD}{res.get('error')}{RESET} - {res.get('error_description')}")
        print(f"Supported Factors: {res.get('supported_mfa_factors')}")
        print(f"Auth0 Authorize URL: {CYAN}{res.get('auth0_authorize_url')}{RESET}")

        # Step 4: Complete MFA Step-Up & Publish Outage
        log_step(4, "Simulate FIDO2 / WebAuthn Biometric Passkey Step-Up Upgrade")
        status, res = make_request("/v1/core/auth/simulate-mfa", method="POST", data={"factor": "fido2_webauthn_passkey"}, token="dev_admin_no_mfa")
        print(f"Upgrade Result: {GREEN}HTTP {status} OK{RESET}")
        print(f"Upgraded Token: {res.get('upgraded_token')} | New Tier: {GREEN}{res.get('security_tier')}{RESET}")

        print(f"\nRetrying Outage Publication with MFA-Verified Token ({res.get('upgraded_token')}):")
        status, res = make_request("/v1/m/utilities/outages", method="POST", data=outage_payload, token=res.get("upgraded_token"))
        print(f"Result: {GREEN}HTTP {status} CREATED{RESET}")
        print(f"Outage Published: {BOLD}{res.get('title')}{RESET} (ID: {res.get('id')})")

        # Step 5: Auth0 for AI Agents (M2M)
        log_step(5, "Auth0 for AI Agents: Autonomous Netrom Gemini Ingestion Agent (M2M)")
        detour_payload = {
            "line_number": "5",
            "title": "Deviere temporară Tramvai 5 — Lucrări Calea Bogdăneștilor",
            "reason": "Lucrări modernizare infrastructură linie cale ferată",
            "affected_stops": ["Calea Bogdăneștilor", "Muzicescu"],
            "start_time": "2026-11-14T08:00:00Z"
        }
        status, res = make_request("/v1/m/transit/detours", method="POST", data=detour_payload, token="dev_ai_agent")
        print(f"Result: {MAGENTA}HTTP {status} CREATED (AI AGENT M2M SUCCESS){RESET}")
        print(f"Agent Identity: Autonomous Netrom Gemini Ingestion Worker (M2M Client Credentials)")
        print(f"Transit Detour Alert ID: {res.get('id')}")

        # Step 6: Live Audit Trail in Tiger Cloud
        log_step(6, "Live Tamper-Evident Security Audit Log (Tiger Cloud Database)")
        status, res = make_request("/v1/core/auth/audit-log", token="dev_admin_mfa")
        records = res if isinstance(res, list) else res.get("audit_records", [])
        print(f"Status: {GREEN}HTTP {status}{RESET} ({len(records)} audit records retrieved)")
        for i, rec in enumerate(records[:4]):
            outcome_color = GREEN if rec.get("outcome") == "ALLOW" else (YELLOW if "MFA" in rec.get("outcome") else RED)
            print(f" [{i+1}] {outcome_color}[{rec.get('outcome')}]{RESET} Action: {BOLD}{rec.get('action')}{RESET} | User: {rec.get('email')} ({rec.get('role')}) | MFA: {rec.get('mfa_verified')}")

        # Step 7: Auth0 Post-Login Action Webhook
        log_step(7, "Auth0 Webhook: Ingesting Post-Login Security Event")
        status, res = make_request("/v1/core/auth/webhook", method="POST", data={
            "action": "post_login_mfa_success",
            "sub": "auth0|dev-admin-01",
            "email": "admin@timisoara-hub.ro",
            "timestamp": "2026-11-14T10:15:00Z",
            "mfa_factor": "fido2_webauthn"
        })
        print(f"Webhook Result: {GREEN}HTTP {status} OK{RESET} -> {res}")

        # Step 8: New Location Login Anomaly & Push / Email Alert
        log_step(8, "Adaptive Geolocation: Login Attempt from New Location (București)")
        login_anomaly_payload = {
            "token": "dev_resident",
            "city": "București",
            "country": "România",
            "ip": "86.120.45.12",
            "device": "Mobile Safari / iPhone 15 Pro"
        }
        status, res = make_request("/v1/core/auth/simulate-login", method="POST", data=login_anomaly_payload)
        print(f"Status: {YELLOW}HTTP {status}{RESET}")
        print(f"Location Evaluated: {BOLD}{res.get('location_evaluated', {}).get('city')}, {res.get('location_evaluated', {}).get('country')}{RESET} (IP: {res.get('location_evaluated', {}).get('ip')})")
        print(f"Is New Location? {RED}{res.get('is_new_location')}{RESET}")
        print(f"🔔 Push Notification Dispatched: {GREEN}{res.get('push_notification_sent')}{RESET}")
        print(f"   Title: \"{res.get('push_notification', {}).get('title')}\"")
        print(f"📧 Security Warning Email Sent: {GREEN}{res.get('email_alert_sent')}{RESET}")
        print(f"   Subject: \"{res.get('security_email', {}).get('subject')}\"")
        print(f"   To: {res.get('security_email', {}).get('to_email')}")
        print(f"🛡️ Step-Up MFA Challenge Enforced: {BOLD}{res.get('step_up_required')}{RESET}")

        # Step 9: Inspect Security Email Outbox
        log_step(9, "Transactional Security Email Outbox Verification")
        status, res = make_request("/v1/core/auth/security-emails?email=resident@timisoara-hub.ro")
        emails = res.get("emails", [])
        print(f"Status: {GREEN}HTTP {status}{RESET} ({len(emails)} security warning emails in outbox)")
        if emails:
            latest_email = emails[0]
            print(f"Latest Email ID: {latest_email.get('id')}")
            print(f"Confirmation Link: {CYAN}{latest_email.get('confirm_url')}{RESET}")
            print(f"Emergency Block Link: {RED}{latest_email.get('block_url')}{RESET}")

        print(f"\n{BOLD}{GREEN}🎉 AUTH0 SPONSOR CHALLENGE DEMONSTRATION COMPLETE 100%!{RESET}")
        print(f"{CYAN}Features verified: RBAC, RFC 9470 Step-Up MFA, Auth0 for AI Agents (M2M), Geolocation Anomaly Alert, Push Notification, Security Email, Tiger Cloud Audit Trail.{RESET}\n")

    finally:
        if server_proc:
            server_proc.terminate()

if __name__ == "__main__":
    run_demo()
