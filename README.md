# UNIHACK – Timișoara City Hub: Project Brief

Nov 13, 2026

## 1. Project overview

We are building a city hub for **Timișoara, Romania** for UNIHACK: one app that brings together solutions to the city's community problems, a community forum, and our previous winning project, Parkie.

- **Platforms:** a mobile app for iOS and Android, plus a web app that works on any other device.
- **Focus:** everything is built around Timișoara and its residents, students, newcomers and visitors.
- **Scope:** the community problems in section 2, the extra features in section 3, and as many sponsor side challenges from section 4 as we can fit in 48 hours.

## 2. Community problems the hub addresses

These are the seven problems from the challenge brief. The hub should also be open to other community problems like these.

### 2.1 Small cultural events are missing

The cultural scene relies on formal museums and big annual festivals, with little in between. People asked for:

- micro-festivals and pop-up events
- open-air cinema
- creative workshops and mixed-discipline nights
- small showcases for local artists
- social gatherings for specific age groups

### 2.2 Tourist information is hard to find

Visitors can't find practical information about the city when they need it. The review of the 2023 European Capital of Culture year said the same, criticising the city's communication with international visitors as slow and poorly targeted.

### 2.3 Feeling safe in the city

People don't feel safe in parts of the city, especially at night. In August 2025, residents near Gara de Nord protested over threats, night-time noise and abandoned buildings taken over by squatters. They said their repeated complaints had produced no concrete response.

### 2.4 When does my hot water come back?

Many apartments get heating and hot water from Colterm, the city's district heating company.

- In October 2021 its gas supply was cut, leaving about 50,000 households, plus hospitals and schools, without heat or hot water.
- A few months later the company considered cutting hot water at night.
- Notices about planned cuts and breakdowns of water, heat and power are scattered across utility websites, social media and notes taped to building doors.

Result: residents rarely know whether their own building is affected or when service will return.

### 2.5 Months of public transport detours

Roadworks running from August to the end of 2026 have changed several lines:

- tram line 5 is suspended
- lines 1 and 2 are detoured
- lines 6a and 6b were already suspended
- a temporary bus line, 5C, has been added

These changes are announced only through press releases, so it's easy to end up waiting at a stop that no tram serves any more.

### 2.6 Where is that smell coming from?

Timișoara keeps having episodes of bad smells. In early 2022, residents described a burnt-rubber smell almost every morning, and reports at the time named no source. Air-quality sensors measure particles, but when thousands of people notice a smell, none of it is recorded anywhere.

### 2.7 Nobody to go with

Many people skip a concert or a play simply because they have no one to go with: first-year and international students, newcomers, and people whose friends like different things.

## 3. Extra features

### 3.1 Community forum

A Facebook-style forum with topic groups where residents can post and help each other, for example "My cat is missing".

### 3.2 Parkie (our previous winning project)

Parkie is our AI-powered smart parking app, winner of the Community Problem Track Award at ITfest 2026 in Timișoara (team UniHackers). We want to integrate it fully into the hub, not just link to it.

It uses computer vision on parking-lot camera feeds to detect which spots are taken, and shows live availability on a mobile map so drivers don't circle the block.

#### How it works

1. **Lot owners** register their lot on the web dashboard and draw the parking slots by clicking 4 corners per slot on a camera frame.
2. **The AI vision agent** runs YOLO on the camera feed, works out which slots are occupied and reports the count to the backend.
3. **Drivers** open the mobile app and see a live map with colour-coded pins, then navigate to the best lot.
4. Updates reach the app in real time through Supabase Realtime, with no refreshing.

#### Components

| Component | Folder | Tech | What it does |
| --- | --- | --- | --- |
| AI vision agent | `ai_vision/` | Python, YOLOv11m (Ultralytics), OpenCV | Detects vehicles, matches them to slot polygons, smooths results, reports occupancy |
| Backend API | `backend_api/` | FastAPI, Supabase (PostgreSQL), bcrypt + JWT, Docker | 15 endpoints: accounts, lots, occupancy updates, frame capture, admin verification, voice search |
| Mobile app | `Frontend/Parkie/` | Expo, React Native, TypeScript, react-native-maps, Supabase Realtime | Live map, nearby search, voice search, lot details, navigation |
| Web dashboard | `Frontend/Dashboard/` | Vite, TypeScript, HTML Canvas | Owners add lots and draw slots; admins verify or reject lots |

A root Makefile starts each part: `make backend`, `make vision`, `make mobile`, `make dashboard`, `make test`. Requirements: Python 3.11+, Node.js 20+, Docker optional.

#### Features

- **Live map pins** showing free spots: green below 70% occupied, yellow 70–85%, red above 85%, grey when unknown or offline.
- **Nearby search:** search a destination (OpenStreetMap Nominatim autocomplete), see lots within 500 m, ranked first by lowest occupancy, then by status colour.
- **Voice search:** speak a place name in Romanian; OpenAI Whisper transcribes it and Nominatim turns it into map coordinates.
- **Lot details card:** available, occupied, occupancy %, status and last scan time, plus a "Navigate Here" button (opens Apple Maps).
- **Owner dashboard:** add a lot (name, coordinates, camera URL), capture a camera frame, draw and edit slot polygons, save the setup.
- **Admin panel:** review pending lots, verify, reject (delete) or unverify them. Only verified lots appear in the mobile app, and editing a lot sends it back for re-verification.
- **Mock data generator:** 14 real Timișoara locations (e.g. Piața Unirii, Iulius Town, Gara de Nord, Shopping City) with simulated rush and exit surges, for demos.

#### AI detection pipeline

1. **YOLO inference** every 5 s detects cars, motorcycles, buses, trucks and bicycles.
2. **Polygon matching** checks 10 sample points of each vehicle box against each slot polygon.
3. **Large-vehicle filter** ignores boxes larger than 12% of the frame (passing buses or trucks).
4. **Smoothing:** a 5-frame majority vote per slot prevents flicker.
5. **Reporting:** the stable occupied count is posted to the backend every 15 s; the agent reconnects automatically if the stream drops.

A training script can also fine-tune a custom detector on the PKLot dataset.

#### User roles

- **Driver:** uses the mobile app; no account needed.
- **Lot owner:** registers and logs in on the dashboard, manages their own lots.
- **Admin:** verifies, rejects or unverifies lots.

#### API endpoints

| Method | Endpoint | Used by | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Dashboard | Create a lot owner account |
| POST | `/auth/login` | Dashboard | Log in, get a JWT and user profile |
| GET | `/lots` | Mobile app | All verified lots (`include_unverified` optional) |
| GET | `/lots/my` | Dashboard (JWT) | The owner's own lots |
| GET | `/lots/colors` | Mobile app | Lightweight id + status colour only |
| GET | `/lots/{id}` | App, dashboard | One lot's details |
| GET | `/lots/{id}/config` | AI agent | Camera URL and slot polygons |
| POST | `/lots` | Dashboard (JWT) | Register a new lot (starts unverified) |
| PUT | `/lots/{id}/setup` | Dashboard (JWT) | Save slot setup; resets verification |
| POST | `/vision/update_lot` | AI agent | Report detected cars; recalculates free spots and colour |
| POST | `/vision/capture_frame` | Dashboard | Grab one camera frame as base64 JPEG |
| POST | `/search/voice` | Mobile app | Audio in, transcript + coordinates out |
| GET | `/admin/lots/pending` | Admin (JWT) | Lots awaiting review |
| PATCH | `/admin/lots/{id}/verify` | Admin (JWT) | Verify or unverify a lot |
| DELETE | `/admin/lots/{id}` | Admin (JWT) | Reject and delete a lot |

#### Database (Supabase)

- **users:** id, name, email (unique), password (bcrypt), role (owner/admin), created_at.
- **parking_lots:** id, owner_id, name, latitude, longitude, camera_url, slots_data (8-number polygon per slot), capacity, available_spots, status_color, is_verified, last_updated.

#### Design system

Dark amethyst theme: background `#0a0a0a`, primary `#8d23be`, surface `#401056`, status green `#10b981`, yellow `#f59e0b`, red `#ef4444`, with glassmorphism panels (`rgba(64, 16, 86, 0.4)` and violet borders).

#### Things to fix when integrating

Found while reading the repository:

- **Committed secrets:** `lib/supabase.js` contains the Supabase URL and key, and `config/api.js` contains an ngrok URL. The `.ts` versions read from environment variables; delete the `.js` duplicates and rotate the key.
- **Missing source:** `components/NearbySearch.tsx` came through as a binary file, so its code (search + ranking) is not in the export.
- **Wrong default map location:** with no GPS or lots, the map centres on Milan (45.4642, 9.19) instead of Timișoara.
- **Navigation is Apple Maps only;** Android users need a Google Maps link.
- **Open endpoints:** `/vision/update_lot` and `/vision/capture_frame` have no authentication.
- **Overlap with the hub:** Parkie has its own login (bcrypt + JWT) while the hub plans Auth0 (4.5), and its voice search uses OpenAI Whisper; both need to be reconciled with the hub's shared services.
- **Legacy code:** `backend_api/legacy/` holds an older single-file version of the API and can be left out.

## 4. Sponsor side challenges

There are nine side challenges. Tiger Data is optional for now; all others are targets.

| # | Challenge | Sponsor | Prize | Status |
| --- | --- | --- | --- | --- |
| 4.1 | Glue It Together | Netrom Software | not stated | Target |
| 4.2 | Living Labs Award | Vest Ventures | not stated | Target |
| 4.3 | Best Use of Gemini API | Google / MLH | MLH swag kits | Target |
| 4.4 | Best Use of ElevenLabs | ElevenLabs | Wireless earbuds | Target |
| 4.5 | Best Use of Auth0 | Auth0 | Wireless headphones (per team member) | Target |
| 4.6 | Best Use of Solana | Solana | Unruggable hardware wallets (per team member) | Target |
| 4.7 | Best Use of Entire | Entire | Mini portable projector | Target |
| 4.8 | Best Use of Vultr | Vultr | Assorted prizes | Target |
| 4.9 | Best Use of Tiger Data | Tiger Data | Stream Deck Mini | Optional for now |

### 4.1 Netrom Software — Glue It Together

Combine APIs, cloud services, AI and other tools into one working solution that does more than any single component could on its own.

- Multi-API mashup combining AI, serverless functions and public data
- Smart workflow automation that bridges separate tools and cloud services
- Hybrid solution connecting existing platforms with custom logic

### 4.2 Vest Ventures — Living Labs Award

Awarded to the team with the most interactive development process: testing the idea with real users and quickly adapting the solution based on their feedback. It rewards adaptability and a crowd-sourced approach.

- Validate the idea with real users through surveys, interviews or live testing (in person or online)
- Iterate quickly and adapt the solution based on the feedback
- Show measurable crowd-sourced improvements made during the hackathon

### 4.3 Best Use of Gemini API

Build an AI-powered app with the Google Gemini API that makes people say "whoa". Gemini can understand language, analyse information and generate content.

- Chatbot that gives personalised advice
- App that summarises complex documents or research papers
- Generator for creative content such as code, scripts or music

### 4.4 Best Use of ElevenLabs

Give the project a voice with natural, human-sounding, emotionally expressive AI audio, without actors or complex audio production.

- AI companion you can talk to
- Narrated, interactive stories
- Voice-enabled assistant or app
- Fully autonomous audio experiences

### 4.5 Best Use of Auth0

Secure the app with Auth0 instead of building authentication from scratch. It is free to try, needs no credit card, and allows up to 7,000 free active users with unlimited logins. Any Auth0 API counts.

- Social sign-in or passwordless login
- Multi-factor authentication (MFA)
- Role-based access control
- Auth0 for AI Agents, to secure AI features

### 4.6 Best Use of Solana

Build a fast, scalable app that uses Solana's core advantages: very fast execution and near-zero transaction costs.

- Game, social app or consumer product that relies on instant, high-frequency transactions
- Trading, lending or decentralised exchange (DEX) platform
- Supply chain, identity or payments prototype that can handle real-world volume

### 4.7 Best Use of Entire

Entire is a Git forge built for collaboration between people and AI agents. To qualify, the team should use as many of its core capabilities as possible in our development workflow, and show clean code history and measurable token savings.

- **Sessions (shared memory):** save AI agent sessions as checkpoints and push them to the team, so anyone can continue with no lost context.
- **Graph (codebase mapping):** generate a visual map of the codebase; searching it instead of blind file searches cuts agent token usage by up to 71%.
- **Brain (persistent reasoning):** combine sessions and Graph into lasting project knowledge that agents can query (CLI or MCP), so they don't repeat mistakes.
- **Trails (code review):** assign a task to an agent through a Trail (Entire's combined issue and pull request), then let an agent review whether the change matches the intent and should be merged.

### 4.8 Best Use of Vultr

Deploy the project on Vultr's cloud: one-click deployment, scalable compute, and Cloud GPUs for AI features. Sign up to claim free cloud credits.

### 4.9 Best Use of Tiger Data (optional for now)

Tiger Data extends PostgreSQL for real-time data, time-series metrics and analytics.

- Plain SQL, with no complex NoSQL pipelines
- Relational data (e.g. user profiles) and high-frequency metric streams in one database
- Lag-free live dashboards using pre-computed continuous aggregates
- 90%+ data compression, so millions of events fit on a free-tier instance

Example uses: IoT or sensor monitoring, real-time analytics dashboards, financial prediction engines.

## 5. Team and build constraints

- **Time:** 48 hours to build as much of this as possible.
- **Team:** 4 people. Each member gets their own set of tasks and can finish them without needing anything from the others.
- **Modular features:** every feature is built independently. If one breaks or we stop working on it, it stays as a draft without affecting the rest of the project.
- **Scalable:** new features can be added later without conflicts with existing ones.

## 6. What we are asking for

We don't want the finished project yet. We want the full structure first, and will develop it from there.

1. **Full project structure** — modular, independent and scalable, following the constraints in section 5, for both the mobile app (iOS/Android) and the web app.
2. **Task split for 4 people** — each member's tasks, doable without depending on the others.
3. **Recommended technologies** — a tech stack we can use, including where each sponsor challenge fits.
4. **New ideas** — at the end, suggestions for more things the app could do to help people in the city. *(Now covered in section 8.)*

## 7. Notes on the merge

This brief combines two versions of the same notes. Where they differed:

- Entire and Vultr appeared only in the newer version; both are included.
- Tiger Data was marked "optional for now" only in the older version; that status is kept.
- Sponsor descriptions use the fuller wording, with the example ideas from both versions combined.
- The web app, the tech stack request, the new-ideas request and the "no dependencies between members" rule came from the newer version.

## 8. New feature ideas (researched, added Nov 13, 2026)

### 8.0 Positioning: what the official app does NOT do

The municipality launched its own official **Timișoara City App** in testing on 10 November 2026 (full launch planned for December). It covers: live public transport tracking and ticket buying, Timpark parking payment, events and tourist attractions with themed routes, all online city-hall services from the Unic Portal (taxes, appointments, documents), heavy-vehicle access features, and "Timi", a text/voice AI assistant for transport, events and city services.

What the official app does **not** have, and where our hub wins:

- **no community layer** — no forum, no user-to-user help, no event companions
- **no citizen reporting** — you can pay taxes but not report a broken streetlight
- **no crowdsourced data** — no outage, smell, or safety signals from residents
- **no social/buddy features** — nothing for students and newcomers
- **no gamification or engagement loop**

Everything below is chosen to sit in that gap. We are the **community and problems layer** on top of the city; they are the services and payments layer.

### 8.1 "ReparaTM" — civic issue reporting with AI triage

Photo-first reporting of potholes, broken streetlights, graffiti, illegal dumping, broken playgrounds and similar problems, plus status tracking and community upvoting. This is the most battle-tested civic-tech pattern out there (Civix, CivicFix, UrbanMind, Civik all follow it).

- **Citizen flow:** take a photo → GPS auto-attached → Gemini classifies the issue type and suggests priority from the image and description → one-tap submit in under 30 seconds.
- **Duplicate clustering:** group similar reports by type + geography into "hotspots" instead of scattered tickets (a few confirmed reports = one confirmed hotspot).
- **Status timeline:** Reported → Verified → In Progress → Resolved, with push notifications at each stage.
- **City dashboard:** heatmap of open issues by category and neighbourhood, resolution-time stats, CSV export.
- **Rewards:** points for valid reports and +bonus when an issue gets resolved (see 8.8).
- Solves problems 2.3 and 2.6 partially; strong fit for **Netrom Glue (4.1)**, **Gemini (4.3)** and **Vultr (4.8)**.

### 8.2 "MiroaseTM" — crowdsourced smell map

Direct answer to problem 2.6. Smell Vancouver (UBC) proved this model works: a simple web/mobile app where people report odour type, strength, offensiveness (1–5), suspected source and symptoms, mapped in real time. Their data identified hotspots, dominant odour types (65% "rotten"/"chemical"), and even detected a refinery incident before official reports.

- Report flow: 10-second form — location (GPS), odour type (burnt rubber, chemical, rotten, smoke...), strength, how unpleasant.
- Live heat map of the city, layered over existing particulate-sensor data so "what the sensors say" and "what people smell" can be compared.
- Trend detection: Gemini summarises the day's reports into a plain-language city smell brief ("burnt-rubber reports concentrated in the east between 6–9 AM").
- Historically interesting angle: Timișoara's 2022 burnt-rubber episodes were never attributed — a year of crowdsourced data would have given the city evidence.
- Fits **Gemini (4.3)**; the time-series reports are also a natural **Tiger Data (4.9)** use case if we pick it up.

### 8.3 Utility status hub — "are we affected?"

Direct answer to problem 2.4, modelled on cities like St. George (UT) that run report-and-track utility outage maps.

- **Aggregation:** scrape/watch Colterm, apă (water) and electricity notice pages and social accounts; every planned or unplanned cut becomes one card in the app.
- **Crowd verification:** users tap "my building is affected too" — multiple reports from one neighbourhood confirm an outage before any official notice appears (same early-warning pattern Downdetector-style systems use).
- **Building subscription:** save your address once; get a push notification only when *your* area is affected and an "estimated return" when available.
- **Community answers:** a thread per outage where neighbours share what they know ("boiler came back on str. X at 14:00").
- Fits **Netrom Glue (4.1)** — a true multi-API mashup of scraping + crowdsourcing + push.

### 8.4 Roadworks-aware transit layer

The official app shows live vehicle positions and third-party apps already show real-time STPT arrivals, but none of them solve the actual 2026 problem: **detours**.

- **Detour-aware trip planner:** plan a route that knows line 5 is suspended, 1 and 2 are detoured, and 5C exists — and never sends you to a dead stop.
- **Stop-level warnings:** open the map near a stop and see "line 5 no longer serves this stop — use 5C from Piața Sf. Gheorghe".
- **Saved lines + push alerts:** follow your line and get notified when its status changes.
- **"When's my tram" widget** using the public STPT data (csuki-style feeds) so we keep parity with what exists, then beat it on the roadworks layer.
- Solves problem 2.5.

### 8.5 "Cu Cine?" — event buddy matching

Direct answer to problem 2.7. Same pattern as EventBuddie / aKind / Buzzable: match people who want to attend the same event.

- Tap "I want to go" on any event (from the 8.7 micro-events feed) and see others going, with a compatibility hint (shared groups, interests, university).
- Lightweight in-app chat before the event to arrange meeting up; profile verification through the hub account.
- Group mode: small groups ("3 people going to the open-air cinema, join them").
- AI wingman (Gemini): suggests what two matched people have in common to break the ice.
- **Safety by design:** verified accounts via **Auth0 (4.5)**, report/block tools, meet-at-venue guidance, no home addresses ever.
- Solves problem 2.7 and deepens 2.1 (events get more attendees).

### 8.6 Night safety layer — "drumul sigur"

Answer to problem 2.3, but avoiding the pitfalls of apps like Citizen (crime alerts caused panic, false reports and vigilante behaviour — even their own users called it "a bunch of bs speculation").

- **Safety-scored walking routes:** at night, routing prefers well-lit, populated streets. Score comes from streetlight density, reports of broken lights (from 8.1), open venues, and community votes on "feels safe" per street segment — infrastructure, not people-watching.
- **Walk me home:** share a live trip with a friend; they get a notification when you arrive.
- **Safe spots map:** 24h pharmacies, open venues, police boxes, well-lit transit hubs.
- **Broken-streetlight fast path:** one-tap report pre-wired into the 8.1 civic reporting (dark streets are the city's cheapest safety fix).
- Fits **Netrom (4.1)** and is a strong demo moment.

### 8.7 Micro-events engine — the "in-between" cultural scene

Answer to problem 2.1: the official app lists big events; the gap in Timișoara is the small stuff.

- **Anyone can post:** pop-ups, open-air cinema, workshops, jam nights, student showcases — approval-light, community-flagged moderation.
- **AI recommendations in plain language:** "something chill outdoors this weekend near where I live, free" → ranked list (the pattern aKind just shipped and Buzzable uses).
- **Feed + map:** what's happening near you right now.
- **Attendance intent:** events connect directly to "Cu Cino?" buddy matching (8.5).
- **QR check-in** so organisers and attendees verify real turnout — also feeds Living Labs metrics (4.2).
- Fits **Gemini (4.3)** for recommendations and **ElevenLabs (4.4)** for narrated event digests ("listen to tonight's 3 picks").

### 8.8 Civic points and badges

Engagement loop across all features, proven by UrbanMind (+10 per report, +20 on resolution) and Civic360 (badges, leaderboards).

- Points for: valid reports, resolved issues, attending events, helping on the forum, confirming outages.
- Badges and a friendly neighbourhood leaderboard.
- **Optional Solana angle (4.6):** verifiable on-chain reputation — a "civic contribution score" minted as a token/credential per contributor, fast and near-zero cost. We do **not** build payments or trading; reputation only, which keeps the scope sane for 48 hours.

### 8.9 Multilingual AI city guide (voice-first)

Differentiated answer to problem 2.2: the official "Timi" answers in writing about official services; we go voice-first and community-fed.

- Ask anything in Romanian, English, German or Hungarian — voice in, spoken answer out.
- Answers grounded in **our own data** (live events, smell map, outage map, forum threads, Parkie lots), not just generic tourist info — that's what makes it "whoa".
- **ElevenLabs (4.4)** narration of themed walking routes through the city (a narrated, interactive story of Timișoara's squares and history).
- Gemini (4.3) for the reasoning; a RAG layer over our event/issue/utility data.

### 8.10 Student & newcomer onboarding

Timișoara is a student city and the forum already targets newcomers; make it explicit.

- **"First 30 days in Timișoara" checklist:** transit pass, dorm/internet setup, family-doctor registration, where to eat cheap, which forum groups to join.
- **Student discounts map** contributed by the community (businesses can claim and verify listings).
- **University groups** in the forum, linked to campus events in 8.7 and buddy matching in 8.5.

### 8.11 Lost & found + missing pets

Extends the forum's "my cat is missing" example into a real tool:

- Structured lost/found posts with photo, location and date.
- **Zone push notifications:** lost pet near your neighbourhood → everyone nearby gets an alert.
- Matches found items to lost reports automatically (same category + area + time window).

### 8.12 Parkie extensions (beyond integration)

Keep everything from 3.2, and add:

- **Bike racks / EV chargers:** same YOLO pipeline, new object classes — cheap win since the vision agent already exists.
- **Occupancy forecasting:** Tiger Data (4.9) time-series continuous aggregates predict "the Iulius Town lot is usually full at 18:00 on Fridays" from the occupancy stream — one clean sponsor story.
- **Street-parking pilot:** the same slot-polygon approach on public street cameras if the city shares feeds.
- Fix the known integration issues listed in 3.2 before adding any of these.

### 8.13 Living Labs toolkit (built into the app)

The Living Labs award (4.2) rewards real-user validation and iteration — so make that a feature:

- **In-app feedback widget:** thumbs up/down plus a comment on every screen, logged with screen name and timestamp.
- **Quick polls:** "should we add X?" in-app.
- **QR posters** around campus and the city centre during the hackathon → install + test funnel with measurable numbers.
- **Feedback dashboard:** what was reported, what we changed, when — the "show measurable crowd-sourced improvements" requirement becomes a slide.

### 8.14 Multi-channel access

Not everyone installs an app during a demo; meet people where they are (the multichannel pattern from Civic360).

- **Telegram bot** (fastest to build): report issues, get event and outage notifications, ask the AI guide.
- Same backend services, just another client — proves the "Glue It Together" mashup story (4.1).

### 8.15 Priorities

| Idea | Problem solved | Sponsor fit | Effort | Impact |
| --- | --- | --- | --- | --- |
| 8.1 Civic reporting | 2.3, 2.6 | Netrom, Gemini, Vultr | Medium | Very high |
| 8.3 Utility status hub | 2.4 | Netrom | Medium | Very high |
| 8.4 Roadworks transit | 2.5 | Netrom | Medium | High |
| 8.5 Event buddies | 2.7 | Auth0, Gemini | Medium | High |
| 8.7 Micro-events | 2.1 | Gemini, ElevenLabs | Medium | High |
| 8.6 Night safety | 2.3 | Netrom | Medium | High |
| 8.2 Smell map | 2.6 | Gemini, Tiger Data | Low | Medium-high |
| 8.9 AI city guide | 2.2 | Gemini, ElevenLabs | Medium | High |
| 8.8 Civic points | all | Solana | Low | Medium |
| 8.10–8.11 Students, lost&found | 2.7, forum | — | Low | Medium |
| 8.12 Parkie extensions | parking | Tiger Data | Low-medium | Medium |
| 8.13 Living Labs | — | Vest Ventures | Low | High (for judging) |
| 8.14 Telegram bot | all | Netrom | Low | Medium |

If we can only build five: **8.1 + 8.3 + 8.4 + 8.5 + 8.13** — four real community problems solved plus the validation story, and every one of them is something the official Timișoara City App does not do.
