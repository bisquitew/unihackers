# P4 progress: AI, voice and civic reports

Owner: P4. Updated with every P4 feature or fix. Hashes are short commit ids; "pending" means changed in the working tree but not committed yet.

Last updated: 2026-11-14 · working branch: `p4/voice` (based on `p4/safety`, whose PR is not merged yet)

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
| ElevenLabs voice (m10): `POST /tts` (`eleven_multilingual_v2`, voice Sarah `EXAVITQu4vr4xnSDxMaL`, overridable by `ELEVENLABS_MODEL` / `ELEVENLABS_VOICE_ID`; markdown stripped, max 800 spoken chars cut at a sentence end, in-memory cache by hash, 40 / 10 min), `POST /stt` (`scribe_v3`, multipart or raw audio, max 10 MB, 20 / 10 min), `GET /voice` (configured or not), `GET /tour` (`docs/voice/tour.md`); 401 / 429 / quota → clear 503; no key → 503 "voice not configured" and text chat keeps working; key only server-side. App (web): mic (tap to record, max 30 s) → `/stt` → chat, 🔊 on each reply, "auto-read answers" toggle; Listen buttons on outage and transit cards; `/m/tour` screen with one placeholder stop | done | `p4/voice` | pending | 2026-11-14 |
| m03-safety: reports about places (poor lighting, noise at night, abandoned building, feeling unsafe, other) by area or location; note max 200 chars with contact details/plates/links removed and a "describe the place, not people" rule in the UI; memory / Postgres + fallback like m06; ~65 demo reports over 7 days, mostly 19:00–03:00, Gara de Nord / Complex / Iosefin; routes `POST /reports` (rate-limited), `GET /reports`, `/pins`, `/areas`, `/summary?area=&lang=` (Gemini from counts only, never notes; 10 min cache; no-key fallback with counts per type; 429 → 503), `/health`; `get_safety_reports` tool + cautious prompt line; screen with report form, area list, RO/EN summary, demo toggle; `safety` map layer through `changes.ts`; home tile; hypertable migration (not run); served on `server.ts` too | done | `p4/safety` | `48f1c97` (API), `cb0c9e9` (prompt), `fe04ccb` (server.ts), `481443f` (screen), `043ff18` (home tile), `f9a05a7` (progress); **PR into main not opened yet** | 2026-11-14 |
| Shared rate limiter `core/rate-limit.ts` (per client, fixed window, only accepted requests count, `Retry-After`): safety 5 reports / 10 min, smell 10 / 10 min. `server.ts` forwards the client address (`x-forwarded-for`) and all router response headers | done | `p4/safety` | `0f6bbb1`, `fe04ccb` | 2026-11-14 |
| m12-dashboard: dashboard analytics for officials | taken over by P2 | — | P2 implemented it in `0e3a331` (`services/api/src/modules/m12-dashboard/`); no longer a P4 task | 2026-11-14 |
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
| Tiger Data is simulated (`[MOCK]`), no `DATABASE_URL` locally | P2 | Share the connection string |
| `pnpm-lock.yaml` on main doesn't include `@google/genai` (api) or `@types/react` (ui) | P2 / P1 | Regenerate the lockfile after merging |
| Solana organizer secret key: main now reads it from `.env` and deleted `organizer-keypair.json`, but the old devnet key is still in git history | P3 | Treat the old key as public; use a new key for anything beyond devnet |
| Forum, events, buddy and wallet screens show hardcoded data, not the API | P3 | Fetch from `/v1/m/...` |
| The map engine loads MapLibre and tiles from the internet (unpkg); offline it shows its "offline" panel | P1 | Keep in mind for the demo venue's Wi-Fi |
| m03/m06 Postgres storage is untested against a real database (no `DATABASE_URL`); memory mode and the unreachable-database fallback are tested | P2 / P4 | Run `db/modules/m06-smell/migrations/0001_init_smell.sql` and `db/modules/m03-safety/migrations/0001_init_safety.sql` on Tiger Data, set `DATABASE_URL`, check `/v1/m/smell/health` and `/v1/m/safety/health` say `postgres` |
| `packages/solana/src/organizer-key.ts` must not import `react-native-get-random-values`: `server.ts` loads that file and the polyfill cannot run in Node, which crashed the server in CI ("Server unreachable", red from `170d8de` to `e979c8f`) | P1 / P3 | If phones need the polyfill (Hermes has no `crypto.getRandomValues`), import it in the app's entry file, not in the shared Solana package |
| Seed Colterm outage restore time (13 Nov 22:00) is in the past | P2 | Refresh seed dates |
| Voice is web-only: on the phone the mic and speaker buttons are hidden (playing a POST response and recording need `expo-audio` + `expo-file-system`, not installed) | P4 | Add `expo-audio` and a GET/file-based playback path when we test on a device |
| ElevenLabs Creator quota: 131,000 characters / month (resets 13 Dec); `eleven_multilingual_v2` costs 1 credit per character, `eleven_flash_v2_5` 0.5 | P4 | Watch usage; set `ELEVENLABS_MODEL=eleven_flash_v2_5` if it gets tight |
| `docs/voice/tour.md` has only a placeholder stop | P4 | Write the real stops (checked facts only) |
| Gemini free tier rate-limits quick repeated questions (503 with a "wait a few seconds" message); the safety summary shares the same key | P4 | Space questions out in the demo; summaries are cached 10 minutes |
| Rate limits live in memory per API process (reset on restart, not shared between instances) | P4 | Fine for the demo; a shared store (Postgres/Redis) if the API ever runs as several instances |
| Missing `favicon.ico` (404 on web) | P1 | Add one |
| Header back button on module screens is labelled "(tabs), back" (the tabs group has no title), which screen readers read out | P1 | Give `(tabs)` a title in `app/_layout.tsx`, e.g. `options={{ title: 'Home' }}` |
