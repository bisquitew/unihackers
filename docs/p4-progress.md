# P4 progress: AI, voice and civic reports

Owner: P4. Updated with every P4 feature or fix. Hashes are short commit ids; "pending" means changed in the working tree but not committed yet.

Last updated: 2026-11-14 · working branch: `p4/visitor-info`

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
| m06-smell: one-tap reports (type, intensity, area or location), repository with memory / Postgres (`core/db.ts`) + fallback, ~60 demo reports (`isDemo`, `?includeDemo=false`), pins / areas / timeseries / wind (Open-Meteo, 10 min cache, mock fallback) / source hint / health API, `get_smell_reports` tool + prompt topic, screen with wind arrow, hint, area bars and 24 h chart, demo toggle and label, `useSmellPins` + `manifest.mapLayer` for the shared map, home tile, hypertable migration (not run) | done | `p4/smell` | pending | 2026-11-14 |
| One API server (merge `server.ts` into `index.ts`) | to do | — | owner P2; plan in "Known issues" | — |
| ElevenLabs voice: spoken assistant replies, alerts, tour | to do | — | — | — |
| m03-safety: reports + Gemini summary per area | to do | — | — | — |
| m12-dashboard: web dashboard for officials | to do | — | needs real Tiger Data | — |
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

## Shared map: what P1's Map tab needs to call (m06-smell pins)

The Map tab (`apps/app/app/(tabs)/map.tsx`) is still a "Coming soon" placeholder and the app has no map library, so m06 ships data only, no map.
Every module that has pins puts a `mapLayer` in its manifest; m06's is:

```ts
// apps/app/src/modules/m06-smell/manifest.ts
mapLayer: { id: 'm06-smell', label: 'Mirosuri', usePins: useSmellPins, legend: [{ id, label, color }, ...] }
```

In the Map tab, render one small component per layer (so each hook is called once, in a stable order):

```tsx
import { registeredModuleManifests } from '../../src/modules';
const layers = registeredModuleManifests.filter((m) => m.mapLayer).map((m) => m.mapLayer);

function LayerPins({ layer }) {
  const { pins, demoCount } = layer.usePins({ hours: 24, includeDemo: true }); // re-fetches every 60 s
  // draw each pin at (pin.lat, pin.lng) in pin.color; pin.label is the callout / accessible name
  // when demoCount > 0, show a "date demo" label on the map
}
```

Pin fields: `id, lat, lng, type, intensity (1–5), createdAt, areaId, color, label`. Source: `GET /v1/m/smell/pins?hours=24&includeDemo=true`.

## Known issues

| Issue | Owner | What's needed |
| --- | --- | --- |
| Two API servers: `server.ts` (port 8000, Docker, P2's tests) has uploads, Tiger Data, open-data and parkie routes; `index.ts` (port 3001) has all modules and real auth | P2 | Move `server.ts` routes into Hono, run `index.ts` with `tsx` in Docker, delete `server.ts` |
| Docker/Vultr deploy has no P3 or P4 modules (it runs `server.ts`) | P2 | Same as above |
| Tiger Data is simulated (`[MOCK]`), no `DATABASE_URL` locally | P2 | Share the connection string |
| `pnpm-lock.yaml` on main doesn't include `@google/genai` (api) or `@types/react` (ui) | P2 / P1 | Regenerate the lockfile after merging |
| `apps/app` typecheck: 7 errors in `src/core/Auth0SecurityCard.tsx` (uses `radii.md`/`radii.sm`/`shadows.card`, which `@hub/ui` tokens don't have) | Auth0 author (`6ae326f`) | Use existing tokens (`radii.input`, `radii.group`, `shadows.lift`) or add the tokens to `packages/ui` with P1 |
| `apps/app` typecheck: `Buffer` not found in `packages/solana/src/real-solana.ts` (2 errors; the app's mint path doesn't call it) | P3 | `import { Buffer } from 'buffer'` in that file |
| Solana organizer secret key: main now reads it from `.env` and deleted `organizer-keypair.json`, but the old devnet key is still in git history | P3 | Treat the old key as public; use a new key for anything beyond devnet |
| Forum, events, buddy and wallet screens show hardcoded data, not the API | P3 | Fetch from `/v1/m/...` |
| Map, Community and Profile tabs are "Coming soon"; no map library in the app yet, so smell pins are not drawn anywhere | P1 | Shared map in the Map tab that renders every manifest's `mapLayer` (see "Shared map" above) |
| m06 Postgres storage is untested against a real database (no `DATABASE_URL`); memory mode and the unreachable-database fallback are tested | P2 / P4 | Run `db/modules/m06-smell/migrations/0001_init_smell.sql` on Tiger Data, set `DATABASE_URL`, check `/v1/m/smell/health` says `postgres` |
| `npx` fails inside the repo ("Cannot read properties of null (reading 'package')", npm reading pnpm's symlinks), and pnpm's Git Bash shims in `node_modules/.bin` use `/mnt/d/...` paths, so `expo` started from Git Bash cannot find `babel-preset-expo` | P1 (app deps) | Add `babel-preset-expo` to `apps/app` devDependencies (it is used in `babel.config.js` but not declared); until then use the PowerShell command in "How to run" |
| Seed Colterm outage restore time (13 Nov 22:00) is in the past | P2 | Refresh seed dates |
| Gemini free tier rate-limits quick repeated questions (503 with a "wait a few seconds" message) | P4 | Space questions out in the demo |
| Missing `favicon.ico` (404 on web) | P1 | Add one |
| Header back button on module screens is labelled "(tabs), back" (the tabs group has no title), which screen readers read out | P1 | Give `(tabs)` a title in `app/_layout.tsx`, e.g. `options={{ title: 'Home' }}` |
