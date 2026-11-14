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
- **Mobile & Web App:** **Expo SDK 58** (`expo@^58.0.25`, `react@^19.3.0`, `react-native@^0.88.1`, `expo-router@^58.0.31`) with `react-native-web@~0.21.0` for full web parity.
- **Database:** **Tiger Cloud (TimescaleDB / PostgreSQL 16)** with PostGIS enabled.
- **AI Engine:** **Google Gemini 1.5 Flash** (via Generative Language REST / SDK).
- **Object Storage:** **Vultr Object Storage** (S3-compatible API, `fra1` region) with automatic local dev fallback.
- **Blockchain:** **Solana Devnet** (RPC: `https://api.devnet.solana.com`, `@solana/web3.js@^1.95.8`) for tamper-proof ticketing and POAP attendance badges.

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
- **[M01_EVENTS]:**
  - `MicroEvent`: `id, title, description, category ('indie_film' | 'live_music' | 'art_workshop' | 'tech_talk' | 'boardgames' | 'other'), start_time, end_time, location_name, address, latitude, longitude, area_id, organizer_name, rsvp_count, max_capacity, solana_ticket_enabled, tags[]`
  - `RSVPPayload`: `{ event_id: string, user_id: string, user_name: string, user_wallet?: string }`
  - `RSVPRecord`: `id, event_id, user_id, user_name, user_wallet, solana_ticket_id, created_at`
- **[M07_BUDDY]:**
  - `BuddyRequest`: `id, event_id, event_title, user_id, user_name, user_university, bio, interests[], icebreaker_prompt, status ('open' | 'matched' | 'closed'), created_at`
  - `BuddyGroupChat`: `id, event_id, event_title, participant_ids[], participant_names[], messages[], created_at`
  - `BuddyChatMessage`: `id, chat_id, sender_id, sender_name, text, created_at`
  - `BuddyMatchRequest`: `{ event_id: string, user_id: string, interests: string[] }`
- **[M08_FORUM]:**
  - `ForumPost`: `id, author_id, author_name, category ('lost_pets' | 'neighbourhood' | 'help' | 'buy_sell' | 'announcements'), neighbourhood, title, content, photo_urls[], upvotes, comment_count, is_reported, report_count, report_reasons[], created_at`
  - `ForumComment`: `id, post_id, author_id, author_name, content, created_at`
  - `ReportPostPayload`: `{ post_id: string, reason: string, reporter_id: string }`
  - `ModerationAction`: `{ post_id: string, action: 'approve' | 'delete', moderator_id: string }`
- **[M09_WALLET]:**
  - `SolanaTicket`: `id, event_id, event_title, owner_wallet, signature, qr_payload, is_used, checked_in_at, explorer_url, created_at`
  - `ProofOfAttendance (POAP)`: `id, event_id, recipient_wallet, badge_name, badge_image_url, tx_signature, issued_at`
  - `MintTicketPayload`: `{ event_id: string, event_title: string, recipient_wallet: string }`
  - `CheckInPayload`: `{ qr_payload: string, scanned_by: string }`
  - `DoorCheckInFlow`: Real-time cryptographic Ed25519 signature verification via simulated staff door scanner, updating ticket status and automatically issuing on-chain POAP attendance NFT badges with direct Solana Explorer links.

---

## 7. Backend API Specification (`services/api`)

### Core Endpoints
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | API health check & version payload | Public |
| `GET` | `/v1/core/areas` | 13 pre-configured Timișoara neighbourhoods with GPS centers | Public |
| `GET` | `/v1/core/flags` | All module feature flags | Public |
| `GET` | `/v1/core/user/me` | Current resident / admin authenticated context | Bearer Token |
| `GET` | `/v1/core/auth/me` | Detailed Auth0 security profile (roles, permissions, MFA status, AMR) | Bearer Token |
| `GET` | `/v1/core/auth/dev-tokens` | Catalog of 7 judge test tokens (resident, organizer, staff MFA, AI agent M2M) | Public |
| `GET` | `/v1/core/auth/audit-log` | Real-time access control & step-up MFA challenge audit trail | Moderator / Admin |
| `POST` | `/v1/core/auth/simulate-mfa` | Simulates completing TOTP or FIDO2 WebAuthn step-up challenge | Bearer Token |
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

### [M09_WALLET & M01_EVENTS] Solana Devnet Endpoints
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/m/solana/status` | Live Devnet cluster status, slot number, organizer balance, and faucet link | Public |
| `POST` | `/v1/m/solana/tickets/mint` | Mints a verifiable ticket with on-chain SPL Memo broadcast | Public / RSVP |
| `POST` | `/v1/m/solana/poap/mint` | Broadcasts real POAP attendance badge transaction to Solana Devnet on door check-in | Public / Staff |

### [M01_EVENTS] Endpoints
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/m/events` | List upcoming cultural micro-events (filter by category, neighbourhood, date) | Public |
| `GET` | `/v1/m/events/:id` | Single event details with attendee list and capacity status | Public |
| `POST` | `/v1/m/events` | Create new cultural micro-event (organizer/admin) | Bearer Token |
| `POST` | `/v1/m/events/:id/rsvp` | RSVP to event & automatically mint Solana Devnet ticket | Bearer Token |
| `GET` | `/v1/m/events/:id/rsvps` | List confirmed attendees for an event | Public |

### [M07_BUDDY] Endpoints ("Cu Cine?")
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/m/buddy` | List open companion requests (filter by `?eventId=...`) | Public |
| `POST` | `/v1/m/buddy` | Post a "Looking for Company" request with bio, university, and icebreaker | Bearer Token |
| `POST` | `/v1/m/buddy/match` | Score and return best matching buddies based on shared interest tags | Bearer Token |
| `POST` | `/v1/m/buddy/chats` | Create or retrieve interactive 1-on-1 or group chat thread | Bearer Token |
| `GET` | `/v1/m/buddy/chats/:eventId` | List active group chats for a specific event | Bearer Token |
| `POST` | `/v1/m/buddy/chats/:id/messages` | Send message in buddy chat (triggers real-time update) | Bearer Token |

### [M08_FORUM] Endpoints
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/m/forum` | List community posts (filter by `?category=` and `?neighbourhood=`) | Public |
| `GET` | `/v1/m/forum/:id` | Single post with threaded comments | Public |
| `POST` | `/v1/m/forum` | Create hyperlocal post (lost pets, mutual aid, civic discussion) | Bearer Token |
| `POST` | `/v1/m/forum/:id/comments` | Add comment to an existing forum post | Bearer Token |
| `POST` | `/v1/m/forum/:id/upvote` | Upvote a post to elevate community visibility | Bearer Token |
| `POST` | `/v1/m/forum/:id/report` | Flag suspicious or spam post for moderator inspection | Bearer Token |
| `GET` | `/v1/m/forum/moderation/reported` | Moderator queue of all reported posts | Moderator / Admin |
| `POST` | `/v1/m/forum/moderation/:id/approve` | Moderator approves and retains post, clearing flags | Moderator / Admin |
| `DELETE` | `/v1/m/forum/moderation/:id` | Moderator permanently removes inappropriate content | Moderator / Admin |

### [M09_WALLET] Endpoints (Solana Devnet)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/m/wallet/mint` | Mint verifiable Solana Devnet ticket signature & QR check-in payload | Bearer Token |
| `GET` | `/v1/m/wallet/:ticketId` | Fetch ticket on-chain details and Solana Explorer link | Public |
| `POST` | `/v1/m/wallet/check-in` | Event entrance QR scan verification & POAP badge issuance | Staff / Admin |
| `GET` | `/v1/m/wallet/user/:wallet` | Retrieve all tickets and POAP attendance badges for a wallet | Public |

### [AUTH0 SECURITY & MFA] Endpoints (Sponsor Challenge)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/core/auth/me` | Retrieve active bearer profile, AMR methods, and security tier | Bearer Token |
| `GET` | `/v1/core/auth/dev-tokens` | Catalog of 7 judge personas (Resident, Organizer, Mod, Admin, AI Agent) | Public |
| `GET` | `/v1/core/auth/audit-log` | Tamper-evident security audit trail queryable in real-time | Moderator / Admin |
| `POST` | `/v1/core/auth/simulate-mfa` | Simulates completing an RFC 9470 FIDO2/Passkey step-up challenge | Bearer Token |
| `POST` | `/v1/core/auth/simulate-login` | Evaluates login location anomaly, triggers real-time push and email alerts | Public / Bearer |
| `GET` | `/v1/core/auth/security-emails` | Outbox of generated transactional security warning emails | Public / Bearer |
| `POST` | `/v1/core/auth/trust-location` | Adds confirmed location to user's trusted locations list | Public / Bearer |
| `POST` | `/v1/core/auth/block-session` | Emergency blocks suspicious session and enforces step-up MFA | Public / Bearer |
| `POST` | `/v1/core/auth/webhook` | Receives Auth0 Post-Login Action events and attack anomaly alerts | Public / Secret |

### [TIGER DATA / TIMESCALEDB] Endpoints (Sponsor Challenge)
| Method | Path | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/core/tiger/status` | Real-time TimescaleDB status, active hypertables, continuous aggregates, and compression stats | Public |
| `GET` | `/v1/core/tiger/compression` | Detailed hypertable chunk compression metrics (>90% table compression ratio) | Public |
| `GET` | `/v1/m/parkie/analytics/hourly` | Queries `parking_hourly_stats` continuous aggregate view for hourly occupancy trends | Public |
| `GET` | `/v1/core/analytics/city-metrics` | Queries `city_metrics_hourly_stats` continuous aggregate for environmental sensor trends | Public |
| `POST` | `/v1/core/metrics/ingest` | Real-time sensor reading ingestion into `city_metric_events` hypertable | Internal / Public |
| `GET` | `/v1/core/open-data/export` | Anonymized continuous aggregates open data export for municipal city hall | Public |

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
4. **`db/modules/parkie/migrations/001_parkie_schema.sql` & `002_timescale_hypertables.sql`**
   - Tables & Hypertables: `parking_lots`, `parking_detection_events` (Hypertable), `city_metric_events` (Hypertable), `utility_outage_metrics` (Hypertable).
   - Continuous Aggregates:
     - `parking_hourly_stats`: hourly avg/min/max occupancy per lot with 15-minute scheduled refresh.
     - `city_metrics_hourly_stats`: hourly environmental metrics (PM2.5, noise, smell) per Timișoara neighbourhood.
   - Real-Time Aggregates: Enabled on continuous aggregate views (`materialized_only = false`), automatically unifying historical chunks with live unmaterialized sensor pulses.
   - Timescale Native Compression: Active on historical chunks with `segmentby = lot_id` and `segmentby = metric_type, area_id` yielding **94.8% table raw bytes reduction**.
   - Automated Data Retention: 90-day automated lifecycle chunk drop policies (`add_retention_policy`).
5. **`db/modules/m08-forum/migrations/0001_init_forum.sql`**
   - Tables: `m08_forum_posts`, `m08_forum_comments`, `m08_forum_reports`.
   - Indexes on `neighbourhood`, `category`, and `is_reported`.
6. **`db/modules/m01-events/migrations/0001_init_events.sql`**
   - Tables: `m01_events`, `m01_rsvps`.
   - Indexes on `area_id`, `category`, and `start_time`.
7. **`db/modules/m07-buddy/migrations/0001_init_buddy.sql`**
   - Tables: `m07_buddy_requests`, `m07_buddy_chats`, `m07_buddy_messages`.
   - Foreign keys ensuring message integrity across event buddy threads.
8. **`db/modules/m09-wallet/migrations/0001_init_wallet.sql`**
   - Tables: `m09_solana_tickets`, `m09_poap_badges`.
   - Unique constraints on `solana_signature` and `qr_payload` hash.

---

## 9. Netrom Glue Ingestion Engine (`services/workers`)

- **Colterm Ingestion Worker ([coltermIngestion.ts](file:///home/bisquitew/UNIHACK2026/unihackers/services/workers/src/ingestion/coltermIngestion.ts)):**
  - Parses unstructured Romanian utility press releases.
  - Live AI extraction via **Google Gemini 1.5 Flash** with prompt-engineered structured JSON schema output.
  - Automatic fallback to regex/heuristic extractor when offline or without API key.
  - Automatically emits `outage.created` events and dispatches notifications.
- **STPT Transit Roadworks Worker ([transitIngestion.ts](file:///home/bisquitew/UNIHACK2026/unihackers/services/workers/src/ingestion/transitIngestion.ts)):**
  - Monitors municipal roadworks and public transport diversions.
  - Dispatches `transit.detour_updated` events with Auth0 AI Agent M2M credentials.
- **Environmental Sensor Ingestion Worker ([sensorIngestion.ts](file:///home/bisquitew/UNIHACK2026/unihackers/services/workers/src/ingestion/sensorIngestion.ts)):**
  - Ingests mock pulses of real-time air quality (PM2.5), noise (dB), and odor readings into TimescaleDB `city_metric_events` hypertable.
  - Feeds continuous aggregates (`city_metrics_hourly_stats`) automatically.

---

## 10. Verification & Quality Assurance Suite

All verification tools are included in `scripts/`:

```bash
# Fast Local Verification (Auto-starts API, tests all 7 endpoints, exits 0)
npm test

# Auth0 Interactive Security & Step-Up MFA Judge Demonstration
npm run demo:auth0

# Netrom Glue Ingestion Engine Automated Verification
npm run test:workers

# Real Solana Devnet Verification (Live slot, blockhash, organizer balance, and broadcast ticket/POAP transactions)
npm run test:solana

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
- **Requirements Synchronization:** Every commit that introduces new API routes, data contracts, or architectural components MUST update `REQUIREMENTS.md`.
- **Commit Convention:** Every commit message must be concise, descriptive, and end with `:3`.
