# 🏛️ UNIHACK 2026 — Timișoara City Hub (UniHackers)
## Full Project Specification & System Requirements

> **Status:** Active Hackathon Monorepo  
> **Target Event:** UNIHACK 2026 (Timișoara, Romania)  
> **Team:** UniHackers (4 Members: P1, P2, P3, P4)  
> **Last Updated:** November 13, 2026

---

## 1. Executive Summary & Problem Statement

Timișoara residents face recurring, fragmented urban challenges:
1. **Unpredictable Utility Cuts:** Unannounced or short-notice Colterm heating/hot water cuts and Aquatim water pipe maintenance.
2. **Major Transit Disruptions:** 2026 infrastructure roadworks have suspended Tram Line 5 (Calea Bogdăneștilor) and detoured Lines 1 & 2.
3. **Parking Inefficiency:** High congestion in central shopping and business areas (Unirii, 700, Iulius Town) with drivers circling for spots.
4. **Community Disconnect:** Fragmented Facebook groups for events, student buddy matching, and lost pets.

**Timișoara City Hub** solves this by uniting platform data, real-time computer vision parking (Parkie), automated public notices ingestion with Google Gemini, community events, and Solana micro-rewards into a single cohesive platform.

---

## 2. Monorepo Architecture

```
unihackers/
├── apps/
│   └── app/                 # Cross-platform Expo / React Native App (P1, P3, P4)
├── packages/
│   ├── contracts/           # Zero-dependency TypeScript schemas & Zod validators (P2)
│   ├── ui/                  # Shared UI Design System & Component Library (P1)
│   ├── solana/              # Solana devnet ticket & POAP minting SDK (P3)
│   ├── api-client/          # Typed API client for frontend consumption
│   └── config/              # Shared linting & build configs
├── services/
│   ├── api/                 # City Hub Core API (HTTP / Hono / Node 26) (P2)
│   └── workers/             # Netrom Glue Ingestion Engine + Gemini AI (P2)
├── db/
│   ├── core/migrations/     # Core schema migrations (Users, Areas, Places, Flags)
│   └── modules/             # Per-module database migrations (M01-M12, Parkie)
├── scripts/                 # Dev launchers, Tiger Cloud migrators, test harnesses
└── docs/                    # Design tokens, branding, documentation
```

---

## 3. Team Ownership Matrix

| Role | Lead | Focus Areas | Key Codebase Locations |
| :--- | :--- | :--- | :--- |
| **Person 1 (P1)** | UI & Parkie Mobile Lead | Design tokens, Mobile App shell, Porting Parkie UI | `apps/app`, `packages/ui`, Parkie Screens |
| **Person 2 (P2)** | Platform, Data & City Alerts | Monorepo architecture, `@hub/contracts`, Core API, Utilities [M04], Transit [M05], Parkie Backend, Tiger Cloud DB, Ingestion Workers, Photo Storage | `packages/contracts`, `services/api`, `services/workers`, `db/`, `scripts/` |
| **Person 3 (P3)** | Community & Social Lead | Events [M01], Buddy Matcher [M07], Forum [M08], Solana Civic Wallet [M09] | `apps/app/src/modules/m01,m07,m08,m09`, `packages/solana` |
| **Person 4 (P4)** | AI, Voice & Civic Reports Lead | Urban Safety [M03], Smell Tracker [M06], AI Assistant [M10], Living Labs Feedback [M11] | `apps/app/src/modules/m03,m06,m10,m11` |

---

## 4. Runtime & Tech Stack Requirements

### Runtime Environments
- **Node.js:** `v22.0.0+` or `v26.13.1` (with `--experimental-strip-types` enabled for zero-dependency native TypeScript).
- **Package Manager:** `pnpm v12+` or `npm v11+`.
- **Python:** `3.10+` (Used for automated test harnesses and Tiger Cloud migration scripts).
- **Database:** **Tiger Cloud (TimescaleDB / PostgreSQL 16)** with PostGIS enabled.
- **AI Engine:** **Google Gemini 1.5 Flash** (via Generative Language REST / SDK).
- **Object Storage:** **Vultr Object Storage** (S3-compatible API, `fra1` region) with automatic local dev fallback.
- **Blockchain:** **Solana Devnet** (RPC: `https://api.devnet.solana.com`).

---

## 5. Environment Variables Specification

The project reads configurations from `.env` in the workspace root:

| Variable | Description | Default / Example | Required In |
| :--- | :--- | :--- | :--- |
| `PORT` | Local API server listening port | `8000` (auto-steps to `8001` if busy) | All |
| `DATABASE_URL` | TimescaleDB / Tiger Cloud connection string | `postgres://tsdbadmin:pwd@host.tsdb.cloud.timescale.com:30613/tsdb?sslmode=require` | Production / DB |
| `TIMESCALE_SERVICE_URL` | Alternate connection URI format for Timescale | Same as `DATABASE_URL` | Production / DB |
| `GEMINI_API_KEY` | Google AI Studio Key for notice extraction | `AIzaSy...` | Workers |
| `VULTR_STORAGE_KEY` | Vultr Object Storage Access Key | `S3_ACCESS_KEY` | Production Storage |
| `VULTR_STORAGE_SECRET` | Vultr Object Storage Secret Key | `S3_SECRET_KEY` | Production Storage |
| `VULTR_STORAGE_BUCKET` | Target bucket name | `timisoara-hub-media` | Production Storage |
| `VULTR_STORAGE_REGION` | Vultr Storage region identifier | `fra1` (Frankfurt) | Production Storage |
| `AUTH0_DOMAIN` | Auth0 tenant domain | `timisoara-hub.eu.auth0.com` | Auth |
| `AUTH0_AUDIENCE` | Auth0 audience identifier | `https://api.timisoara-hub.ro` | Auth |
| `SOLANA_NETWORK` | Solana network cluster | `devnet` | Web3 [M09] |

---

## 6. Data Contracts & Schemas (`@hub/contracts`)

All inter-service and frontend-backend interactions are strictly typed via `@hub/contracts`:

### 6.1 Core System Types
- **User Roles:** `'resident' | 'organizer' | 'moderator' | 'admin'`
- **User Profile:** `id, auth0_id, email, name, role, neighbourhood, created_at, updated_at`
- **Timișoara Areas (13 Neighourhoods):** `id, name, slug, center_lat, center_lng, radius_meters`
  - *Areas:* Cetate, Circumvalațiunii, Complex Studențesc, Iosefin, Elisabetin, Fabric, Soarelui, Girocului, Dâmbovița, Mehala, Calea Aradului, Calea Lipovei, Gara de Nord.
- **Saved Place:** `id, user_id, label, address, latitude, longitude, area_id, notify_utilities, notify_transit`
- **In-App Notification:** `id, user_id, module_id, title, body, category, data, read, created_at`
- **Feature Flag:** `module_id, status ('draft' | 'beta' | 'live'), enabled, min_role`
- **Photo Upload:**
  - `UploadRequestPayload`: `{ filename: string, content_type: string, module_id?: string }`
  - `UploadSignedUrlResponse`: `{ upload_url: string, public_url: string, key: string, expires_in: number }`

### 6.2 Module Data Types
- **[M04_UTILITIES]:**
  - `Outage`: `id, provider, type, status, severity, title, description, affected_areas[], affected_streets[], start_time, estimated_restore_time, resolved_at, crowd_confirmations_count`
- **[M05_TRANSIT]:**
  - `TransitLine`: `id, line_number, type, name, status, current_route_summary, detour_alert`
  - `DetourAlert`: `id, line_number, title, reason, status, affected_stops[], alternative_instructions, replacement_line, valid_from`
- **[PARKIE]:**
  - `ParkingLot`: `id, owner_id, name, latitude, longitude, camera_url, slots_data, capacity, available_spots, status_color ('green' | 'yellow' | 'red' | 'gray'), is_verified, last_updated`
  - `DetectionPayload`: `{ lot_id: string, detected_cars: number }`
- **[M01_EVENTS]:** `Event`: `id, title, description, type, start_time, end_time, location_name, address, latitude, longitude, area_id, organizer_id, rsvp_count`
- **[M07_BUDDY]:** `BuddyRequest`: `id, event_id, user_id, note, status, matched_user_id`
- **[M08_FORUM]:** `ForumPost`: `id, author_id, category, title, content, photo_urls[], upvotes, comment_count`
- **[M09_WALLET]:** `SolanaTicket`: `id, event_id, mint_address, owner_wallet, status`

---

## 7. Backend API Specification (`services/api`)

### Core Endpoints
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | API health check & version payload | Public |
| `GET` | `/v1/core/areas` | 13 pre-configured Timișoara neighbourhoods with GPS centers | Public |
| `GET` | `/v1/core/flags` | All module feature flags | Public |
| `GET` | `/v1/core/user/me` | Current resident / admin authenticated context | Bearer Token |
| `GET` | `/v1/core/user/places` | List saved resident places | Bearer Token |
| `POST` | `/v1/core/user/places` | Save new address (home, work, dorm) | Bearer Token |
| `POST` | `/v1/core/upload/signed-url` | Generate presigned S3 PUT URL for photo uploads | Bearer Token |
| `PUT` | `/v1/core/upload/raw/:key` | Local development binary upload handler | Public / Dev |
| `GET` | `/uploads/:key` | Public retrieval of uploaded image media | Public |

### [M04_UTILITIES] Endpoints
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/m/utilities/outages` | List active heating/water outages (filterable by area/provider) | Public |
| `POST` | `/v1/m/utilities/outages` | Publish new outage (worker/admin) | Internal / Admin |
| `POST` | `/v1/m/utilities/check-address` | Matches resident address/area against active outages | Public |
| `POST` | `/v1/m/utilities/outages/:id/confirm` | Resident crowd-confirms outage ("Affected too") | Bearer Token |

### [M05_TRANSIT] Endpoints
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/m/transit/lines` | List all tram & bus lines with status and alerts | Public |
| `GET` | `/v1/m/transit/detours` | Active 2026 roadwork detour announcements | Public |
| `POST` | `/v1/m/transit/detours` | Ingestion / Admin publishes roadwork detour alert | Internal / Admin |
| `POST` | `/v1/m/transit/check-stop` | Check if a stop is affected (recommends bus 5C for line 5) | Public |

### [PARKIE] Endpoints
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/m/parkie/lots` | List all verified parking lots with real-time occupancy | Public |
| `GET` | `/v1/m/parkie/lots/colors` | Ultra-lightweight occupancy stream `[{ id, name, status_color, available_spots }]` | Public |
| `GET` | `/v1/m/parkie/nearest` | Find nearest parking lots ordered by distance (`?lat=&lng=&limit=`) | Public |
| `GET` | `/v1/m/parkie/lots/:id` | Single lot metadata and camera config | Public |
| `POST` | `/v1/m/parkie/detections` | Ingest CV camera detection frames `{ lot_id, detected_cars }` | AI Agent / Camera |
| `POST` | `/v1/m/parkie/lots` | Register new parking lot | Owner / Admin |

---

## 8. Database Architecture (Tiger Cloud / TimescaleDB)

All schemas are located under `db/` and executed via `scripts/migrate.sh`:

1. **`db/core/migrations/001_core_schema.sql`**
   - Tables: `core_users`, `core_areas`, `core_saved_places`, `core_notifications`, `core_feature_flags`, `core_events_outbox`.
   - Native UUID generation with `gen_random_uuid()`.
2. **`db/modules/m04-utilities/migrations/001_utilities_schema.sql`**
   - Tables: `m04_utilities_outages`, `m04_outage_confirmations`.
   - GIN index on `affected_areas` and `affected_streets` for fast address matching.
3. **`db/modules/m05-transit/migrations/001_transit_schema.sql`**
   - Tables: `m05_transit_lines`, `m05_detour_alerts`.
   - GIN index on `affected_stops`.
4. **`db/modules/parkie/migrations/001_parkie_schema.sql`**
   - Tables: `parking_lots`, `parking_detection_events`.
   - Pre-seeded with 10 key parking structures in Timișoara.
   - Spatial indexing on `(latitude, longitude)`.

---

## 9. Netrom Glue Ingestion Engine (`services/workers`)

- **Colterm Ingestion Worker ([coltermIngestion.ts](file:///home/bisquitew/UNIHACK2026/unihackers/services/workers/src/ingestion/coltermIngestion.ts)):**
  - Parses unstructured Romanian utility press releases.
  - Live AI extraction via **Google Gemini 1.5 Flash** with prompt-engineered structured JSON schema output.
  - Automatic fallback to regex/heuristic extractor when offline or without API key.
  - Automatically emits `outage.created` events and dispatches notifications.
- **STPT Transit Roadworks Worker ([transitIngestion.ts](file:///home/bisquitew/UNIHACK2026/unihackers/services/workers/src/ingestion/transitIngestion.ts)):**
  - Monitors municipal roadworks and public transport diversions.
  - Dispatches `transit.detour_updated` events.

---

## 10. Verification & Quality Assurance Suite

All verification tools are included in `scripts/`:

```bash
# Fast Local Verification (Auto-starts API, tests all 7 endpoints, exits 0)
npm test

# Full 8-System Master Verification (Tests Contracts, Tiger Cloud, API, Outages, Detours, Parkie, Uploads, Workers)
.venv/bin/python scripts/test_p2_full.py

# Live Tiger Cloud Database Migrations
./scripts/migrate.sh

# Start API Server directly
npm run dev
# or: ./scripts/dev.sh

# Start Ingestion Workers
npm run dev:workers
# or: ./scripts/workers.sh
```

---

## 11. Git & Collaboration Standards

- **Branch Protection:** All PRs merge into `main`.
- **Merge Standard:** Non-blocking zero-conflict module registrations.
- **Ignored Files:** All `.env`, `*.env`, `tiger-cloud-*.env`, `node_modules`, `uploads/`, `.venv` are ignored by git to protect secrets.
- **CODEOWNERS:** Granular path reviews enforced via `.github/CODEOWNERS`.
- **Continuous Integration:** Automated GitHub Actions runner configured in `.github/workflows/ci.yml`.
