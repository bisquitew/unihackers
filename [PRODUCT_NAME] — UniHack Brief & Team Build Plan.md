# &#91;PRODUCT\_NAME\] — UniHack Brief & Team Build Plan

Nov 13, 2026 · @Zaq

## 1. Project brief

We are building \[PRODUCT\_NAME\]: one community hub for Timișoara, Romania, that solves real city problems, absorbs our previous winning project \[PARKIE\_MODULE\], and targets as many UniHack sponsor challenges as possible in 48 hours.

**What the product is**

- A single city hub for residents, students, newcomers and tourists in Timișoara. Everything is built around this one city.
- A native phone app for iOS and Android, plus a web app usable on any other device (laptop, tablet).
- A set of feature modules, each solving one community problem (section 2), plus a Facebook-style community forum with groups (e.g. "my cat is missing").
- &#91;PARKIE\_MODULE\], our previous hackathon-winning project, fully ported in as one of the modules.

**How we build it (team requirements)**

- Team of 4, 48 hours. Do as much of the scope as possible, not necessarily all of it.
- Strictly modular: every feature is built independently. If one breaks or we drop it, it stays as a draft and does not affect the rest of the app.
- Each member owns their own components and can finish their tasks without waiting on anyone else.
- Scalable: new features can be added later without conflicts.
- One member owns the visual identity and the frontend shell. This is ideally the person porting \[PARKIE\_MODULE\], since it is a large part of the app.
- Deliverable right now is the structure, not the code: full architecture, team split, tech stack, then a list of extra ideas.

**Open item:** the \[PARKIE\_MODULE\] file was mentioned as attached but was not included in either upload. Its section in this plan uses placeholders until we have it.

## 2. Community problems and their modules

Each problem becomes one independent module with a placeholder name. Swap the placeholders for real names once you pick a brand.

| Module | Problem in Timișoara | What the module does |
| --- | --- | --- |
| \[M01\_EVENTS\] | The cultural scene is mostly formal museums and big annual festivals, with little in between. People asked for micro-festivals, open-air cinema, pop-up events, creative workshops, mixed-discipline nights, small showcases for local artists, and social gatherings for specific age groups. | Discover, create and RSVP to small events. Organizers post; residents filter by type, area, date and age group. |
| \[M02\_VISITOR\_INFO\] | Visitors can't find practical information when they need it. The review of the 2023 European Capital of Culture year criticised the city's communication with international visitors as slow and poorly targeted. | Multilingual practical info (transport, tickets, pharmacies, ATMs, opening hours) plus an AI assistant that answers questions. |
| \[M03\_SAFETY\] | People don't feel safe in parts of the city, especially at night. In August 2025, residents near Gara de Nord protested over threats, night-time noise and buildings taken over by squatters, saying repeated complaints produced no concrete response. | Map-based safety reports (noise, lighting, abandoned buildings), area heatmap, and an aggregated, exportable report for city hall. |
| \[M04\_UTILITIES\] | Many apartments get heat and hot water from Colterm. In October 2021 its gas was cut, leaving about 50,000 households plus hospitals and schools without heat or hot water; months later it considered cutting hot water at night. Notices for water, heat and power cuts are scattered across utility websites, social media and notes taped to doors, so residents rarely know if their building is affected or when service returns. | One feed of planned and unplanned outages, matched to the user's saved address, with push alerts and estimated restore time. |
| \[M05\_TRANSIT\] | Roadworks from August to the end of 2026 suspended tram line 5 and detoured lines 1 and 2. Lines 6a and 6b were already suspended, and a temporary bus line 5C was added. Changes come out as press releases, so people wait at stops no tram serves any more. | Live list of suspended, detoured and temporary lines, "is my stop still served?" check, and alerts for saved lines. |
| \[M06\_SMELL\] | The city keeps having bad-smell episodes. In early 2022 residents reported a burnt-rubber smell almost every morning, with no source named. Sensors measure particles, but when thousands notice a smell, nothing is recorded. | One-tap smell reports (type, intensity, time, location) aggregated into a live map and time series, combined with wind data to suggest a likely source direction. |
| \[M07\_BUDDY\] | Many people skip a concert or play because they have no one to go with: first-year and international students, newcomers, people whose friends like different things. | Opt-in "looking for company" on any event, interest-based matching, and small group chats. |
| \[M08\_FORUM\] | No central place for neighbourhood and community help. | Facebook-style groups and posts (lost pets, neighbourhood, buy/sell, help needed), with comments, photos and moderation. |
| \[PARKIE\_MODULE\] | From our previous winning project (details pending the file). | Full port of the existing project as a self-contained module. |

The list stays open: "and community problems like these" in the brief means more modules can be added later through the same module contract (section 4).

## 3. Sponsor side-challenges

We target nine side-challenges; each maps to specific modules and one owner (owners P1–P4 are defined in section 6). Tiger Data was marked optional in one file; it is kept here because it fits our data naturally.

| Challenge | Prize | What judges want | How we target it | Owner |
| --- | --- | --- | --- | --- |
| Netrom Software — Glue It Together | — | Combine APIs, cloud services, AI and tools into something greater than its parts: multi-API mashups (AI + serverless + public data), workflow automation across tools, hybrid solutions linking existing platforms with custom logic. | Serverless ingestion jobs pull utility notices, transit press releases and weather; Gemini turns them into structured alerts; the API matches them to users and pushes notifications. | P2 |
| Solana — Best Use of Solana | Unruggable hardware wallets (per member) | A fast, scalable app using Solana's speed and near-zero fees: games or social apps with many transactions; trading, lending or DEX; supply chain, identity or payments prototypes able to handle real-world volume. | Payments prototype: event tickets and proof-of-attendance on devnet, and micro-payments for \[PARKIE\_MODULE\] if it involves payments. | P3 |
| Vest Ventures — Living Labs Award | — | The most interactive development process: validate with real users (surveys, interviews, live tests, in person or online), iterate quickly on feedback, show measurable crowd-sourced improvements during the hackathon. | In-app feedback module plus an external survey from hour 2; a public changelog showing each change and the feedback that caused it. | P4 |
| ElevenLabs — Best Use of ElevenLabs | Wireless earbuds | Natural, expressive AI voice: AI companions you talk to, narrated or interactive stories, voice-enabled assistants or apps. | Voice city assistant for visitors, narrated walking tours, spoken outage and transit alerts. | P4 |
| Google Gemini — Best Use of Gemini API | MLH swag kits | An AI app that makes people say "whoa": personalised-advice chatbots, summarisers of complex material, generators for code, scripts or music. | City assistant with function calling over every module; photo of a notice taped to a door → structured outage; report clustering and summaries for city hall. | P4 (assistant), P2 (ingestion) |
| Auth0 — Best Use of Auth0 | Wireless headphones (per member) | Secure the app with social sign-in, MFA, passwordless login, role-based access, or Auth0 for AI Agents. Free tier: no card, up to 7,000 active users. | Passwordless and Google sign-in, roles (resident, organizer, moderator, admin), MFA for moderators and admins. | P2 |
| Tiger Data — Best Use of Tiger Data (optional) | Stream Deck Mini | PostgreSQL extended for real-time and time-series data: plain SQL, relational and metric data together, live dashboards from continuous aggregates, 90%+ compression. Ideas: IoT or sensor monitoring, real-time analytics dashboards, prediction engines. | Our main Postgres runs on Tiger Cloud. Smell, safety and outage reports and parking data become hypertables with continuous aggregates powering a live city dashboard. | P2 (DB), P4 (dashboard) |
| Entire — Best Use of Entire | Mini portable projector | Smarter AI coding workflows using Entire's Git forge: Sessions (shared agent memory), Graph (codebase map, up to 71% fewer tokens), Brain (persistent project knowledge), Trails (agent task + review in place of PRs). Judged on human-AI collaboration, clean history and measurable token savings. | Every member's AI coding sessions run through Entire; module work is assigned as Trails; we report token savings from Graph in the pitch. | All, coordinated by P2 |
| Vultr — Best Use of Vultr | Assorted prizes | High-performance projects on Vultr: one-click deploys, scalable compute, cloud GPUs for AI. Free credits on sign-up. | API, workers and object storage (photos) hosted on Vultr. | P2 |

Three challenges are process or tooling rather than features (Living Labs, Entire, Vultr), so start them in the first hours; they cannot be added at the end.

## 4. Architecture

The app is a small frozen core plus independent vertical-slice modules; a module can crash, be unfinished or be switched off and the rest of the app does not notice.

&#91;embedded content: system architecture · app, API, data, external services\]

Requests flow top-down from the app to the API to Postgres; workers push city data in from the side, and every module appears once in the app and once in the API.

**Rules that keep modules independent**

1. **A module is a vertical slice.** Its screens, API routes, database schema, background jobs and mock data all live in that module's own folders, owned by one person.
2. **The core is small and frozen after hour 3.** Core = auth, users, saved places/areas, notifications, feature flags, module registry, UI kit, shared types. Changes after hour 3 only in agreed sync windows.
3. **Modules never import each other.** They talk only through core events, each other's public read endpoints, or deep links.
4. **Feature flags per module:** `draft` (hidden in production, visible in dev menu), `beta`, `live`. A broken module is set to `draft` and disappears.
5. **Mock-first.** Every module ships seed data and a mock adapter for each external API, so it works without the real source and without other modules.
6. **One Postgres schema per module**, with its own migrations folder. Only references into core (`core.users`, `core.areas`) by id; never foreign keys between modules.
7. **Pre-registered stubs.** In hour 1 we create every module folder, manifest and registry line at once. After that nobody edits shared index files, which removes the most common merge conflict.
8. **Fault isolation at runtime.** The API loader wraps each module's start-up in try/catch and disables it on failure; the app wraps each module in its own error boundary.

**Repository layout (monorepo)**

```text
[repo-name]/
  apps/
    app/                       Expo app: iOS, Android and web from one codebase
      app/                     Expo Router (file-based routes)
        _layout.tsx            shell, providers, auth gate            P1
        (tabs)/                Home, Map, Alerts, Community, Profile  P1
        m/<module>/            each module's own routes               module owner
      src/modules/<module>/    screens, hooks, components, manifest.ts
      src/modules/index.ts     registry, pre-filled in hour 1, then frozen
  services/
    api/                       Node + Hono API
      src/core/                auth, users, areas, notifications, flags, events   P2
      src/modules/<module>/    routes.ts, service.ts, db.ts, assistant-tools.ts, seed.ts
      src/modules/index.ts     pre-filled, frozen
    workers/                   scheduled ingestion jobs (serverless)  P2 / P4
  packages/
    ui/                        design system and shared components    P1
    contracts/                 shared zod schemas and core types      P2, frozen hour 3
    api-client/                typed fetch client, one file per module
    config/                    tsconfig, eslint, prettier
  db/
    core/migrations/
    modules/<module>/migrations/
  docs/                        decisions, Living Labs log, pitch notes
```

**The module contract (frontend)** — each module exports one manifest; the shell builds navigation, home cards and map layers from it:

```ts
export const manifest: ModuleManifest = {
  id: 'm04-utilities',
  title: '[M04_UTILITIES]',
  owner: 'P2',
  status: 'beta',               // draft | beta | live
  icon: 'droplet',
  entryRoute: '/m/utilities',
  homeCard?: UtilitiesCard,     // optional tile on Home
  mapLayer?: OutageLayer,       // optional layer on the shared map
  settings?: UtilitiesSettings, // optional block in Profile
};
```

**The module contract (backend)** — each module exports one object; the API mounts it at `/v1/m/<module>`:

```ts
export const apiModule: ApiModule = {
  id: 'm04-utilities',
  routes,           // Hono router
  jobs?,            // scheduled jobs
  assistantTools?,  // Gemini function declarations + handlers
  onEvent?: { 'place.saved': handler },
};
```

**Shared extension points** — how a module appears in shared screens without anyone editing those screens: Home cards, Map layers, Alert types (via core notifications), assistant tools, search providers, Profile settings.

**Git workflow** — one branch per module; `CODEOWNERS` maps each folder to its owner; a change outside your folders needs a second person's OK and happens only in a sync window.

## 5. Tech stack

TypeScript everywhere, one codebase for iOS, Android and web, and one Postgres database; this keeps four people productive in 48 hours and lets anyone read anyone's code.

| Layer | Choice | Why | Challenge |
| --- | --- | --- | --- |
| App (iOS, Android, web) | Expo (React Native) + Expo Router, TypeScript | One codebase ships to both stores and the browser; file-based routes give each module its own folder. Demo on phones via Expo Go. | — |
| Styling and UI kit | NativeWind (Tailwind for React Native) + own tokens in `packages/ui` | Fast to style, same classes on web and native, design tokens in one place. | — |
| Maps | `react-native-maps` on native, MapLibre GL (or Leaflet) on web, behind one `<Map>` component with `.native.tsx` / `.web.tsx` files | The native map library does not run on web; one wrapper hides that from every module. OpenStreetMap tiles. | — |
| Data and state | TanStack Query (server data), Zustand (local state), react-hook-form + zod (forms) | Caching and offline-friendly lists with little code; zod schemas shared with the API. | — |
| Languages | i18next with Romanian and English (add Hungarian, German, Serbian later) | Visitors and international students are core users. | — |
| Push notifications | Expo Notifications | One API for iOS and Android push. | — |
| API | Node.js + Hono, zod validation | Tiny, fast, runs in containers or serverless; each module is a sub-router. | Netrom |
| ORM and migrations | Drizzle ORM, one Postgres schema per module | Typed SQL, schema namespaces map directly to modules. | — |
| Database | PostgreSQL with PostGIS on Tiger Cloud (TimescaleDB); local Docker image of the same for dev | Relational data, geo queries and time-series reports in one database; continuous aggregates for dashboards. | Tiger Data |
| Auth | Auth0: passwordless email, Google sign-in, RBAC roles, MFA for staff roles; `react-native-auth0` on native, Auth0 SPA SDK on web | Login, roles and MFA without building them. | Auth0 |
| Hosting | Vultr compute (Docker) for the API, Vultr Object Storage (S3-compatible) for photos | Free credits; one place for compute and files. | Vultr |
| Scheduled ingestion | Serverless cron functions (e.g. Cloudflare Workers Cron or Google Cloud Run functions) calling the API | Pulls utility notices, transit updates and weather on a schedule; the "glue" layer. | Netrom |
| AI | Gemini API via the `@google/genai` SDK: function calling, structured JSON output, image input | Assistant over all modules, extract outages from press releases and photographed notices, cluster and summarise reports. | Gemini, Netrom |
| Voice | ElevenLabs text-to-speech and conversational agents | Voice assistant, narrated tours, spoken alerts. | ElevenLabs |
| Blockchain | Solana devnet, `@solana/web3.js`, Solana Pay; wallet adapter on web, Mobile Wallet Adapter on Android | Tickets, proof-of-attendance and micro-payments with near-zero fees. | Solana |
| Realtime (optional) | Postgres LISTEN/NOTIFY or Server-Sent Events | Live forum and alert updates; polling is an acceptable fallback. | — |
| Repo and tooling | pnpm workspaces + Turborepo, GitHub Actions, Entire for agent sessions, Graph and Trails | Fast installs, per-package builds, shared AI context across the team. | Entire |
| Feedback | Tally or Google Forms survey + in-app feedback widget; events table in Postgres | Measurable before/after numbers for the pitch. | Living Labs |

**Timișoara data sources to check on day 1 (P2):** the city's open data portal ([data.primariatm.ro](https://www.opengovpartnership.org/documents/action-plan-timisoara-romania-2022-2024/), launched 2021, though [an OGP review notes it has not been updated recently](https://www.opengovpartnership.org/?p=97232)); STPT timetables on [stpt.ro](https://stpt.ro/EN/payment.html) (no open GTFS feed found, so plan on parsing press releases and timetables); Colterm, Aquatim and the power distributor's outage pages; Open-Meteo for wind direction. Assume every source may fail, which is why every module ships mock data.

## 6. Team split

Four owners, each with their own folders, modules and challenges; after the hour-3 contract freeze nobody waits on anyone, because every dependency has a mock.

| Owner | Role | Owns (folders) | Modules | Challenges |
| --- | --- | --- | --- | --- |
| P1 | Design, app shell and \[PARKIE\_MODULE\] port | `packages/ui`, `apps/app/app/_layout.tsx`, `apps/app/app/(tabs)/`, all \[PARKIE\_MODULE\] folders | \[PARKIE\_MODULE\] | Pitch visuals; Solana payments in \[PARKIE\_MODULE\] if relevant (using P3's wallet package) |
| P2 | Platform, data and city alerts | repo scaffold, `packages/contracts`, `services/api/src/core`, `apps/app/src/core`, `services/workers`, `db/core`, infra | \[M04\_UTILITIES\], \[M05\_TRANSIT\] | Auth0, Vultr, Tiger Data, Netrom, Entire (coordination) |
| P3 | Community and social | M01, M07, M08, M09 folders, `packages/solana` | \[M08\_FORUM\], \[M01\_EVENTS\], \[M07\_BUDDY\], \[M09\_WALLET\] | Solana |
| P4 | AI, voice and civic reports | M02, M03, M06, M10, M11, M12 folders | \[M10\_ASSISTANT\], \[M02\_VISITOR\_INFO\], \[M06\_SMELL\], \[M03\_SAFETY\], \[M11\_FEEDBACK\], \[M12\_DASHBOARD\] | Gemini, ElevenLabs, Living Labs, Tiger Data dashboard |

New placeholders: \[M09\_WALLET\] is the Solana wallet, ticket and payment module, kept separate so a blockchain failure never touches events. \[M10\_ASSISTANT\] is the Gemini + ElevenLabs assistant. \[M11\_FEEDBACK\] is the in-app feedback and changelog. \[M12\_DASHBOARD\] is the web-only city dashboard for officials.

**How each person stays unblocked**

- Auth: until Auth0 is wired, the API accepts a dev token that maps to fixed test users per role.
- UI kit: until P1 ships components, use plain React Native views; restyle in the polish phase.
- Notifications: `notify()` exists from hour 3 and logs to console until push is live.
- Data: every module has `seed.ts` and mock adapters, so no module needs another module's data or a real external source.

### P1 — Design, app shell and \[PARKIE\_MODULE\]

Must (by hour 24)

- [ ] Visual identity: placeholder name, logo mark, colour palette, type scale, icon set, tone of voice
- [ ] Design tokens and core components in `packages/ui`: Button, Card, ListItem, Chip, Avatar, Sheet, Tabs, Empty / Loading / Error states
- [ ] `<Map>` wrapper (native + web) with a layer API modules can plug into
- [ ] App shell: tabs (Home, Map, Alerts, Community, Profile), Home built from module home cards, Map built from module layers
- [ ] Responsive web layout (sidebar on desktop, tabs on phone)
- [ ] &#91;PARKIE\_MODULE\] core flow ported as a module (frontend, API module, schema, seed)

Should

- [ ] Onboarding: language, neighbourhood, interests, home address (feeds P2's saved places)
- [ ] Dark mode and accessibility pass (contrast, font scaling, screen reader labels)
- [ ] &#91;PARKIE\_MODULE\] secondary features

Could

- [ ] App icon, splash screen, store screenshots, pitch deck visuals

### P2 — Platform, data and city alerts

Must (by hour 3, then by hour 24)

- [ ] Hour 0–3: monorepo, Expo app and API skeletons, `packages/contracts`, all module stubs and registry lines, CODEOWNERS, CI, Entire set up for the team
- [ ] Core API: users, saved places and areas (PostGIS), feature flags, events outbox, `notify()`
- [ ] Auth0: passwordless + Google login, roles (resident, organizer, moderator, admin), API middleware, app auth provider in `apps/app/src/core`
- [ ] Database on Tiger Cloud, migrations per schema, deployment on Vultr
- [ ] &#91;M04\_UTILITIES\]: outage model, address matching, ingestion job with Gemini extraction, alerts
- [ ] &#91;M05\_TRANSIT\]: line status model, "is my stop served" check, ingestion from press releases, alerts

Should

- [ ] Expo push notifications end to end
- [ ] Photo upload service (Vultr Object Storage, signed URLs) used by forum and reports
- [ ] MFA for moderators and admins

Could

- [ ] Realtime updates (SSE), rate limiting, audit log

### P3 — Community and social

Must (by hour 24)

- [ ] &#91;M08\_FORUM\]: groups, posts with photos, comments, categories (lost pets, neighbourhood, help), report-a-post
- [ ] &#91;M01\_EVENTS\]: create, list, filter (type, area, date, age group), RSVP, map layer, home card
- [ ] &#91;M07\_BUDDY\]: "looking for company" on an event, interest matching, small group chat

Should

- [ ] Moderation tools for the moderator role
- [ ] &#91;M09\_WALLET\] on Solana devnet: ticket mint on RSVP, QR check-in, proof-of-attendance

Could

- [ ] Micro-payments for paid events or \[PARKIE\_MODULE\]; reputation points for helpful posts

### P4 — AI, voice and civic reports

Must (by hour 24)

- [ ] &#91;M11\_FEEDBACK\] live by hour 4: in-app feedback, external survey, changelog page (Living Labs needs the whole 48 hours)
- [ ] &#91;M10\_ASSISTANT\]: Gemini chat with function calling into each module's `assistantTools` (disabled modules simply contribute no tools)
- [ ] &#91;M02\_VISITOR\_INFO\]: curated practical info in RO/EN, answered through the assistant
- [ ] &#91;M06\_SMELL\]: one-tap report, map heatmap, time series as a Tiger Data hypertable, wind overlay

Should

- [ ] ElevenLabs voice: talk to the assistant, spoken alerts, one narrated walking tour
- [ ] &#91;M03\_SAFETY\]: same report pattern as smell, plus Gemini summary per area

Could

- [ ] &#91;M12\_DASHBOARD\]: web dashboard for officials from continuous aggregates, exportable report

## 8. Open questions and new ideas

**Open questions to settle in hour 0**

- [ ] Share the \[PARKIE\_MODULE\] file so P1 can size the port and we can see if Solana payments fit it.
- [ ] Check UniHack's rules on reusing a previous project. Many hackathons require new code; if so, rebuild \[PARKIE\_MODULE\] during the event and say so in the pitch.
- [ ] Pick the product name and replace the placeholders.
- [ ] Confirm which phones (iOS and Android) and laptop run the live demo.
- [ ] Decide the 3 modules we demo end to end if time runs short (suggestion: \[M04\_UTILITIES\], \[M10\_ASSISTANT\], \[PARKIE\_MODULE\]).

**More things the app could do**

| Idea | What it does | Builds on |
| --- | --- | --- |
| "My building" page | One screen per saved address: heat, water and power status, nearest working stops, nearby events and reports. | M04, M05, M01, M03 |
| Walk-me-home | Share a live route with a friend, suggest better-lit routes from safety reports, voice check-ins at night. | M03, M10 (voice) |
| Outage helpers | During heating or water cuts, list where to shower or warm up and let neighbours volunteer to check on elderly residents. | M04, M08 |
| Civic issue tracker | Report potholes, broken street lights or overflowing bins with photo and location; track status; export to city hall. | M03 pattern |
| Accessibility map | Step-free routes, ramps, broken lifts on trams and in buildings, reported by users. | Map layers |
| Neighbourhood audio digest | A 2-minute AI-written, ElevenLabs-voiced summary of what happened in your area this week. | M10, all modules |
| Live translation | Forum posts and event descriptions translated on the fly for international students and visitors. | M08, M01, Gemini |
| Lost-pet photo matching | Gemini compares a "found" photo with "lost" posts and suggests matches. | M08 |
| Newcomer guides | Step-by-step guides for new residents and students: transport card, doctors, registering, SIM cards. | M02 |
| Neighbourhood polls | Quick polls and petitions per area, with results shared with local officials. | M08, Auth0 roles |
| Civic rewards | Points for useful reports and volunteering, redeemable at local businesses, optionally as Solana tokens. | M09 |
| Bike and micromobility | Bike-sharing station availability next to transit status. | M05 |
| Open data back to the city | Publish anonymised aggregates (smell, safety, outages) as open datasets the city can reuse. | M12, Tiger Data |
