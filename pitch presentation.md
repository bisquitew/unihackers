# hop — Pitch Presentation Master Brief

> **Purpose of this file:** a complete, self-contained source of truth for generating (a) a **video marketing presentation** and (b) the **live pitch** for the project *hop — one app for Timișoara*, built at **UNIHACK 2026** by team **UniHackers**.
> **Intended reader:** the video/presentation generator (Fable 7.2). Everything it needs is below: story, facts, numbers, tech, side challenges, AI, brand, demo script, storyboard, voice-over, Q&A, and a list of claims it must NOT make.
> **Source of truth:** this brief was written from the actual repository (code, SQL migrations, docs, git history), not only from the planning documents. Where the old planning docs and the code disagree, the code wins and the difference is flagged in **Section 17 (Honesty guardrails)**.

---

## 0. How to use this brief (instructions for the generator)

1. **Deliverables to produce** (see Section 15 for detail):
   - A **3-minute hero pitch video** (master cut), plus a **90-second** and a **30-second** cut.
   - A **slide deck** (14–16 slides) that mirrors the video.
   - A **voice-over script** (English master; Romanian lines provided for the opening and closing) with on-screen text and shot list.
   - Optional: a one-page "judge leave-behind" and a thumbnail/poster.
2. **Tone:** warm, confident, human. Not corporate, not "govtech". The brand voice is a *helpful neighbour* (Section 3). Serious moments (outages, safety) are calm and factual, no hype, no exclamation marks.
3. **Show, don't claim.** Every capability listed has a real screen or API behind it. Prefer screen-recordings of the real product over mock-ups. The demo flow in Section 12 is rehearsed and works.
4. **Respect Section 17.** Several things are *demo/sample data*, *devnet*, or *web-only*. The video must label them honestly. Judges will probe; honesty is part of the pitch.
5. **Core promise to repeat:** *"Everything in Timișoara, one tap away."* (RO: *„Tot Timișoara-ul, la un tap distanță."*)
6. Use the **brand palette and typography** in Section 3 for every graphic, lower-third, and slide.

---

## 1. Identity at a glance

| Field | Value |
| --- | --- |
| **Product name** | **hop** (always lowercase). Repo/working titles: *Timișoara City Hub*, *unihackers*, GitHub `bisquitew/Hop`. App display name in Expo config: `hop`. |
| **One-liner** | One city app for Timișoara: alerts, parking, events, safety, a neighbourhood forum, an AI assistant you can talk to, and on-chain tickets — all in one place. |
| **Tagline EN** | Everything in Timișoara, one tap away. |
| **Tagline RO** | Tot Timișoara-ul, la un tap distanță. |
| **Event** | UNIHACK 2026, Timișoara, Romania. 48-hour hackathon. |
| **Team** | **UniHackers** — 4 people, split into four ownership lanes (P1 design + app shell + Parkie port; P2 platform, data, city alerts; P3 community + Solana; P4 AI, voice, civic reports, Living Labs). |
| **Build window** | First commit **13 Nov 2026 ~12:21**, last commit **15 Nov 2026 ~12:06** (≈ 48 h). |
| **Scale of what was built** | **~264 commits**, **~498 tracked files**, **~40,900 lines** of code (≈ 20.2k TypeScript, 7.4k TSX, 5.2k JavaScript, 2.3k MJS scripts, 2.8k Python, 0.7k SQL, 1.7k HTML, 0.6k CSS). 13 modules, a native+web app, a staff website, an API, workers, a computer-vision service. |
| **Platforms** | iOS + Android + web from **one Expo codebase**, plus a separate **staff website** for city employees. |
| **Languages** | Romanian + English throughout (app and website), with a dictionary-driven translator and an i18n audit script. |
| **Built-in "signature" detail** | Every commit message in the repo ends with ` :3` (team convention in `REQUIREMENTS.md`). Great for a playful end-card / easter egg. |

---

## 2. The story (the narrative spine of the video)

### 2.1 The problem — Timișoara's daily friction, with real examples

Timișoara is a European Capital of Culture city (2023) with a lively student population (UPT, UVT, Erasmus) — but the information residents need is **scattered and arrives too late**:

| # | Problem | Real, concrete Timișoara example (use on screen) |
| --- | --- | --- |
| 1 | **Utility cuts nobody warns you about** | Colterm's gas cut in Oct 2021 left ~**50,000 households** plus hospitals and schools without heat or hot water. Today, notices for water/heat/power are scattered across utility sites, social media and *paper notes taped to doors*. |
| 2 | **Transit changes you only discover at the stop** | Roadworks (Aug → end 2026) **suspended tram line 5** (Calea Bogdăneștilor) and detoured lines 1 and 2; a temporary bus **5C** was added. Changes are published as press releases — people wait at stops no tram serves anymore. |
| 3 | **Parking chaos** | Drivers circle in the centre and near big malls (Unirii, Piața 700, Iulius Town). In *our own survey*, parking was the #1 pain point. |
| 4 | **Feeling unsafe at night** | Aug 2025: residents around Gara de Nord protested threats, night noise and squatted buildings after complaints produced "no concrete response". |
| 5 | **Mystery smells** | Early 2022: a burnt-rubber smell almost every morning, no named source. Sensors measure particles, but when thousands *smell* something, nothing is recorded. |
| 6 | **A thin cultural middle** | Big festivals and museums exist; micro-events (open-air cinema, pottery jams, small gigs) are invisible. |
| 7 | **Loneliness at events** | Erasmus students and newcomers skip concerts because they have *no one to go with*. |
| 8 | **Visitors can't find practical info** | The 2023 Capital of Culture review criticised the city's slow, poorly-targeted communication with international visitors. |
| 9 | **Fragmented community** | Lost pets, mutual aid, neighbourhood help live in unmoderated Facebook groups with no local structure. |

### 2.2 The insight

> The city already *has* the information. It's just locked in press releases, PDFs, door notices, Facebook posts and sensors that don't talk to each other. **The missing piece isn't data — it's one trusted place that turns raw city signals into something you can *understand in a glance and ask in your own voice*.**

### 2.3 The solution

**hop** is a single city app (and a staff website) that:

1. **Ingests** messy city signals (a *photo of a notice on a door*, press releases, camera feeds, sensors, resident reports).
2. **Understands** them with AI (Gemini: vision, structured output, function calling, embeddings, code execution).
3. **Verifies & protects** them (Auth0 roles + step-up MFA for staff, honest "demo" labels, privacy rules).
4. **Delivers** them where residents already look (a map, a Home screen, alerts, a voice assistant that answers out loud in Romanian).
5. **Closes the loop** (residents report → city staff see aggregated, evidence-backed incidents → open data back to the city).

### 2.4 The "magic moment" for the video (rehearsed demo story)

> **"From a notice on the door to a spoken answer."**
> A city employee photographs a taped-up Aquatim water-cut notice → **Gemini reads it in ~2 s** into a structured draft → staff with a **second check (Auth0 MFA)** publish it → a resident opens the app and **asks out loud in Romanian**: *„Am apă miercuri pe strada Văcărescu?"* → hop answers, **spoken by a native Romanian voice (ElevenLabs)**: *"Miercuri, 18 noiembrie… între 08:00 și 16:00."*
> Closing line: **„O poză devine o alertă oficială în 10 secunde, iar orice locuitor o poate afla vorbind cu aplicația."** ("A photo becomes an official alert in 10 seconds, and any resident can find out just by talking to the app.")

---

## 3. Brand & visual identity (use for all graphics)

*(Full spec: `docs/brand/identity.md`, `docs/brand/brand-board.html`, `docs/brand/design-tokens.json`, `docs/brand/logo.svg`.)*

**Direction:** *friendly, calm, text-first.* "A helpful neighbour, not a city-hall portal." Light theme first; dark theme also exists in the website and app.

### 3.1 Logo
A **white baroque gable with an arched window on a pink tile** (inspired by the baroque facades of Piața Unirii). Wordmark: **"hop"**, lowercase, **Nunito 800**, ink colour, next to the mark at the same height. Don't recolour/stretch; clear space = half the mark height; min mark size 24 px.

### 3.2 Colour tokens
| Token | Hex | Use |
| --- | --- | --- |
| Background | `#F8F6FB` | page/board background (phone screens are plain white) |
| Surface | `#FFFFFF` | groups, sheets, inputs |
| **Ink** | `#1A1033` | all text/icons; **label on every button** (white on pink only reaches 3.4:1, so never used) |
| Muted | `#5A5070` | secondary text |
| **Pink (brand, rare)** | `#FF3D7F` | the logo + the *single* primary button on a screen. Nothing else. |
| Blue | `#3D5BFF` (deep `#2438C9`) | getting around & information (transit, parking, visitor info, assistant) |
| Mint | `#12C99B` (deep `#00704F`) | home & services (utilities, wallet, feedback) |
| Apricot | `#FF7A2F` (deep `#A84300`) | safety & warnings (safety, smell) |
| Plum | `#3A2F5C` | fine detail inside illustrations |
| Error red | `#B3261E` | error glyphs/text only |
| Dark theme | bg `#14091F`, surface `#20123A`, text `#F8F6FB` | |

### 3.3 Typography
- **Headlines:** Nunito 700/800 (rounded terminals, warm). **Body/UI:** Figtree 400–700. Both render Romanian **ș ț ă â î** correctly.
- Display 52/58 · Title 36/42 · Heading 26/32 · Body 16/24 · Caption 12/16.

### 3.4 Shape & motion
- Squircle (continuous) corners; fully round buttons/chips; **no pale boxes**, **lists not cards** (hairline separators), **colour lives in illustrations, numbers, avatars and one pink button**.
- **Glass** only for floating controls (tab bar, ask bar, toasts). Serious screens (outages, safety) are quiet: **no glass, no illustration, no jokes**.
- Motion answers actions: press = springy scale to 0.97; the "live" dot pulses slowly; everything respects *reduce motion / reduce transparency*.
- **13 flat module spot-illustrations** (no outlines): tram with pantograph, water drop with ripple, lamp with glow, festival bunting, P sign, cloud for smell, folded map with pin, etc.

### 3.5 Tone of voice
Friendly, quick, second person; short sentences; button names say what happens ("Find a buddy", not "Submit"). **Serious moments drop the jokes.**

| Moment | Write | Never write |
| --- | --- | --- |
| Empty events | "Nothing on tonight. Be the first to plan something." | "No data found." |
| Buddy match | "Maria is going too. Say hi?" | "A user matched your criteria." |
| Outage | "Hot water is off in your building until about 18:00. We'll tell you when it's back." | "ATTENTION!! Service disruption!!!" |
| Transit | "Tram 5 isn't running. Take 5C from Piața Sfântul Gheorghe." | "Line 5 suspended." |

### 3.6 Accessibility (a selling point)
Text contrast ≥ 4.5:1 everywhere (ink 16.6:1 on bg), 44 px minimum touch targets, visible 3 px focus ring, real controls (never clickable spans), screen-reader labels, reduced-motion/transparency support, tabular figures for times, status = glyph **plus** text (never colour alone).

---

## 4. Product tour — what exists, screen by screen

### 4.1 The resident app (iOS / Android / web, Expo)
**Four tabs** with icon + label (Home, Map, Community, Profile). **Alerts is a bell** at the top-right of every main screen (never a tab).

**Home** (top→bottom): greeting + name · **"Ask hop"** ink pill (opens the AI assistant) · **Tonight** (featured event with night-scene illustration, avatars "12 going", and the screen's one pink button) · **Right now** (illustrated live rows: utility status, transit detour, best parking lot with free spots) · **Explore** (horizontal strip of module shortcuts: Events, Buddy, Forum, Assistant, Audio tour, Wallet, Feedback, Visitor info, Smell, Safety) · **This week** (event rows led by dates).

**Map** — one shared map for everything (Section 6). **Community** — pill switcher: Events · Forum · Buddies · Wallet. **Profile** — account, language, theme, private pins, wallet.

### 4.2 The staff website (`apps/web`) — city employees work here
Residents use the app; **staff use the website** (a deliberate rule enforced by the API via an `X-Hub-Client` header — a staff account cannot even sign in inside the app).
- **Public/resident pages (11 views):** Home, Map, Alerts, Community, Parking, Assistant, Profile, Report, Info, Feedback (+ Dashboard for staff). Light/dark theme, EN/RO switch, accessible nav.
- **Staff dashboard (side-menu sections):**
  - **City:** Overview · **Analytics** (real survey data) · **Incident radar** (Gemini embeddings) · **Ask the data** (Gemini code execution) · **Alerts** (publish danger/works/outage zones) · **Scan a notice** (photo → Gemini → publish).
  - **Services:** **Parking cameras** (live feed + slot editor).
  - **Community:** **Moderation** queue.
  - **System:** **Security log** (Auth0 audit trail) · **Database** (live Tiger Cloud status).

---

## 5. The 13 modules (feature by feature)

> Architecture rule: each module is an **independent vertical slice** (screens + API routes + DB schema + seed data + AI tools). A broken module is switched to `draft` and disappears without touching the rest.

| ID | Module | Problem solved | What it does (real, implemented) | Sponsor link |
| --- | --- | --- | --- | --- |
| **M01** | **Events** | Thin "middle" culture scene | Discover / create / filter (category, neighbourhood, audience) / RSVP to micro-events (indie cinema, pottery jam, jazz session, generative-art showcase). Map layer + home card. **RSVP mints a Solana devnet ticket.** Server geocodes the venue (Nominatim) so events pin to the right place. Persists in Tiger Cloud. | Solana |
| **M02** | **Visitor Info** | Visitors can't find practical info | Curated bilingual (RO/EN) practical info: **112 emergency, transport tickets & how to pay, transport operator, airport/train arrival, tourist info centre, money/currency**. Category chips, RO/EN toggle, a **"check before you travel"** badge on facts that need verifying. Answered by the assistant. | Gemini |
| **M03** | **Safety** | Feeling unsafe at night | Resident reports about *places* (poor lighting, noise at night, abandoned building, feeling unsafe). **Privacy by design:** note ≤200 chars; phone numbers/plates/links stripped; UI rule "describe the place, not people". Area ranking, pins on map, **Gemini summary written from counts only (never notes)**, rate-limited. Also **Safe places** (hospitals, police, fire stations from OSM) and **danger/works perimeter zones** (e.g., a 650 m gas-leak perimeter near Pasajul Jiul). **Stored as a Tiger hypertable.** | Tiger Data, Gemini |
| **M04** | **Utilities** | Cuts you hear about too late | Feed of heat/hot-water/cold-water/power/gas outages (Colterm, Aquatim, Rețele Electrice Banat, Delgaz Grid) with **address/street matching** (diacritic-insensitive), severity, restore time, and **crowd "affected too" confirmations**. | Netrom, Auth0 |
| **M05** | **Transit** | Waiting at stops no tram serves | Live list of suspended/detoured/temporary lines (tram 5 suspended → **bus 5C**, lines 1/2 detoured, 4…), **"Is my stop served?"** check that recommends the replacement line. | Netrom |
| **M06** | **Smell** | Smells nobody records | **One-tap** smell report (type, intensity 1–5, area/location). Aggregated into live pins, **per-area bars and a 24-h chart**, plus **wind direction (Open-Meteo, hourly)** to suggest a likely **upwind source** direction. ~60 clearly-labelled demo reports. **Hypertable.** | Tiger Data |
| **M07** | **Buddy — "Cu Cine?"** ("With whom?") | No one to go to events with | Opt-in "looking for company" on any event; **interest-tag matching with compatibility %**, icebreaker prompts, quick replies, and **small group chat**. Persisted per user. | — |
| **M08** | **Forum** | No hyperlocal help place | Neighbourhood posts by category (lost pets, neighbourhood, help, buy/sell, announcements), photos, comments, **upvote toggle**, report-a-post, **moderator queue** (approve / delete). Groups (Fabric Creative Hub, UPT/UVT Students, Lost Pets Network, Bega Volunteers). | Gemini (tools) |
| **M09** | **Wallet** | Tamper-proof tickets | Per-user **Solana devnet wallet**: tickets with **QR (vector, scannable)**, **door-scanner check-in**, **on-chain POAP (proof-of-attendance) badges**, direct **Solana Explorer** links, duplicate-check-in guard. | **Solana** |
| **M10** | **Assistant** | Info is hard to ask for | **Gemini chat with function calling over every module**; **voice in (ElevenLabs Scribe) and out (ElevenLabs eleven_v4)**; photo-notice parsing; staff "Ask the data"; incident radar; narrated 5-stop audio tour. | **Gemini, ElevenLabs** |
| **M11** | **Feedback** | Proving we listen | In-app feedback + external Google-Form survey (RO/EN) synced live, **public changelog**, analytics by app version. | **Living Labs** |
| **M12** | **Dashboard** | City hall needs aggregates | Staff overview from continuous aggregates: parking demand, PM2.5/noise, community reports, Tiger Cloud status; **open-data export** (JSON/CSV). Website-only. | Tiger Data |
| **Parkie** | **Smart parking** *(our previous winning project, ported in)* | Circling for spots | 10 seeded lots with live occupancy colours (green/yellow/red/gray), nearest-lot ranking, **YOLO computer-vision camera agent** counting cars per slot, staff **lot editor**, SSE live stream, hourly analytics. | Tiger Data |

### 5.1 Notable module details worth showing on screen
- **Utilities card in plain words:** *"Hot water is off in your building until about 18:00."* + a three-step status (confirmed → in progress → expected back) + one primary action *"Tell me when it's back"*.
- **Safe city map:** safety pins cluster (same issue within 150 m — or 400–500 m for smoke/sewage/noise — becomes *one* pin with a count ring), and shared pins are **snapped to a privacy grid (30–100 m)** so exact spots aren't exposed.
- **Directions that care:** walking/bike/car routes (OSRM) that **re-route around danger zones**, warn about works zones, and list **help nearby** (hospital/police/fire) — only coordinates leave the device.

---

## 6. The shared city map (`@hub/map`)

A custom **map engine** (MapLibre GL running inside an iframe on web / WebView on phones, OpenStreetMap tiles) wrapped behind **one `<CityMap>` component** with identical props on web and native.

- **Layer API:** each module contributes a `MapLayer` through its manifest. Layers are switchable: Alerts, Safety, Smell, Events, Parking, "Your pins", Safe places.
- **Pin-kind registry:** one place defines how each pin looks and **who may see it** — `private-only` (home, work, favourite, note), `choice` (safety concern, lost/found, smell, meet-up), `public-only` (alerts, events, parking, hospitals/police/fire, transit).
- **Personal pins**, **clustering of duplicate reports**, **place search** (Nominatim, city-bounded, cached, 1 req/s policy-compliant), **zones with real-metre radius** (danger = red, works = amber), **demo-data labelling** ("Sample data for the demo.").
- **City-pluggable:** `setCity()` — the map, copy and bounds read from one `City` object (default Timișoara; centre 45.7537, 21.2272). *The architecture is built to be re-skinned for another city.*
- **13 neighbourhoods** with GPS centres: Cetate, Circumvalațiunii, Complex Studențesc, Iosefin, Elisabetin, Fabric, Soarelui, Girocului, Dâmbovița, Mehala, Calea Aradului, Calea Lipovei, Gara de Nord.

---

## 7. AI — the full inventory (Gemini, ElevenLabs, YOLO)

### 7.1 Google Gemini (via `@google/genai`)
Default model **`gemini-3.5-flash-lite`**, automatic fallback **`gemini-3.5-flash`** when Google returns "high demand" (503); embeddings with **`gemini-embedding-001`**. Key stays server-side only.

| # | Feature | Gemini capability used | Where |
| --- | --- | --- | --- |
| 1 | **City assistant** (resident chat) | **Function calling** over every module's `assistantTools` (events, forum, lost pets, buddy, utilities, transit, parking, smell, safety, safe places, visitor info, feedback summary, **my tickets**, **verify on Solana**, **search Solana docs**) — a dozen-plus tools; disabled modules simply contribute no tools. Replies in the user's language; **never invents** outages/lines/events; rewrites UTC to **Timișoara local time** before the model sees it. Knows *who is asking* (their own wallet). | `m10-assistant` |
| 2 | **Notice scanner** | **Vision (image input) + structured JSON output** → draft outage in our schema (provider, type, severity, official area names, streets with numbers, start/end in local time) with **warnings for anything unreadable**. Nothing saved until a human confirms. Refuses non-notices (a QR photo is rejected). | `/notice/parse`, website "Scan a notice" |
| 3 | **Ask the data** (staff) | One request mixing **our own function calling** with Gemini's built-in **code execution**: Gemini pulls real data (parking, PM2.5/noise/smell from Tiger continuous aggregates, resident reports, hourly wind), **writes & runs Python on Google's side and returns a matplotlib chart**. Lists every source and the Python it ran. | `analyst.ts` |
| 4 | **Incident radar** (staff) | **Embeddings** (`SEMANTIC_SIMILARITY`, 768-d) link forum posts and utility outages to smell/safety report groups (match threshold ≥ 0.83; true matches measured 0.88–0.93); **structured output** writes a RO/EN card per incident (title, summary, urgency, suggested next step) and can *un-link* unrelated text. | `incidents.ts` |
| 5 | **Safety area summaries** | Generated from **counts only, never residents' notes**; cached 10 min; cautious wording ("unverified resident reports, not crime statistics"). | `m03-safety/summary.ts` |
| 6 | **Utility ingestion worker** (Netrom "glue") | Extracts structured outages from raw Romanian press releases; **regex/heuristic fallback** when offline or without a key. | `services/workers` |

**Verified live (from the team's own tests):** 6/6 assistant answers correct on times (08:00–16:00, 09:00–14:00, no UTC drift); 4 analyst questions answered from live Tiger data in 10–25 s; incident radar correctly linked *"Miroase a plastic ars"* → 25 burnt-rubber reports in Fabric (0.88) and *"Dark underpass near the station"* → poor-lighting reports at Gara de Nord (0.93).

### 7.2 MCP (Model Context Protocol) — Gemini ↔ Solana
A **minimal MCP Streamable-HTTP client written from scratch** (no SDK; JSON or SSE answers; allow-listed tools; timeouts; caching; read-only) connects the assistant to **Solana's official MCP servers**:
- **Solana Explorer MCP** (`inspect_entity`, devnet) → *"Is my ticket real?"* → checks the transaction live, decodes the ticket memo, confirms organizer signature, compares with the app's record, and **honestly reports mismatches / "not found"**.
- **Solana Developer MCP** (`Solana_Documentation_Search`) → answers *"What is a POAP / devnet / a transaction fee?"* from the official docs, with the link, instead of from model memory.

### 7.3 ElevenLabs (voice)
- **Text-to-speech:** model **`eleven_v4`**, **one voice per language picked by ear**: Romanian **"Corina Ioana — Clear, Friendly and Calm"**, English **"Jessica"**; 128 kbps; markdown stripped; ≤ 800 spoken chars cut at a sentence end; in-memory cache (cached answers return in ~0.2 s; fresh ~2–3 s); language auto-guessed from text.
- **Speech-to-text:** **`scribe_v3`** (tap-to-record ≤ 30 s → transcript → assistant).
- **Narrated walking tour:** 5 stops in RO + EN — **Piața Victoriei & the Opera** (1989), **Metropolitan Cathedral**, **Piața Libertății** (first mainland-European city with electric street lighting, 1884), **Piața Unirii** (baroque square, Holy Trinity plague statue), **Bastionul Theresia**.
- Graceful degradation: no key → "voice not configured", text chat keeps working. Quota handled (401/429 → clear 503).

### 7.4 Computer vision (Parkie)
**YOLO11m** (Ultralytics, vehicle classes: car, motorcycle, bus, truck, bicycle) + **OpenCV/NumPy polygon geometry**: inference every **5 s**, a detection counts for a slot when enough sample points fall inside the slot polygon, **5-frame majority vote** smoothing, report to the API every **15 s** (`POST /v1/m/parkie/detections`). Live MJPEG stream to the staff dashboard; slots drawn **by clicking 4 corners per slot** on a captured frame (drag to adjust, undo, save) and picked up without restart.

---

## 8. Data layer — Tiger Data (TimescaleDB on Tiger Cloud)

PostgreSQL 16 + PostGIS + **TimescaleDB 2.32.0** on **Tiger Cloud**, with **automatic in-memory fallback** (every module works without a database, and dashboards label themselves "simulated" rather than pretending).

- **5 hypertables:** `parking_detection_events`, `city_metric_events`, `utility_outage_metrics`, `m03_safety.reports`, `m06_smell.reports`.
- **4 continuous aggregates:** `parking_hourly_stats`, `city_metrics_hourly_stats`, `m03_safety.reports_hourly`, `m06_smell.reports_hourly` (15-min refresh policy on the core two; **real-time aggregates** `materialized_only = false`).
- **Native compression** (segmentby lot / metric+area; 7-day policy on report tables) and **90-day retention policies**.
- Volume loaded for the demo: **51,600 parking detection events** and **5,208 city metric events**; aggregates with thousands of rollups.
- Time-zone-correct bucketing: `time_bucket(…, 'Europe/Bucharest')`.
- **Per-module schemas** with their own migrations (`db/core` + `db/modules/<module>`), one schema per module, **no cross-module foreign keys** (only references into core by id).
- **Open data back to the city:** `GET /v1/core/open-data/export` (JSON/CSV) of anonymised aggregates; `GET /v1/core/tiger/status` shows live hypertable/aggregate/compression facts.
- Also stored in Tiger: users, wallets, forum, buddy chats, events, personal pins, survey answers (40), **Auth0 security audit events**.
- **Honest number:** measured compression in the live dashboard is **~74.5%** (an earlier hand-typed "94.8%" was replaced with the real figure — see Section 17).

---

## 9. Identity & security — Auth0

- **Sign-in:** real **Auth0 Universal Login** — Google sign-in, passwordless email, registration. Web uses the Auth0 SPA SDK; phones use a **WebView modal** (`Auth0Modal.native.tsx`). JWTs verified server-side with **`jose` against the tenant's JWKS**. Profile sync (name/email/picture) into `core_users`.
- **RBAC roles:** `resident · organizer · moderator · admin`.
- **Step-up MFA (RFC 9470 pattern):** staff actions that affect the whole city (publishing an outage or a detour, publishing from the notice scanner) require an **`amr` claim of mfa/otp/webauthn**; otherwise the API returns a structured **403 `mfa_required`** and the website shows **"Verify with passkey"**. Residents are never nagged with MFA for browsing.
- **Auth0 for AI Agents:** the autonomous ingestion agent runs as a **Machine-to-Machine principal** (`tier_3_ai_agent_m2m`), no human MFA, restricted scopes, fully audited.
- **Adaptive location shield:** login from an unrecognised city/country triggers a **push + a transactional warning email** with one-click **"Confirm trusted location"** or **"Emergency block session & enforce MFA"**.
- **Audit trail:** every decision (`ALLOW`, `CHALLENGE_MFA_REQUIRED`, `DENIED_INSUFFICIENT_ROLE`, `CHALLENGE_NEW_LOCATION_ALERT`) is logged in memory **and persisted to Tiger Cloud (`core_auth_audit_events`)**; visible to moderators/admins in the **Security log**.
- **Post-Login Action** (`infra/auth0/actions/step-up-mfa-and-claims.js`) adds role/permission claims and step-up.
- **7 judge test personas** (dev tokens, zero-network bypass for demos; **disabled when `NODE_ENV=production`** — only real Auth0 tokens then): `dev_resident` (Andrei), `dev_organizer` (Ioana), `dev_moderator_no_mfa`, `dev_moderator_mfa`, `dev_admin_no_mfa`, `dev_admin_mfa`, `dev_ai_agent`.
- **Staff = website only:** the API enforces it by client type.
- Interactive judge demo: `npm run demo:auth0`.

---

## 10. Web3 — Solana (Best Use of Solana)

- **Network:** Solana **devnet**. A funded **organizer wallet** signs ticket/POAP transactions (secret key in env only; **old key in git history must be treated as public**).
- **Ticket mint on RSVP:** a real devnet transaction with an **SPL Memo** carrying `UNIHACK-TIMISOARA:TICKET|id=…|event=…|title=…` → tamper-evident, verifiable by anyone.
- **QR ticket:** spec-compliant **vector QR (`toqr`, Level M SVG)** readable by phone cameras and the built-in scanner, with Solana mark in the centre.
- **Door check-in:** staff scanner verifies the signature, blocks duplicate check-ins, and **issues an on-chain POAP badge** with an Explorer link.
- **Zero-polyfill client:** pure HTTP JSON-RPC `fetch` (no `@solana/web3.js` crash on React Native Web).
- **Per-user wallets** shared between app and website (`core/wallets.ts` → `m09_wallet_items`).
- **Pitch line:** sub-second finality and near-zero fees (a fraction of a cent) make tamper-proof ticketing and proof-of-attendance practical for a whole city; **the AI assistant can independently verify a ticket on-chain through Solana's own MCP servers** (Section 7.2) — "trust, but verify, live".
- Status endpoint: `GET /v1/m/solana/status` (live slot, balance, faucet link).

---

## 11. Sponsor side-challenges — evidence map

*(Judging notes: prizes per README; "Evidence" = where a judge can see it; "Honest status" = what to say.)*

| Challenge | Prize (per README) | What judges want | How hop answers it (evidence) | Honest status |
| --- | --- | --- | --- | --- |
| **Netrom — Glue It Together** | — | APIs + cloud + AI + tools mashups, workflow automation | **Ingestion workers** (`services/workers`) glue **Gemini + Colterm/Aquatim press releases + STPT roadworks + environmental sensors + Auth0 M2M + Tiger Cloud + notifications** on a cron orchestrator (`--once` for CI). Also: **photo → Gemini → Auth0 MFA → publish → ElevenLabs voice answer** is a 5-vendor chain. Open-Meteo wind + Nominatim + OSRM + OSM tiles + MCP. | Workers' Colterm path calls a retired Gemini 1.5 model, so it currently uses its keyword fallback; the **vision scanner and assistant** use Gemini 3.5. Say "glue" via the end-to-end chain. |
| **Solana — Best Use of Solana** | Unruggable hardware wallets | Fast, scalable, real-world payments/identity/social | Tickets, QR door check-in, **POAP**, per-user wallet, Explorer MCP verification (Section 10). | **Devnet** (say so). |
| **Vest Ventures — Living Labs Award** | — | Validate with real users, iterate, show measurable improvement | In-app feedback, Google-Form survey (RO/EN) live-synced to Tiger, public changelog, analytics **by app version**, Living-Labs log with feedback → change entries (**LL-01…LL-05**). Survey: **39 responses at v0 (40 later)**, avg install intent **4.26/5**, **32 of 39 answered 4–5**; **parking = top pick (14 of 39)**, 23 of 39 say it hurts a lot. Survey QR code at `docs/living-labs/survey-qr.png`. | Pitch evidence of "shipped change → measured result" is partial; be honest about what's planned vs shipped. |
| **ElevenLabs — Best Use of ElevenLabs** | Wireless earbuds | Natural, expressive AI voice | Speak a question (Scribe v3) → answer read aloud in a **native Romanian voice** (eleven_v4); narrated 5-stop tour; per-language voices picked by ear. | Voice is **web-first**; phone mic/speaker needs `expo-audio` wiring (plugin present). |
| **Google Gemini — Best Use of Gemini API** | MLH swag kits | "Whoa" AI app | Section 7.1: function-calling assistant, **vision notice scanner**, **code-execution analyst**, **embeddings incident radar**, structured output, MCP. | — |
| **Auth0 — Best Use of Auth0** | Wireless headphones (per member) | Social/passwordless, MFA, RBAC, Auth0 for AI Agents | Section 9: real Universal Login, roles, **step-up MFA**, **AI-agent M2M**, adaptive location alerts, audit log in Tiger. | — |
| **Tiger Data — Best Use of Tiger Data** | Stream Deck Mini | Postgres for real-time/time-series, continuous aggregates, compression | Section 8: 5 hypertables, 4 continuous aggregates, compression, retention, open-data export, live dashboards, "Ask the data". | Report real compression (~74.5%). |

---

## 12. The demo (rehearsed — ~3 minutes) + exact click path

**Headline:** *"From a notice on the door to a spoken answer."* Shows Gemini (vision + structured output + function calling), ElevenLabs (speech in/out), Auth0 (staff MFA), Tiger Data, and Solana.

### Setup (10 min before)
1. Print/show `docs/demo/notice-aquatim.png` (fictional notice stamped **"ANUNȚ FICTIV"**). Second notice: `docs/demo/notice-electrica.png`.
2. `npm start` (API on :8000, with `DATABASE_URL` for Tiger Cloud). `npm run dev:web` → `http://localhost:3000` (staff view). App: PowerShell → `$env:NODE_OPTIONS='--max-old-space-size=6144'`, `cd apps/app`, `npx expo start --web` → `http://localhost:8081` (resident view).
3. In the app: **Continue with email** (e.g. `ana@example.com`, non-staff). Allow the microphone once.

### Run of show
| # | Say (RO master line) | Do | What the audience sees |
| --- | --- | --- | --- |
| 1 | „Pe ușa blocului apare un anunț de la Aquatim. Majoritatea oamenilor îl ratează." | Hold up the printed notice | The problem, physically |
| 2 | „Un angajat al primăriei îl fotografiază." | Website → Log in → City admin → Dashboard → **Scan a notice** → photo | In ~2 s Gemini fills a draft: **Aquatim, cold water, planned works, Iosefin, 3 streets with numbers, 18.11 08:00–16:00** |
| 3 | „Gemini nu ghicește: ce nu poate citi apare ca avertisment, iar omul verifică." | Point at editable fields / "Check these" | Human-in-the-loop |
| 4 | „Dar nu oricine poate trimite o alertă pentru tot orașul." | Point at **Second check done for this session** | Auth0 step-up MFA; staff can't even sign in on the app |
| 5 | „Angajatul confirmă." | **Publish alert** | "Published… live for residents." |
| 6 | „Și locuitorul o vede imediat." | App → Home → Utilities | The Iosefin water stop card appears |
| 7 | „Și poate întreba, cu vocea." | App → Assistant → "Read answers aloud" → 🎤 → *„Am apă miercuri pe strada Văcărescu?"* | Transcribed, Gemini calls the outage tool, answers **"Miercuri, 18 noiembrie… între 08:00 și 16:00"**, spoken by Corina Ioana |
| 8 *(bonus)* | „Biletele sunt pe Solana, iar asistentul întreabă Solana direct." | *„Ce bilete am?"* then *„Biletul meu la jazz e real? Verifică-l pe Solana."* | Andrei's tickets (JazzTM, Plai) → **"real, confirmed on Solana devnet, signed by the organizer, data matches"** + Explorer link |
| 9 *(bonus, staff)* | „Și primăria vede ce spun oamenii." | Dashboard → Analytics → Incident radar → Ask the data: *„Which neighbourhood had the most smell reports this week?"* | Real survey figures; Gemini-linked incidents; Gemini-run analysis + chart |
| 10 *(bonus)* | „Datele stau în Tiger Data." | Dashboard → **Database** | "Live on Tiger Cloud", compression, 5 hypertables, PM2.5/noise from the hourly aggregate |

**Closing sentence:** „O poză devine o alertă oficială în 10 secunde, iar orice locuitor o poate afla vorbind cu aplicația."

**If something goes wrong (say these on camera if needed, they're honest):** Gemini 503 "busy" → wait 5 s and retry; mic blocked → type the question (still read aloud); upload fails → use the PNG from the file picker; "second check needed" → click **Verify with passkey**; the database says "simulated" → reload the Database page. Don't ask "is my jazz ticket real?" unless tickets have been re-minted (the live check is honest and will report a mismatch).

### Secondary demo threads (for the 90 s / deck b-roll)
- **Parking:** Home "best lot" → Parking page → live camera with slot overlay (mint = free, apricot = occupied) → staff slot editor.
- **Map:** layers on/off (Alerts 13 · Safety 71 · Smell 34 · Events · Parking), tap a safety pin cluster, **route that avoids a danger zone and lists the nearest hospital/police**.
- **Events + Solana:** tap RSVP → ticket mints → QR → door scanner → POAP.
- **Cu Cine?:** matching % → icebreaker → group chat with an Erasmus student.
- **Forum + moderation:** "Lost orange tabby in Fabric" → report spoofed ticket resale post → moderator queue.

---

## 13. Technology inventory (everything used)

### 13.1 Languages & runtimes
TypeScript (primary), JavaScript/ESM, Python 3.10+, SQL, HTML/CSS, Google Apps Script. **Node 22+** with **`--experimental-strip-types`** (run TypeScript natively, zero build step) for the API/workers/scripts.

### 13.2 Client
- **Expo SDK 58**, **React 19.3**, **React Native 0.88**, **Expo Router** (file-based routes; typed routes), **react-native-web** → iOS, Android and web from one codebase.
- UI: own design system **`@hub/ui`** (Button ×3 variants/2 sizes, Row compound components, Section, Chip, Segmented, Sheet, TabBar (floating glass), AskBar, Avatar, Timeline, SpringPressable, 13 module illustrations, tokens), **Phosphor icons**, **expo-blur** (glass), **react-native-svg**, **Nunito + Figtree** via Expo Google Fonts.
- Native: `expo-audio` (mic), `expo-location`, `expo-file-system`, `expo-font`, `react-native-webview` (map + Auth0 modal), `react-native-safe-area-context`, `react-native-screens`, `async-storage`, `toqr` (QR).
- A custom **Babel plugin** (`babel-plugin-live-theme.js`) for live theming; **Metro** monorepo config.
- **Website:** dependency-free vanilla ES-module SPA (hash router, `server.mjs`), light/dark theme, hand-built SVG charts (donut, bars), dictionary translator (RO/EN) with auto-detect.

### 13.3 Server
- **Zero-dependency Node HTTP server** (`server.ts`, port 8000 — used by Docker/CI/tests) and a **Hono** router app (`index.ts`, `tsx watch`) sharing the same module routers; modules mounted at `/v1/m/<module>` with **per-module try/catch fault isolation**.
- **`pg`** (Postgres/Tiger), **`jose`** (JWT/JWKS), **`zod`** (contracts; a shim avoids a bundler issue), **`@google/genai`**, **`dotenv`**, **`@hono/node-server`**.
- Cross-cutting: **feature flags** (`draft/beta/live` + min role), **event bus** + `notify()` outbox, **fixed-window rate limiter** (per client, `Retry-After`; safety 5/10 min, smell 10/10 min, Gemini endpoints 10–30/10 min), **diacritic-insensitive place matching**, **avatar generator** (deterministic seeded SVG illustrations, nothing loaded from outside), **photo uploads** (stored on local disk), **geocoding**, **routing**, **safe places**, **area alerts**.

### 13.4 Packages (monorepo, npm workspaces)
`@hub/contracts` (shared zod schemas/types/seeds) · `@hub/ui` · `@hub/map` · `@hub/solana` · `@hub/api-client` (typed fetch client + hub realtime) · `@hub/config`.

### 13.5 Services
`services/api` · `services/workers` (Netrom glue) · `services/parkie-vision` (Python CV agent + live feed server) · `services/vision` (earlier Parkie vision copy: capture/select slots).

### 13.6 Data & external APIs
Tiger Cloud (TimescaleDB 2.32, PostGIS) · **OpenStreetMap** (tiles, **Nominatim** geocoding, **OSRM** routing, safe-place data) · **Open-Meteo** (wind, 10-min cache) · Google Forms/Sheets/Apps Script (survey) · Solana devnet JSON-RPC + SPL Memo · Solana MCP servers · ElevenLabs API · Gemini API · Auth0.

### 13.7 DevOps & quality
Docker + docker-compose (healthchecks, persistent uploads volume) · **GitHub Actions CI** (install → barrel-export check → boot API → run test suite) · CODEOWNERS per-folder reviews · ngrok tunnels for phone demos · scripts: `verify-all`, `test-all-13-modules`, `test-e2e-auth`, `test-api-security`, `test-api-client`, `test-solana-real`, `test_p2.py`, `test_p2_full.py`, `test_workers.py`, `test_parkie.py`, `demo_auth0.py`, `check-deps`, `i18n-audit(-web)`, seeders (`seed-users`, `seed-avatars`, `seed-demo-activity`, `seed_timescale`, `migrate_tiger`). Typecheck clean (0 errors) across api, app, ui, map, workers, contracts, solana.

### 13.8 Architecture principles (say these in the "how" slide)
1. **Vertical-slice modules** — screens, routes, DB schema, jobs, mock data and AI tools in the module's own folder; no module imports another.
2. **Frozen core** — auth, users, saved places, notifications, feature flags, registry, UI kit, shared types.
3. **Contracts first** (`@hub/contracts`) → four people worked in parallel with no blocking.
4. **Mock-first** — every module ships seed data & a mock adapter; works with no external source.
5. **Fault isolation** — API loader wraps each module; the app wraps each in an error boundary; a failing module is flipped to `draft` and disappears.
6. **Extension points** — Home cards, Map layers, Alert types, assistant tools, Profile settings, via each module's manifest (no one edits shared screens).
7. **Pre-registered stubs** — all 13 module folders and registry lines created in hour 1 → near-zero merge conflicts.

---

## 14. Impact, evidence & traction (numbers the video can show)

| Metric | Value | Source |
| --- | --- | --- |
| Build time | 48 h hackathon; first→last commit ≈ 48 h | git |
| Code | ~264 commits · ~498 files · ~40.9k LOC · 13 modules · 4 builders | git/repo |
| Survey (Living Labs) | **39 responses at v0 (40 later)**; 25 students, 7 residents, 4 visitors, 1 international student, 1 newcomer; **30 of 39 aged 18–24**; 18 from Timișoara, 18 elsewhere in Romania, 3 abroad | `docs/living-labs/living-labs-log.md` |
| Install intent | **avg 4.26 / 5**; 18 × "5", 14 × "4" → **32 of 39 would likely install** | same |
| Top pick | **Parking: 14 of 39** (events 7, safety 6; Timișoara-only avg problem score 3.94) | same |
| AI latency | Notice → structured draft ≈ **2–2.5 s**; spoken answer ≈ **2–3 s** (cached 0.2 s) | P4 progress |
| Data scale | **51,600** parking events · **5,208** sensor readings · **5** hypertables · **4** continuous aggregates | Tiger tests |
| Security | 7 test personas · 4 audit outcomes · step-up MFA on staff publishing | auth code |
| Map demo data | Alerts 13 · Safety ~71 · Smell ~34 pins (clearly labelled demo where applicable) | P4 health check |
| Accessibility | Ink on bg 16.6:1; 44 px targets; reduced motion/transparency | brand spec |

*(If the team updates survey totals or ratings before the pitch, replace the numbers here.)*

---

## 15. Video & presentation production plan

### 15.1 Cuts
| Cut | Length | Use |
| --- | --- | --- |
| **Hero** | 3:00 | Judges' screen / website / LinkedIn |
| **Teaser** | 1:30 | Social / sponsor tables |
| **Sting** | 0:30 | Story / intro bumper |

### 15.2 Visual language (from the brand)
White pages, lots of air, hairline lists, **one pink button** per frame, flat illustrations (no outlines), glass only on floating bars, ink text. Subtle springy micro-motions. Use **real screen-recordings** inside phone frames, with illustrated module marks as chapter icons. Map shots: MapLibre with OSM styling. Data shots: simple line/bar charts in the module hues. **Never** use stock "smart city" blue-glow clichés.

### 15.3 Music & sound
Warm, light, rhythmic, optimistic — acoustic-electronic, mid tempo (~100 bpm). A soft *tick/pop* on each module appearing (matches the "pop in" motion). Voice-over: calm and friendly. For the demo, **use the real ElevenLabs Romanian voice output** as a sound moment.

### 15.4 3-minute hero storyboard (scene · time · visual · voice-over · on-screen text)

| # | Time | Visual | Voice-over (EN master) | On-screen text |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:08 | Close-up: paper notice taped to a door, a hand walks past it. Cut to a tram stop where people wait for a tram that isn't coming. | "In Timișoara, the city's most important news is taped to a door." | **ANUNȚ** · *Tram 5 isn't running.* |
| 2 | 0:08–0:22 | Quick montage of 6 real problems (Colterm 50,000 homes, tram 5 / 5C, parking circling, Gara de Nord at night, burnt-rubber smell, a student alone at a concert) as flat illustrations in module colours. | "Heat cuts. Detoured trams. No parking. Smells nobody records. Events nobody sees. The information exists — it's just scattered." | 9 problems → **one place** |
| 3 | 0:22–0:32 | Logo reveal (arch window on pink tile) → wordmark **hop**. Home screen scrolls. | "Meet hop: everything in Timișoara, one tap away." | **hop** · *Tot Timișoara-ul, la un tap distanță.* |
| 4 | 0:32–0:50 | Home screen: *Right now* rows (utility status, transit detour, free parking spots), live dot pulsing. | "Your building's water. Your tram. A free parking spot. Live, in plain words — and calm when it matters." | *"Hot water is off until about 18:00."* |
| 5 | 0:50–1:20 | **THE DEMO.** Printed notice → website Scan a notice → Gemini draft appears → "Second check done" (Auth0) → Publish. | "A city employee photographs a notice. Gemini reads it in two seconds. Only staff with a second check can publish — Auth0 makes sure of it." | *Gemini vision · Auth0 MFA* · timer **2.4 s** |
| 6 | 1:20–1:45 | Phone: Utilities card appears → Assistant → mic tap → Romanian question → spoken answer (play real audio) with wave animation. | „Am apă miercuri pe strada Văcărescu?" — "And any resident can just ask, out loud. In Romanian. And hop answers back." | *ElevenLabs · Gemini function calling* |
| 7 | 1:45–2:05 | Map montage: layers toggling, safety cluster, route avoiding a red danger zone listing nearest hospital, smell pins with wind arrow. | "One map for the whole city: alerts, safety, smells, events, parking — and routes that avoid danger zones. Reports are privacy-snapped and clustered." | *Reports → one pin · privacy grid* |
| 8 | 2:05–2:20 | Parkie: camera feed with mint/apricot slot overlay, lot colours, staff slot editor. | "Parking comes from a YOLO computer-vision agent counting cars slot by slot — our previous winning project, now a module." | *YOLO11 · 5 s inference* |
| 9 | 2:20–2:35 | Events → RSVP → ticket → QR → door scan → POAP → Explorer link; assistant verifying via Solana MCP. | "Tickets are minted on Solana and checked by the assistant through Solana's own servers. Tamper-proof, fractions of a cent." | *Solana devnet · MCP* |
| 10 | 2:35–2:45 | Staff dashboard: Incident radar cards, Ask-the-data chart, Database "Live on Tiger Cloud". | "City hall sees what people report — grouped by Gemini embeddings, analysed with code execution, stored on Tiger Data." | *Tiger Cloud · 5 hypertables · 4 aggregates* |
| 11 | 2:45–2:55 | Living Labs: survey QR, **39 responses → 4.26/5**, "parking #1" bar chart. | "We asked real people. Parking was their #1 problem — so it's on the Home screen." | *39 voices · 4.26 / 5* |
| 12 | 2:55–3:00 | End card on pink: logo, tagline RO/EN, team "UniHackers · UNIHACK 2026 · built in 48 h · 13 modules · `:3`". | „O poză devine o alertă oficială în 10 secunde." | **hop** · *Everything in Timișoara, one tap away.* |

### 15.5 90-second teaser (shots to keep)
Scenes 1 → 3 → 5 → 6 → 7 (fast) → 9 → 12.

### 15.6 30-second sting
Notice on a door → **Gemini draft (2.4 s)** → **spoken Romanian answer** → logo + tagline.

### 15.7 Slide deck outline (14–16 slides)
1. Title (logo, tagline, event, team)
2. The problem (9 problems, 3 hero examples)
3. The insight ("the information exists; it's scattered")
4. The solution (one app + one staff website)
5. Demo (embedded video / live)
6. How the AI works (Gemini vision → structured → function calling → embeddings → code execution; ElevenLabs; MCP)
7. Trust & security (Auth0 roles, step-up MFA, AI-agent M2M, audit, privacy rules)
8. The map (layers, privacy snapping, danger-aware routing)
9. Parkie (YOLO11, slots, lot editor)
10. Community + Solana (events → tickets → POAP; Cu Cine?; forum + moderation)
11. Data (Tiger Cloud: hypertables, aggregates, compression, open data back to the city)
12. Architecture (modular monorepo, fault isolation, flags, contracts)
13. Living Labs evidence (survey numbers, changelog)
14. Sponsor challenges — evidence table (Section 11)
15. Roadmap & vision (Section 16)
16. Close + team + call to action

### 15.8 Delivery notes for the live pitch (judges)
- Open with the door-notice moment; **let the Romanian voice play un-narrated for 4 seconds**.
- Keep the architecture slide to **one diagram** and one sentence: *"13 modules, each independent: if one breaks, it's switched to draft and the rest keeps running — that's the point."*
- Hand judges the **Auth0 personas** and the QR code to the survey.

---

## 16. Vision & roadmap (mark as "next" — not shipped)

**From the team's own idea list (README §8):** "My building" page (heat/water/power + nearest working stops + nearby events/reports in one screen) · **Walk-me-home** (share live route, better-lit routes from safety reports, voice check-ins) · **Outage helpers** (where to shower/warm up; neighbours check on elderly) · **Civic issue tracker** (potholes, broken lights with photo & status, exported to city hall) · **Accessibility map** (step-free routes, broken lifts) · **Neighbourhood audio digest** (2-min AI-written, ElevenLabs-voiced weekly summary) · **Live translation** of forum/event text · **Lost-pet photo matching** (Gemini vision) · **Newcomer guides** · **Neighbourhood polls & petitions** · **Civic rewards** (points redeemable at local businesses, optionally Solana tokens) · **Bike/micromobility** next to transit · **Open data back to the city** (already started: export endpoint).

**Technical next steps:** Expo push notifications end-to-end (backend `notify()` + event bus are ready; client wiring pending) · phone mic/speaker (`expo-audio` is installed; playback path to finish) · collapse the two API entry points into one · Solana mainnet-grade key management (move to a new key) · multi-city: `setCity()` already exists, so a second city is mostly data.

**Proposed go-to-market (a suggestion, not implemented):** pilot with Primăria Timișoara / Colterm / Aquatim / STPT as data partners → student unions (UPT/UVT) for distribution → B2G subscription for the staff dashboard (incident radar, analytics, open-data) → white-label for other Romanian cities.

---

## 17. Honesty guardrails — what the video must NOT claim

This list protects credibility with judges. The generator should treat these as hard rules.

1. **Solana is devnet.** Say "Solana devnet" every time money-like words appear. No mainnet claims. The old organizer key is in git history — treat as public.
2. **Demo data is labelled.** Smell/safety pins and some forum/event content are sample/seed data (`isDemo` flags, "Sample data for the demo."). Parking occupancy in the demo comes from a looped demo video through the real CV agent. Don't present them as live city-wide statistics.
3. **Never say "crime statistics" or "dangerous area".** Safety = *unverified resident reports about places*; the Gemini summary uses counts only.
4. **Tiger compression:** earlier docs say "94.8%"; the live dashboard measures **~74.5%**. Use the measured figure (or say "compression policies active" without a number).
5. **Gemini model names:** the docs mention "Gemini 1.5 Flash"; the live code uses **Gemini 3.5 Flash-Lite (fallback 3.5 Flash)** and **gemini-embedding-001**. The Colterm *worker* still points at a retired 1.5 model and falls back to keyword extraction — don't claim that specific worker uses live Gemini.
6. **Push notifications are not live on phones.** The in-app notification centre/event bus exists; Expo push client wiring is pending. Say "alerts", not "push notifications" (except the Auth0 location-shield *simulation*, which is described as push + email generation).
7. **Voice is web-first.** Mic/speaker buttons are hidden on phones until the `expo-audio` path ships. Demo voice on the web app.
8. **Do not mention Vultr or Entire anywhere.** The team did not use them in the end, even though they appear in the original README plan and in `infra/vultr/`. Do not list them as challenges, logos or tech.
10. **Never show secrets.** `.env` contains Gemini/ElevenLabs/Solana/Tiger/Auth0 credentials — blur or avoid terminals/env files in screen recordings.
11. **Survey numbers:** v0 = 39 responses (40 synced later). No emails are kept in the repo; don't show raw answer rows.
12. **Notices are fictional.** The sample notices are stamped **"ANUNȚ FICTIV"** — keep that visible. Utility providers named (Colterm, Aquatim, Rețele Electrice Banat, STPT) are real organisations: do not imply endorsement or official integration; say "inspired by their public notices".
13. **Real events from the README** (Colterm 2021 gas cut, Gara de Nord 2025 protest, 2022 smell episode, 2026 roadworks) come from the team's research notes — cite them as context, not as hop's own data.
14. **Names:** the README originally used placeholders `[PRODUCT_NAME]`; the final name is **hop**.

---

## 18. Likely judge Q&A (prepared answers)

| Question | Answer |
| --- | --- |
| *Why one app instead of many?* | Residents shouldn't need nine accounts for one city. Modules stay independent, so it's one place without one point of failure. |
| *How do you stop fake alerts?* | City-wide alerts need staff with **step-up MFA** (Auth0); Gemini drafts, a human confirms; resident reports are rate-limited, privacy-scrubbed and clearly labelled; community confirmations raise confidence. |
| *What if Gemini is wrong?* | It never publishes: unclear values become **warnings and required fields**; the photo stays beside the draft; the assistant is instructed to say "I don't know" and never invent outages. |
| *Privacy?* | No exact spots for shared pins (30–100 m snap), contact details/plates stripped from notes, safety summaries use counts not text, location sent rounded and unstored, routing sends only coordinates, keys server-side. |
| *Why Solana for tickets?* | Cheap, fast, publicly verifiable; POAP turns attendance into portable proof; the assistant can verify tickets live via Solana's official MCP servers. |
| *Why Tiger Data?* | Report and sensor data are time-series; continuous aggregates give live dashboards; compression + retention control cost; one Postgres for relational + time-series. |
| *Does it scale to other cities?* | Yes by design: `setCity()`, per-module schemas/flags, contract-first APIs; adding a city is mostly data sources. |
| *What happens if a module breaks?* | Fault isolation: set to `draft` → it disappears; the rest keeps working (the API loader wraps each module in try/catch). |
| *What's real vs mocked?* | See Section 17. We label sample data in the UI and say "simulated" in dashboards rather than faking live values. |
| *How did four people build 13 modules in 48 h?* | Contracts-first, frozen core after hour 3, pre-registered stubs, mock-first adapters, CODEOWNERS, per-module branches. |
| *Business model?* | Free for residents; B2G subscription for the staff dashboard and open-data tools; partnerships with utilities/transit; white-label for other cities. (Proposed.) |

---

## 19. Glossary (for correct pronunciation/subtitles)

- **Timișoara** — tee-mee-SHWAH-rah. **Colterm** (district heating), **Aquatim** (water), **STPT** (public transport), **Rețele Electrice Banat** (power distribution).
- **Cu Cine?** — "With whom?" (buddy finder). **Parkie** — smart-parking module. **hop** — the product ("hop în oraș" = hop into the city).
- **ANUNȚ FICTIV** — "fictional notice". **Primăria** — city hall. **POAP** — proof of attendance protocol. **MFA / step-up** — second authentication factor for sensitive actions.
- **Neighbourhoods:** Fabric, Iosefin, Elisabetin, Cetate, Mehala, Circumvalațiunii, Complex Studențesc, Gara de Nord, Girocului, Soarelui, Dâmbovița, Calea Aradului, Calea Lipovei.
- **Landmarks (tour):** Piața Victoriei, Opera, Catedrala Mitropolitană, Piața Libertății, Piața Unirii, Bastionul Theresia.
- **Venues in seed events:** Faber, Scârț Loc Lejer, D'arc pe Mal, Kunsthalle Bega.

---

## 20. Asset & source index (where to find real footage and facts)

| Need | Where |
| --- | --- |
| Logo / brand board / tokens | `docs/brand/logo.svg`, `docs/brand/brand-board.html`, `docs/brand/design-tokens.json`, `docs/brand/design-tokens.css`, `docs/brand/identity.md` |
| Demo script (3-min rehearsed) | `docs/demo/p4-demo-script.md` |
| Sample notices (fictional) | `docs/demo/notice-aquatim.png`, `docs/demo/notice-electrica.png` |
| Survey, log, QR | `docs/living-labs/` (`survey.md`, `living-labs-log.md`, `survey-qr.png`, `feedback-sheet.gs`) |
| Audio tour text | `docs/voice/tour.md` |
| Visitor-info content | `docs/visitor-info/content.md` |
| Full requirements & endpoint list | `REQUIREMENTS.md`, `README.md` (original build plan), `TODO_P2.md`, `TODO_P3.md`, `P3_SUMMARY.txt`, `docs/p4-progress.md` (very detailed change log + known issues) |
| Auth0 docs | `infra/auth0/README.md` |
| Parkie vision | `services/parkie-vision/README.md` |
| Contracts & seeds | `packages/contracts/src/**` (incl. seeds for Parkie lots, transit lines, utilities outages) |
| Test/verification scripts | `scripts/**`, `.github/workflows/ci.yml` |

### Key API surface (for slide "it's a real platform")
`/health` · `/v1/core/{areas,flags,user/me,user/places,upload/signed-url,auth/*,tiger/*,analytics/*,metrics/ingest,open-data/export,route}` · `/v1/m/utilities/{outages,check-address}` · `/v1/m/transit/{lines,detours,check-stop}` · `/v1/m/parkie/{lots,lots/colors,nearest,detections,stream,analytics/hourly}` · `/v1/m/events` (+rsvp) · `/v1/m/buddy` (+match, chats) · `/v1/m/forum` (+comments, upvote, report, moderation) · `/v1/m/wallet` & `/v1/m/solana/{status,tickets/mint,poap/mint}` · `/v1/m/smell/*` · `/v1/m/safety/*` · `/v1/m/visitor-info/*` · `/v1/m/feedback/*` · `/v1/m/assistant/{chat,tts,stt,voice,tour,notice/parse,notice/confirm,analyst,incidents}` · `/v1/m/dashboard/overview`.

---

## 21. One-paragraph summary (paste-ready for descriptions, Devpost, captions)

**hop** is one app for Timișoara. Residents get live utility, transit and parking updates in plain words, a shared city map with privacy-safe safety and smell reports and danger-aware routes, a neighbourhood forum, event discovery with a "who do I go with?" buddy finder, Solana-minted QR tickets with proof-of-attendance badges, and an AI assistant that answers by voice in Romanian. City staff get a separate website where Gemini turns a photo of a door notice into a draft alert in two seconds, Auth0 step-up MFA guards publishing, Gemini embeddings and code execution turn resident reports into incident cards and charts, and Tiger Cloud time-series storage keeps it all queryable and open-data-ready. Built in 48 hours by four students as 13 independent modules on one Expo + Node + Python stack, validated with a live Living Labs survey of real Timișoara users, where parking came out as the #1 pain point — which is why our previous winning project, Parkie, became the app's flagship module.

*Built by UniHackers · UNIHACK 2026 · `:3`*
