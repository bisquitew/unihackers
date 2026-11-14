# P4 progress: AI, voice and civic reports

Owner: P4. Updated with every P4 feature or fix. Hashes are short commit ids; "pending" means changed in the working tree but not committed yet.

Last updated: 2026-11-14 · working branch: `p4/next`

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
| P4 modules on `server.ts` (port 8000, Docker/CI): P2 copied m02/m06/m10/m11 routes by hand in `04ba747`, which skipped validation, the survey ingest token (anyone could post fake survey answers), `await` on feedback summary/changelog (returned `{}`) and the `includeDemo` default. Now `server.ts` forwards those paths to the same Hono routers as port 3001; m11 relative imports got `.ts` so they load under `node --experimental-strip-types` | done | `p4/next` | pending | 2026-11-14 |
| One API server (merge `server.ts` into `index.ts`) | partly | — | owner P2. `server.ts` now serves every module's routes (P4's through the shared Hono routers), but there are still two entry points | — |
| ElevenLabs voice: spoken assistant replies, alerts, tour | to do | — | — | — |
| m03-safety: reports + Gemini summary per area | to do | — | — | — |
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
- If `npx` fails inside the repo with "Cannot read properties of null (reading 'package')" (see Known issues), start the web app from PowerShell instead:
  `cd apps/app; $env:NODE_PATH="$PWD\..\..\node_modules\.pnpm\node_modules"; node node_modules\expo\bin\cli start --web`
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
| Assistant on port 8000 (`server.ts`, Docker/CI) fails: it loads the module registry, and P3's `m01-events`, `m07-buddy`, `m08-forum`, `m09-wallet` import `./routes`, `./service` etc. without `.ts`, which `node --experimental-strip-types` cannot resolve (works on 3001 with `tsx`) | P3 | Add `.ts` to relative imports in those modules (P2 did the same for m11 in `04ba747`) |
| `toqr` (used by `m09-wallet/QRCodeView.tsx`) is not declared in `apps/app/package.json`; only npm's hoisting finds it, so a pnpm install cannot bundle the web app | P3 | Add `"toqr": "^0.1.1"` to `apps/app/package.json` |
| `packages/ui/src/TabBar.tsx` is back to `StyleSheet.absoluteFillObject` (removed in RN 0.88) after P3's merge `170d8de` | P1 / P3 | `...StyleSheet.absoluteFill` |
| Tiger Data is simulated (`[MOCK]`), no `DATABASE_URL` locally | P2 | Share the connection string |
| `pnpm-lock.yaml` on main doesn't include `@google/genai` (api) or `@types/react` (ui) | P2 / P1 | Regenerate the lockfile after merging |
| `apps/app` typecheck: 17 errors in P1's new `packages/map` (`react` types and `react-native-svg` not resolvable from that package; implicit `any`s that follow) | P1 | Add `@types/react` and `react-native-svg` to `packages/map/package.json` (same fix as `packages/ui` earlier) |
| `packages/ui/src/Sheet.tsx` uses `StyleSheet.absoluteFillObject`, removed in RN 0.88 (typecheck error; at runtime the spread is empty, so the sheet's scrim may not cover the screen) | P1 | `...StyleSheet.absoluteFill`, as in `TabBar.tsx` |
| `apps/app` typecheck: `Buffer` not found in `packages/solana/src/real-solana.ts` (2 errors; the app's mint path doesn't call it) | P3 | `import { Buffer } from 'buffer'` in that file |
| Solana organizer secret key: main now reads it from `.env` and deleted `organizer-keypair.json`, but the old devnet key is still in git history | P3 | Treat the old key as public; use a new key for anything beyond devnet |
| Forum, events, buddy and wallet screens show hardcoded data, not the API | P3 | Fetch from `/v1/m/...` |
| The map engine loads MapLibre and tiles from the internet (unpkg); offline it shows its "offline" panel | P1 | Keep in mind for the demo venue's Wi-Fi |
| m06 Postgres storage is untested against a real database (no `DATABASE_URL`); memory mode and the unreachable-database fallback are tested | P2 / P4 | Run `db/modules/m06-smell/migrations/0001_init_smell.sql` on Tiger Data, set `DATABASE_URL`, check `/v1/m/smell/health` says `postgres` |
| `npx` fails inside the repo ("Cannot read properties of null (reading 'package')", npm reading pnpm's symlinks), and pnpm's Git Bash shims in `node_modules/.bin` use `/mnt/d/...` paths, so `expo` started from Git Bash cannot find `babel-preset-expo` | P1 (app deps) | Add `babel-preset-expo` to `apps/app` devDependencies (it is used in `babel.config.js` but not declared); until then use the PowerShell command in "How to run" |
| Seed Colterm outage restore time (13 Nov 22:00) is in the past | P2 | Refresh seed dates |
| Gemini free tier rate-limits quick repeated questions (503 with a "wait a few seconds" message) | P4 | Space questions out in the demo |
| Missing `favicon.ico` (404 on web) | P1 | Add one |
| Header back button on module screens is labelled "(tabs), back" (the tabs group has no title), which screen readers read out | P1 | Give `(tabs)` a title in `app/_layout.tsx`, e.g. `options={{ title: 'Home' }}` |
