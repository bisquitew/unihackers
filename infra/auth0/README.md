# 🔐 Auth0 Sponsor Challenge — Timișoara City Hub Architecture

> **Sponsor Prize Target:** Wireless Headphones (per team member)  
> **Challenge Focus:** Secure Identity, RBAC, Multi-Factor Authentication (MFA), and Auth0 for AI Agents.

---

## 🌟 Overview & Key Innovations

Timișoara City Hub implements an enterprise-grade identity and access control system backed by Auth0:

1. **Step-Up MFA (RFC 9470):** Rather than annoying residents with MFA for basic map browsing, our API and client enforce dynamic Step-Up MFA for sensitive actions (e.g., publishing heating cuts or rerouting tram lines).
2. **Auth0 for AI Agents (M2M):** Background autonomous ingestion workers (such as the Netrom Gemini Colterm scraper) authenticate via Auth0 Machine-to-Machine (M2M) `client-credentials` assertions, operating without human MFA intervention while remaining strictly audited under `tier_3_ai_agent_m2m`.
3. **Granular Security Tiers:**
   - 🛡️ **Tier 1 (Standard):** Passwordless email or Google OAuth2 for everyday residents and event attendees.
   - 🔐 **Tier 2 (MFA Verified):** FIDO2 / WebAuthn Biometric Passkeys or TOTP Authenticator for city officials, transit engineers, and moderators.
   - 🤖 **Tier 3 (AI Agent M2M):** Autonomous service principals with restricted scopes and automated event logging.
4. **Adaptive Geolocation & New Location Shield (Push & Email Alerts):**
   - Automatically inspects the login IP, country, and city against known trusted locations.
   - When a login attempt originates from an unrecognized location (e.g. București vs known Timișoara):
     - Dispatches a real-time **in-app / mobile push notification**.
     - Generates and dispatches a responsive **transactional security warning email** with one-click "Confirm Location" and "Emergency Block & Enforce MFA" links.
     - Temporarily locks the session with mandatory Step-Up MFA (RFC 9470).
5. **Tiger Cloud Database Audit Trail:** Every security decision (`ALLOW`, `CHALLENGE_MFA_REQUIRED`, `DENIED_INSUFFICIENT_ROLE`, `CHALLENGE_NEW_LOCATION_ALERT`) is recorded with timestamps, user IDs, roles, and IP addresses in TimescaleDB (`core_auth_audit_events`).

---

## 🚀 Live Judge Testing Endpoints

The City Hub API provides ready-to-test endpoints for judges:

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/v1/core/auth/me` | `GET` | Returns active security profile, AMR methods, and security tier |
| `/v1/core/auth/dev-tokens` | `GET` | Catalog of 7 judge test personas with explanations |
| `/v1/core/auth/audit-log` | `GET` | Live security audit trail queryable by staff and auditors |
| `/v1/core/auth/simulate-mfa` | `POST` | Simulates completing an RFC 9470 Passkey / TOTP step-up challenge |
| `/v1/core/auth/simulate-login` | `POST` | Simulates login and evaluates location anomaly (triggers push + email) |
| `/v1/core/auth/security-emails` | `GET` | Inspects outbox of generated transactional security warning emails |
| `/v1/core/auth/trust-location` | `POST` | Adds confirmed location to user's trusted locations list |
| `/v1/core/auth/block-session` | `POST` | Emergency blocks suspicious session and enforces step-up MFA |
| `/v1/core/auth/webhook` | `POST` | Receives Auth0 Post-Login Action events and suspicious login alerts |
| `/v1/m/utilities/outages` | `POST` | Guarded by Admin role + verified MFA (returns 403 step-up if unverified) |
| `/v1/m/transit/detours` | `POST` | Guarded by Admin role + verified MFA (returns 403 step-up if unverified) |

---

## 🧑‍💻 The 7 Judge Test Personas

Use any of these tokens as `Authorization: Bearer <token>`:

1. `dev_resident` — Citizen Andrei (Passwordless / Google, Tier 1)
2. `dev_organizer` — Event Organizer Ioana (OAuth2, Tier 1)
3. `dev_moderator_no_mfa` — Moderator Mihai without MFA (Blocked on high-privilege actions)
4. `dev_moderator_mfa` — Moderator Mihai with TOTP verified (Tier 2)
5. `dev_admin_no_mfa` — Primăria Timișoara Admin without MFA (Blocked on publishing outages)
6. `dev_admin_mfa` — Primăria Timișoara Admin with FIDO2 Passkey (Tier 2 Verified)
7. `dev_ai_agent` — Autonomous Netrom Gemini Ingestion Agent (Tier 3 M2M)

---

## 🛠️ Verification & Demo

Run the automated verification suite:
```bash
python3 scripts/test_p2.py
```
Or run the dedicated Auth0 interactive judge demo:
```bash
python3 scripts/demo_auth0.py
```
