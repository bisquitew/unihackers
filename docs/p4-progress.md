# P4 progress: AI, voice and civic reports

Owner: P4. Updated with every P4 feature or fix. Hashes are short commit ids; "pending" means changed in the working tree but not committed yet.

Last updated: 2026-11-14 · working branch: `p4/tiger`

Commit ids are from main's rewritten history (commit-message cleanup on 2026-11-14); older ids no longer exist.

## Tasks

| Task | Status | Branch | Commits | Date |
| --- | --- | --- | --- | --- |
| Living Labs docs: survey spec, Sheets cleaning script, feedback log | done | `p4/feedback`, `p4/integration` | `691820c`, answers per city `f59fad8` | 2026-11-13/14 |
| m11-feedback: in-app feedback, survey `/ingest`, summary, changelog, screens, migration | done | `p4/feedback` | `270c462`, strict-mode fix `1bb4655`, header fix `fd294ef` | 2026-11-13/14 |
| m10-assistant: Gemini chat with function calling over all modules' tools, chat screen | done | `p4/assistant` | `640a698` (SDK), `6578516` (API), `58112df` (screen), `8e9ba0f` (registry), `e7faaf8` (language + rate limit), header fix `fd294ef` | 2026-11-13/14 |
| Integration fixes: app/workers dependencies, react-native-web | done | `fix/api-startup` | `2fff24f`, `3f8d2e6`, `73b03f4` | 2026-11-13 |
| Integration fixes: workers on Windows, P2 test scripts on Windows | done | `p4/integration` | `a66bbdc`, `3510869` | 2026-11-14 |
| Integration fixes: place matching without diacritics (m04 outages, m05 stops, parkie areas) | done | `p4/integration` | `076089f`, `2c5f642`, `fb31c67` | 2026-11-14 |
| Integration fixes: `packages/ui` typecheck, TabBar `absoluteFill` | done | `p4/integration` | `aa36c44`, `f2c769c` | 2026-11-14 |
| Merges of main into P4 branches | done | `p4/feedback`, `p4/integration` | `a8918c4`, `61bb911`, `6562c2a`, `45d794b`, `63fbea3`, `985668a` (`.env.example` conflict resolved) | 2026-11-13/14 |
| Integration fix after merging main: `core/db.ts` typecheck (`pool` typed with a type-only `pg` import) | done | `p4/integration` | `75b87a7` | 2026-11-14 |
| P4 progress file | done | `p4/integration` | `20707a0`, `e8a85f3` | 2026-11-14 |
| Survey link in the feedback screen | done | `p4/integration` | `615a399` | 2026-11-14 |
| Home screen links: ask bar and Assistant tile → assistant, Feedback tile | done | `p4/integration` | `ff3abb1` | 2026-11-14 |
| Living Labs survey live: form, Sheet, cleaning script, trigger and QR code set up; survey is being shared | done | `p4/integration` | QR code `23c1387` | 2026-11-14 |
| PR into main | done | `p4/integration` | PR #1, merged as `c3f77e5` | 2026-11-14 |
| m02-visitor-info: 9 RO/EN entries parsed from `docs/visitor-info/content.md` into `seed.ts` (`generate-seed.ts`), list/detail/categories API, `search_visitor_info` assistant tool + prompt line, screen with category chips, RO/EN toggle and "check before you travel" badge, home tile, migration | done | `p4/visitor-info` | `27e6dba` (API + tool), `1147662` (prompt), `c6c92c1` (screen), `80d987f` (home tile), `264735d` (progress); merged into main as `2c8e5f2` | 2026-11-14 |
| m06-smell: one-tap reports (type, intensity, area or location), repository with memory / Postgres (`core/db.ts`) + fallback, ~60 demo reports (`isDemo`, `?includeDemo=false`), pins / areas / timeseries / wind (Open-Meteo, 10 min cache, mock fallback) / source hint / health API, `get_smell_reports` tool + prompt topic, screen with wind arrow, hint, area bars and 24 h chart, demo toggle and label, home tile, hypertable migration (not run) | done | `p4/smell` | `a8bf8df` (API), `e7f39be` (prompt), `0186fca` (screen), `0d50a7f` (home tile), `4ead1d4` (progress); merges of main `980c9bf`, `03dd34e` | 2026-11-14 |
| m06-smell on P1's shared map: `manifest.mapLayer` returns a `MapLayer` (`@hub/map`) of `smell` pins from a cache filled from `/pins` (with `isDemo`), refreshed after a report; P1 side: `core/map-layers/changes.ts` + one `useSyncExternalStore` line in `map.tsx` so pins that arrive after the Map tab mounted are drawn | done | `p4/smell` | `4b99c16` (API `isDemo`), `756eef9` (P1 map signal), `5afef4e` (map layer), `0423b87` (progress); merged into main via PR #3 (`d869b34`) | 2026-11-14 |
| P4 modules on `server.ts` (port 8000, Docker/CI): P2 copied m02/m06/m10/m11 routes by hand in `04ba747`, which skipped validation, the survey ingest token (anyone could post fake survey answers), `await` on feedback summary/changelog (returned `{}`) and the `includeDemo` default. Now `server.ts` forwards those paths to the same Hono routers as port 3001; m11 relative imports got `.ts` so they load under `node --experimental-strip-types` | done | `p4/next` | `264fdb0` (m11 imports), `c3c82a7` (`server.ts`), `f8eb177` (progress); merged into main via PR #4 (`d92b1d5`) | 2026-11-14 |
| Shared fixes pass (P4 fixes these for the team): (a) `.ts` on relative imports + `import type` in m01/m07/m08/m09/m11 so the whole registry loads under strip-types — landed identically in P2's `67cd68e`, so no P4 commit; (b) `toqr` declared in `apps/app`; (c) `TabBar.tsx` `absoluteFill`; (d) `packages/map` declares `react-native-svg` (peer) and `@types/react` (dev), `Sheet.tsx` `absoluteFill`, `babel-preset-expo` declared in `apps/app`. Result: 0 type errors in api, app, ui, map, workers, contracts, solana; `server.ts` + `test_p2.py` pass; assistant works on 8000 and 3001; web app bundles with a plain pnpm install | done | `p4/fix-shared` | (a) `67cd68e` by P2; (b) `1d76a52`, (c) `e3a8328`, (d) `3d8e4c4`, progress `1202834`; merged into main via PR #5 (`ae9de5c`) | 2026-11-14 |
| One API server (merge `server.ts` into `index.ts`) | done by P2 (routes) | — | P2's `server.ts` serves every module's routes (P4's through the shared Hono routers); two entry points remain (`server.ts` for Docker/CI, `index.ts` for dev) | 2026-11-14 |
| ElevenLabs voice (m10): `POST /tts` (`eleven_multilingual_v2`, voice Sarah `EXAVITQu4vr4xnSDxMaL`, overridable by `ELEVENLABS_MODEL` / `ELEVENLABS_VOICE_ID`; markdown stripped, max 800 spoken chars cut at a sentence end, in-memory cache by hash, 40 / 10 min), `POST /stt` (`scribe_v3`, multipart or raw audio, max 10 MB, 20 / 10 min), `GET /voice` (configured or not), `GET /tour` (`docs/voice/tour.md`); 401 / 429 / quota → clear 503; no key → 503 "voice not configured" and text chat keeps working; key only server-side. App (web): mic (tap to record, max 30 s) → `/stt` → chat, 🔊 on each reply, "auto-read answers" toggle; Listen buttons on outage and transit cards; `/m/tour` screen with one placeholder stop | done | `p4/voice` | `6e477ba` (API), `0cef42d` (server.ts headers), `2b3b71a` (chat voice), `d5c78c2` (alert Listen), `58fe8e0` (tour), `54c087d` (progress); merged into main via PR #7 (`82bf392`) | 2026-11-14 |
| Gemini extras 1a: assistant tool `get_my_tickets` for the m09 wallet (read-only): tickets, check-ins and POAP badges of the demo wallet (same as the app's wallet screen), each Explorer link verified live on Solana devnet (`onchain.ts`, 5 min cache) and only shown when found; API wallet seed aligned with the app (the old seed had a made-up signature); prompt line in m10 | done | `p4/gemini` | `397fad1` (m09 tool), `cbd91bc` (prompt); merge of main `7576f7f` | 2026-11-14 |
| Gemini extras 1b: `POST /v1/m/assistant/notice/parse` (photo → Gemini image input + structured JSON → draft in P2's outage format, areas mapped to official names, times in Timișoara time, warnings for anything unclear; nothing saved; 10 / 10 min) and `/notice/confirm` (P2's rule: admin with MFA via `enforceSecurityPolicy`, then m04 `createOutage`). App `/m/notice` (web): pick or take a photo, edit the draft, "Mod operator (demo)" sends the dev admin login, then the alert shows in Utilities. Link on the Utilities screen. Place matcher now ignores house numbers when the question has none ("Strada Văcărescu" finds "Str. Văcărescu nr. 1–40") | done | `p4/gemini` | `d1e51d0` (API), `2214bde` (app), `157dba7` (place matcher); merge of main `7576f7f` | 2026-11-14 |
| Gemini extras 1c: demo script `docs/demo/p4-demo-script.md` (notice photo → Gemini draft → admin+MFA publish → spoken question answered aloud → Solana tickets) with two stamped sample notices; m10 prompt now converts UTC tool times to Timișoara time | done | `p4/gemini` | `2309673` (demo docs), `cbd91bc` (UTC times); merge of main `7576f7f` | 2026-11-14 |
| Fix: the web app returned 500 on every page after P2's Parkie update (`48930d4`): the app imported `PARKIE_SEED_LOTS` from `@hub/contracts`, whose entry loads `zod-shim.ts` (top-level `await`), which Expo's web build cannot run. Now imported straight from `packages/contracts/src/seed/parkie.seed.ts` | done | `p4/gemini` | `57855a4`; merge of main `7576f7f` | 2026-11-14 |
| m03-safety: reports about places (poor lighting, noise at night, abandoned building, feeling unsafe, other) by area or location; note max 200 chars with contact details/plates/links removed and a "describe the place, not people" rule in the UI; memory / Postgres + fallback like m06; ~65 demo reports over 7 days, mostly 19:00–03:00, Gara de Nord / Complex / Iosefin; routes `POST /reports` (rate-limited), `GET /reports`, `/pins`, `/areas`, `/summary?area=&lang=` (Gemini from counts only, never notes; 10 min cache; no-key fallback with counts per type; 429 → 503), `/health`; `get_safety_reports` tool + cautious prompt line; screen with report form, area list, RO/EN summary, demo toggle; `safety` map layer through `changes.ts`; home tile; hypertable migration (not run); served on `server.ts` too | done | `p4/safety` | `48f1c97` (API), `cb0c9e9` (prompt), `fe04ccb` (server.ts), `481443f` (screen), `043ff18` (home tile), `f9a05a7` (progress); merged into main via PR #6 (`c303b26`) | 2026-11-14 |
| Shared rate limiter `core/rate-limit.ts` (per client, fixed window, only accepted requests count, `Retry-After`): safety 5 reports / 10 min, smell 10 / 10 min. `server.ts` forwards the client address (`x-forwarded-for`) and all router response headers | done | `p4/safety` | `0f6bbb1`, `fe04ccb` | 2026-11-14 |
| m12-dashboard: dashboard analytics for officials | taken over by P2 | — | P2 implemented it in `0e3a331` (`services/api/src/modules/m12-dashboard/`); no longer a P4 task | 2026-11-14 |
| Tiger Data / M12 check (read-only): our `.env` has no `DATABASE_URL` (only P2 has the Tiger Cloud credentials; no deployed server address in the repo), so the API runs in memory and `/v1/core/tiger/status` returns `status: "mock"` with simulated tables and numbers. `scripts/migrate.sh` and `scripts/migrate_tiger.py` only apply core, m04, m05 and parkie: the m03/m06 hypertable migrations are not in the list, so they were never run by those scripts. M12 (`/v1/m/dashboard/overview`, P2's code, P4 owner in the app manifest) shows real in-memory parking/outage/detour counts, but its Tiger block is hard-coded (`compression_ratio: "94.8%"`, `continuous_aggregates_active: 2`), PM2.5/noise fall back to fixed 19.8 / 58.4 without a database, the heatmap's environment values are fixed, and m03/m06 data is not shown | done (check) | `p4/polish` | pending | 2026-11-14 |
| Tiger Cloud live: `DATABASE_URL` from P2 added to our local `.env` (TimescaleDB 2.32.0; P2's 3 hypertables with 51,600 parking events and 5,208 city metrics, 2 continuous aggregates). Ran `db/modules/m03-safety/migrations/0001_init_safety.sql` and `db/modules/m06-smell/migrations/0001_init_smell.sql` (24 statements, all OK): `m03_safety.reports` and `m06_smell.reports` are hypertables with hourly continuous aggregates, compression (7 days) and retention (90 days). On `server.ts` both `/health` say `postgres`, `/v1/core/tiger/status` says `connected` and lists 5 hypertables / 4 aggregates; one test report each was written to and read from Tiger Cloud, then deleted (0 rows left) | done | — (database only, no code change) | — | 2026-11-14 |
| Shared fixes after main's UI updates: Events "Show on the map" sends the event's spot (`lat`/`lng`/`zoom`) so the map flies to it and opens the pin (main's `1387d78` fixed `createEvent` and the props itself, so we kept main's file); `Sheet.tsx` and `TabBar.tsx` use `StyleSheet.absoluteFill` again (main brought `absoluteFillObject` back). App and API typecheck 0 errors, `test_p2.py` passes on `server.ts`, 12 screens load without console errors, Events browser test 8/8 | done | `p4/polish` | `2ca8f53`, `9d0b7cc`, `960cddb`, `5125691`, `4f9b7ac`, merges `74e7488`, `8145391`; merged into main via PR #9 (`76fbd88`), CI green; branch deleted | 2026-11-14 |
| Tiger numbers made real (`p4/tiger`): M12 `/v1/m/dashboard/overview` now reads PM2.5 / noise as the 24 h average of P2's `city_metrics_hourly_stats` continuous aggregate (it looked for `noise`, but the data is `noise_db`, so noise was always the fixed 58.4), and the Tiger block from `db.getTigerStatus()` (real compression 74.5% instead of the hand-typed 94.8%, 5 hypertables, 4 aggregates, version), with `status` / `simulated` / `source` fields so nothing simulated looks live; new `community_reports` (m06 smell + m03 safety, 7 days, real vs demo, storage). Old fields kept. Heatmap environment points marked `source: "simulated"`. Web staff dashboard (`apps/web` Admin → Database): showed "Fallback (offline)" even when live (checked `tiger.connected`, the API sends `status`) and defaulted to 3 / 2; now shows live status, compression, hypertable names, PM2.5 / noise and smell / safety counts, or a "Simulated" note. App M12 screen gets the same labels (since `1387d78` staff cannot sign in inside the app, so that screen is only reachable on the website). m03/m06 migrations added to `scripts/migrate.sh` and `scripts/migrate_tiger.py`. Tested on `server.ts` with and without Tiger Cloud, `test_p2.py` passes, typecheck 0 errors | done | `p4/tiger` | pending | 2026-11-14 |
| Shared fixes after merging main (`f125070`, `6b1a7cf`) into `p4/tiger`: (1) CI was red on main: `scripts/test_p2.py` (and `test_p2_full.py`) posted parking camera detections as a resident (staff-only since `1387d78`) and uploaded photos without a login (now required); the tests now use `dev_admin` for detections and send a token on upload. (2) Every web page of the app crashed on Expo's server render ("window is not defined") because `apps/app/src/core/api.ts` `apiBaseUrl()` read `window.location` there; it now falls back to `http://localhost:8000` when there is no window. Merge conflicts in `AdminView.js` (imports) and `DashboardScreen.tsx` (API address) kept both sides. Re-checked: typecheck 0, `test_p2.py` passes, website Database tab live, 12 app screens draw, Events test 8/8 | done | `p4/tiger` | pending | 2026-11-14 |
| Guided tour home tile (`/m/tour`) | skipped for now | — | the screen stays hidden; only a placeholder stop exists | 2026-11-14 |
| Pitch evidence: Living Labs numbers, changelog, demo script | to do | — | from `/v1/m/feedback/summary` and `docs/living-labs/living-labs-log.md` | — |

## How to run

```bash
# Install (pnpm, workspace packages use "*" versions so linking must be on)
npx pnpm@9.15.0 install --config.lockfile=false --config.link-workspace-packages=true

# API with all modules, http://localhost:3001 (reads the repo-root .env)
npm run dev:hono --prefix services/api

# App in the browser, http://localhost:8081 (needs the API running)
cd apps/app && npx expo start --web
```

- `.env` needs `GEMINI_API_KEY` (assistant) and `FEEDBACK_INGEST_TOKEN` (survey ingest); see `.env.example`.
- On a phone, set `EXPO_PUBLIC_API_URL=http://<laptop-LAN-IP>:3001` in `apps/app/.env`.
- Visitor info text lives in `docs/visitor-info/content.md`. After editing it, regenerate the seed: `cd services/api && npx tsx src/modules/m02-visitor-info/generate-seed.ts`.
- P2's tests: `npm test` and `python3 scripts/test_p2_full.py` (they start the old `server.ts` on port 8000 themselves).
- On Windows, start Expo from PowerShell or cmd, not Git Bash: Git Bash passes a lowercase drive letter (`d:`) that Metro joins with `D:` and fails to resolve routes.
- CI (`.github/workflows/ci.yml`) runs `npm install`, then `node --experimental-strip-types services/api/src/server.ts`, then `python3 scripts/test_p2.py`.
  Strip-types mode needs `.ts` on every relative import, `import type` for type-only imports, and no `enum`s or constructor parameter properties in any file `server.ts` loads.
- m06-smell storage: `GET /v1/m/smell/health` says whether reports go to Postgres or memory and why.

## Shared map: how m06 smell pins reach P1's Map tab

P1's contract (`apps/app/src/core/map-layers/index.ts`, `collectModuleLayers`): `manifest.mapLayer` is a `MapLayer` from `@hub/map`,
or a synchronous function returning one. m06 uses the function form (`apps/app/src/modules/m06-smell/mapLayer.ts`):

- a small pins cache, filled from `GET /v1/m/smell/pins?hours=24&includeDemo=true` when the app starts, refreshed after a report is sent
  and whenever the map asks for the layer and the cache is older than 60 s;
- each pin: `kind: 'smell'`, `layerId: 'm06-smell'`, `coordinate`, title `Miros: <type>`, subtitle `<Type>, intensitate n/5`,
  `href: '/m/smell'`, `owner: 'community'`, `visibility: 'public'`, `demo` from the API's `isDemo` (the map shows "Sample data for the demo.").

**Change in P1's files (tell P1):** the Map tab built its module layers once (`useMemo(() => allMapLayers(), [])`), so pins fetched after the
tab mounted, or a new report, never appeared. Fix:

1. New file `apps/app/src/core/map-layers/changes.ts` (no imports): `onMapLayersChanged(listener)`, `getMapLayersVersion()`, `notifyMapLayersChanged()`.
2. `apps/app/app/(tabs)/map.tsx`: one import, and
   ```tsx
   const layersVersion = React.useSyncExternalStore(onMapLayersChanged, getMapLayersVersion, getMapLayersVersion);
   const moduleLayers = React.useMemo(() => allMapLayers(), [layersVersion]);
   ```
   `useSyncExternalStore` (not a `useEffect` subscription) because the first fetch can finish between the first render and the subscription.

Any other module with remote pins can do the same: cache, then call `notifyMapLayersChanged()` after each fetch.

## Known issues

| Issue | Owner | What's needed |
| --- | --- | --- |
| Two API servers: `server.ts` (port 8000, Docker, P2's tests) has uploads, Tiger Data, open-data and parkie routes; `index.ts` (port 3001) has all modules and real auth | P2 | Move `server.ts` routes into Hono, run `index.ts` with `tsx` in Docker, delete `server.ts` |
| `pnpm-lock.yaml` on main doesn't include `@google/genai` (api) or `@types/react` (ui) | P2 / P1 | Regenerate the lockfile after merging |
| Solana organizer secret key: main now reads it from `.env` and deleted `organizer-keypair.json`, but the old devnet key is still in git history | P3 | Treat the old key as public; use a new key for anything beyond devnet |
| Forum, events, buddy and wallet screens show hardcoded data, not the API | P3 | Fetch from `/v1/m/...` |
| The map engine loads MapLibre and tiles from the internet (unpkg); offline it shows its "offline" panel | P1 | Keep in mind for the demo venue's Wi-Fi |
| Tiger Cloud connections sometimes take longer than the 5 s `connectionTimeoutMillis` in `core/db.ts` (seen once on 2026-11-14: queries fell back to simulated numbers for a few minutes; status checks take 1–3 s) | P2 | Raise the timeout to ~15 s; open the dashboard once before the demo to warm the connection |
| Team rule since `1387d78`: staff accounts act on the website, not in the app. Our notice scanner's "Mod operator (demo)" still publishes from the app (`/notice/confirm` does not pass the client to `resolveAuthUser`), which the demo script relies on | P4 | Decide: keep for the demo, or move "publish" to the website's staff dashboard |
| `scripts/migrate.sh` and `scripts/migrate_tiger.py` have CRLF line endings, so `migrate.sh` cannot run under bash as-is | P2 | Save them with LF (`.gitattributes` `*.sh text eol=lf`) |
| Anyone running the API without `DATABASE_URL` (CI, teammates without the key) gets memory mode and a `mock` Tiger status; the Vultr server needs `DATABASE_URL` in its environment for the live demo | P2 | Check the deployed server's environment |
| The M12 heatmap's environment points (PM2.5 / noise per area) are still fixed illustration values (now marked `source: "simulated"`) | P4 | Build them per area from `city_metrics_hourly_stats` if the heatmap is shown in the demo |
| `packages/solana/src/organizer-key.ts` must not import `react-native-get-random-values`: `server.ts` loads that file and the polyfill cannot run in Node, which crashed the server in CI ("Server unreachable", red from `170d8de` to `e979c8f`) | P1 / P3 | If phones need the polyfill (Hermes has no `crypto.getRandomValues`), import it in the app's entry file, not in the shared Solana package |
| Wallet demo data: the app's cinema ticket (`tkt-sol-faber-001`, signature `4zWVYb…`) does not exist on Solana devnet; the jazz ticket and both POAPs do. The assistant says so instead of showing a dead link | P3 | Mint the cinema ticket again on devnet and update the signature in `ticketStore.ts` and `m09-wallet/seed.ts` |
| `P3_SUMMARY.txt` still links `/v1/m/wallet/tkt-sol-demo-001` (that made-up demo ticket was replaced) | P3 | Use `tkt-sol-jazz-002` in the example |
| P2's Colterm worker calls `gemini-1.5-flash` with the key in the URL; that model is retired, so it always uses the keyword fallback | P2 | Use `@google/genai` with `gemini-3.5-flash-lite` like m10, key in the header |
| `packages/contracts/src/zod-shim.ts` uses a top-level `await import('zod')`; any app file that value-imports from `@hub/contracts` breaks the web build (500). CI does not build the app, so it stays green | P2 | Make the shim synchronous, or keep app imports type-only / from the seed files; add an Expo web export to CI |
| P2's Utilities screen reads outages from `http://localhost:8000` (hard-coded) while P4 screens use `EXPO_PUBLIC_API_URL` (default 3001); the notice scanner uses 8000 so its alerts appear there. For the demo set `EXPO_PUBLIC_API_URL=http://localhost:8000` so everything uses one server | P2 / P4 | Use one API URL setting in every screen |
| Notice scanner and voice are web-only (phone needs `expo-image-picker` / `expo-audio`) | P4 | Add when testing on a device |
| Place matcher does not understand house-number ranges: "Văcărescu 12" does not match "nr. 1–40" (questions without a number do match) | P4 | Parse "nr. a–b" ranges if needed |
| `absoluteFillObject` keeps coming back in `packages/ui` (`TabBar.tsx`, `Sheet.tsx`) with UI updates; it is not in this React Native's types, so the app typecheck fails (CI does not typecheck the app, so it stays green) | P1 / zaqq15 | Use `StyleSheet.absoluteFill`; we re-fix it after each merge |
| `scripts/verify-all.mjs` (P2) imports `pg` from the repo root, which only an npm install provides; with the pnpm install it stops at start. Not part of CI | P2 | Run it with `npm install` or move it under `services/api` |
| Seed Colterm outage restore time (13 Nov 22:00) is in the past | P2 | Refresh seed dates |
| Voice is web-only: on the phone the mic and speaker buttons are hidden (playing a POST response and recording need `expo-audio` + `expo-file-system`, not installed) | P4 | Add `expo-audio` and a GET/file-based playback path when we test on a device |
| ElevenLabs Creator quota: 131,000 characters / month (resets 13 Dec); `eleven_multilingual_v2` costs 1 credit per character, `eleven_flash_v2_5` 0.5 | P4 | Watch usage; set `ELEVENLABS_MODEL=eleven_flash_v2_5` if it gets tight |
| `docs/voice/tour.md` has only a placeholder stop | P4 | Write the real stops (checked facts only) |
| Gemini free tier rate-limits quick repeated questions (503 with a "wait a few seconds" message); the safety summary shares the same key | P4 | Space questions out in the demo; summaries are cached 10 minutes |
| Rate limits live in memory per API process (reset on restart, not shared between instances) | P4 | Fine for the demo; a shared store (Postgres/Redis) if the API ever runs as several instances |
| Missing `favicon.ico` (404 on web) | P1 | Add one |
| Header back button on module screens is labelled "(tabs), back" (the tabs group has no title), which screen readers read out | P1 | Give `(tabs)` a title in `app/_layout.tsx`, e.g. `options={{ title: 'Home' }}` |
