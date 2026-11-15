import { areaAlertsService } from './area-alerts.ts';
import { safePlaces, SAFE_PLACE_LABEL, type SafePlaceKind } from './safe-places.ts';

/**
 * Directions inside the city. The line itself comes from OpenStreetMap's public routing servers (OSRM, one for each way of
 * getting around). What is ours is what we do with it: we know where the danger and works zones are and where the hospitals,
 * police and fire stations are, so a route
 *   - says when it passes through a zone,
 *   - is re-routed around the danger zones when that is possible (works zones are only warned about: people can still walk
 *     through a worksite's edge, and cars are usually let through),
 *   - lists the help that is close to the way.
 * Only coordinates go to the routing server, never who is asking. Answers are remembered for two minutes.
 */

export type RouteMode = 'foot' | 'bike' | 'car';
export type LngLat = [number, number];

export interface RouteStep {
  /** English sentence, e.g. "Turn left onto Strada Memorandumului"; the apps translate it */
  instruction: string;
  maneuver: string;
  street: string;
  distance_m: number;
  duration_s: number;
}

export interface RouteWarning {
  alert_id: string;
  title: string;
  type: 'danger' | 'construction';
  severity: string;
  radius_meters: number;
  /** roughly how much of the route lies inside the zone */
  meters_inside: number;
  /** true when the person's own start or end is inside the zone, so it cannot be avoided */
  at_endpoint: boolean;
}

export interface RouteHelp {
  id: string;
  name: string;
  kind: SafePlaceKind;
  label: string;
  /** how far it is from the nearest point of the route */
  meters_from_route: number;
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  mode: RouteMode;
  distance_m: number;
  duration_s: number;
  /** the line, [lng, lat] pairs */
  geometry: LngLat[];
  steps: RouteStep[];
  warnings: RouteWarning[];
  /** the zones we steered round to get this route (empty when the first route was already clear) */
  avoided: { alert_id: string; title: string }[];
  /** true when a danger zone is still on the route because there was no way round it */
  could_not_avoid: boolean;
  help_nearby: RouteHelp[];
}

const USER_AGENT = process.env.GEOCODE_USER_AGENT || 'hop-city-app/1.0 (hackathon demo)';
const SERVER: Record<RouteMode, string> = {
  foot: 'https://routing.openstreetmap.de/routed-foot',
  bike: 'https://routing.openstreetmap.de/routed-bike',
  car: 'https://routing.openstreetmap.de/routed-car',
};

/* ---------- small geometry helpers (flat-earth metres are exact enough inside one city) ---------- */
const M_PER_DEG = 111_320;
const toXY = (p: LngLat, ref: LngLat): [number, number] => [(p[0] - ref[0]) * M_PER_DEG * Math.cos((ref[1] * Math.PI) / 180), (p[1] - ref[1]) * M_PER_DEG];
const fromXY = (xy: [number, number], ref: LngLat): LngLat => [ref[0] + xy[0] / (M_PER_DEG * Math.cos((ref[1] * Math.PI) / 180)), ref[1] + xy[1] / M_PER_DEG];

function haversine(a: LngLat, b: LngLat): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b[1] - a[1]) / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** distance in metres from point `p` to the segment a-b */
function distToSegment(p: LngLat, a: LngLat, b: LngLat): number {
  const P = toXY(p, p);
  const A = toXY(a, p);
  const B = toXY(b, p);
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / len2));
  return Math.hypot(P[0] - (A[0] + t * dx), P[1] - (A[1] + t * dy));
}

/** how far the route runs inside the circle (metres), counting each segment whose midpoint and ends are inside */
function metresInside(line: LngLat[], centre: LngLat, radius: number): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const mid: LngLat = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const inside = [a, mid, b].filter((p) => haversine(p, centre) <= radius).length;
    if (inside > 0) total += haversine(a, b) * (inside / 3);
  }
  return Math.round(total);
}

/** Douglas-Peucker: far fewer points for the same line (tolerance in metres) */
function simplify(line: LngLat[], tolerance = 4): LngLat[] {
  if (line.length <= 2) return line;
  const keep = new Array(line.length).fill(false);
  keep[0] = keep[line.length - 1] = true;
  const stack: [number, number][] = [[0, line.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let worst = 0;
    let at = -1;
    for (let i = s + 1; i < e; i++) {
      const d = distToSegment(line[i], line[s], line[e]);
      if (d > worst) {
        worst = d;
        at = i;
      }
    }
    if (at > -1 && worst > tolerance) {
      keep[at] = true;
      stack.push([s, at], [at, e]);
    }
  }
  return line.filter((_, i) => keep[i]);
}

/* ---------- the routing server ---------- */
interface RawRoute {
  distance: number;
  duration: number;
  geometry: { coordinates: LngLat[] };
  legs: { steps: any[] }[];
}

async function ask(mode: RouteMode, points: LngLat[], alternatives = false): Promise<RawRoute[]> {
  const path = points.map((p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`).join(';');
  const url = `${SERVER[mode]}/route/v1/driving/${path}?overview=full&geometries=geojson&steps=true&alternatives=${alternatives ? 'true' : 'false'}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error(`routing server answered ${res.status}`);
  const body: any = await res.json();
  if (body.code !== 'Ok' || !Array.isArray(body.routes) || body.routes.length === 0) throw new Error(body.code === 'NoRoute' ? 'no_route' : 'routing_failed');
  return body.routes;
}

/* ---------- turning the server's steps into plain sentences ---------- */
function sentence(step: any): { instruction: string; maneuver: string; street: string } {
  const m = step.maneuver ?? {};
  const type: string = m.type ?? 'continue';
  const mod: string = m.modifier ?? '';
  const street = String(step.name ?? '').trim();
  const onto = (text: string) => (street ? `${text} onto ${street}` : text);
  let instruction: string;
  if (type === 'depart') instruction = street ? `Start on ${street}` : 'Start';
  else if (type === 'arrive') instruction = 'Arrive at your destination';
  else if (type === 'roundabout' || type === 'rotary' || type === 'roundabout turn') instruction = street ? `Take the roundabout onto ${street}` : 'Take the roundabout';
  else if (mod === 'uturn') instruction = 'Make a U-turn';
  else if (mod === 'left') instruction = onto('Turn left');
  else if (mod === 'right') instruction = onto('Turn right');
  else if (mod === 'slight left') instruction = onto('Bear left');
  else if (mod === 'slight right') instruction = onto('Bear right');
  else if (mod === 'sharp left') instruction = onto('Make a sharp left');
  else if (mod === 'sharp right') instruction = onto('Make a sharp right');
  else instruction = street ? `Continue on ${street}` : 'Continue straight';
  return { instruction, maneuver: `${type}${mod ? ` ${mod}` : ''}`, street };
}

function stepsOf(route: RawRoute): RouteStep[] {
  const out: RouteStep[] = [];
  for (const leg of route.legs) {
    for (const s of leg.steps) {
      const { instruction, maneuver, street } = sentence(s);
      out.push({ instruction, maneuver, street, distance_m: Math.round(s.distance ?? 0), duration_s: Math.round(s.duration ?? 0) });
    }
  }
  return out;
}

/* ---------- the zones ---------- */
interface Zone {
  id: string;
  title: string;
  type: 'danger' | 'construction';
  severity: string;
  centre: LngLat;
  radius: number;
}

function activeZones(): Zone[] {
  return areaAlertsService
    .getAll({ status: 'active' })
    .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude) && a.radius_meters > 0)
    .map((a) => ({ id: a.id, title: a.title, type: a.type as 'danger' | 'construction', severity: String(a.severity), centre: [a.longitude, a.latitude] as LngLat, radius: a.radius_meters }));
}

function crossing(line: LngLat[], zones: Zone[], from: LngLat, to: LngLat): RouteWarning[] {
  const out: RouteWarning[] = [];
  for (const z of zones) {
    const inside = metresInside(line, z.centre, z.radius);
    const atEnd = haversine(from, z.centre) <= z.radius || haversine(to, z.centre) <= z.radius;
    if (inside >= 15 || (atEnd && inside > 0)) {
      out.push({ alert_id: z.id, title: z.title, type: z.type, severity: z.severity, radius_meters: z.radius, meters_inside: inside, at_endpoint: atEnd });
    }
  }
  return out;
}

/**
 * Points beside a zone, on either side of the straight line from the start to the end, to steer a route round it. A single
 * point at the circle's edge is not enough (the two legs to it would still cut across the circle), so the point is pushed out
 * far enough that both legs clear the zone; `reach` widens it again when the first try still runs through.
 */
function detourPoints(z: Zone, from: LngLat, to: LngLat, reach: number): LngLat[] {
  const A = toXY(from, z.centre);
  const B = toXY(to, z.centre);
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const r = z.radius + 80;
  // a leg from a point `a` metres from the centre reaches the clear distance r when the corner is at least r*a/sqrt(a^2-r^2) out
  const out = (a: number) => (a > r * 1.15 ? (r * a) / Math.sqrt(a * a - r * r) : r * 3);
  const d = Math.max(r, out(Math.hypot(A[0], A[1])), out(Math.hypot(B[0], B[1]))) * reach;
  return [1, -1].map((side) => fromXY([nx * d * side, ny * d * side], z.centre));
}

/** the help (hospital, police, fire) closest to the route, within 700 m of it, nearest first */
function helpAlong(line: LngLat[]): RouteHelp[] {
  const found = safePlaces
    .map((p) => {
      let best = Infinity;
      for (let i = 1; i < line.length; i++) best = Math.min(best, distToSegment([p.longitude, p.latitude], line[i - 1], line[i]));
      return { p, d: best };
    })
    .filter((x) => x.d <= 700)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
  return found.map(({ p, d }) => ({ id: p.id, name: p.name, kind: p.kind, label: SAFE_PLACE_LABEL[p.kind], meters_from_route: Math.round(d), latitude: p.latitude, longitude: p.longitude }));
}

/* ---------- the route ---------- */
const cache = new Map<string, { at: number; result: RouteResult }>();
const TTL_MS = 2 * 60_000;

export class RouteError extends Error {
  code: 'no_route' | 'routing_failed';
  constructor(code: 'no_route' | 'routing_failed', message: string) {
    super(message);
    this.code = code;
  }
}

export async function planRoute(from: LngLat, to: LngLat, mode: RouteMode, avoid = true): Promise<RouteResult> {
  const zonesVersion = areaAlertsService.getAll({ status: 'active' }).map((a) => a.id).join(',');
  const key = `${mode}|${avoid}|${from.map((n) => n.toFixed(4))}|${to.map((n) => n.toFixed(4))}|${zonesVersion}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.result;

  let routes: RawRoute[];
  try {
    routes = await ask(mode, [from, to], true);
  } catch (err: any) {
    throw new RouteError(err.message === 'no_route' ? 'no_route' : 'routing_failed', err.message === 'no_route' ? 'No way to get there that way.' : 'The routing service is not answering. Try again in a moment.');
  }

  const zones = activeZones();
  const dangers = zones.filter((z) => z.type === 'danger');
  const dangerHits = (line: LngLat[]) => crossing(line, dangers, from, to).filter((w) => !w.at_endpoint);

  let chosen = routes[0];
  let line = chosen.geometry.coordinates;
  const avoided: { alert_id: string; title: string }[] = [];
  let could_not_avoid = false;

  const firstHits = dangerHits(line);
  if (avoid && firstHits.length > 0) {
    let better: RawRoute | null = null;
    // 1. one of the routing server's own alternatives that stays out of the danger zones
    for (const alt of routes.slice(1)) if (dangerHits(alt.geometry.coordinates).length === 0) { better = alt; break; }
    // 2. steer round the first zone (either side), then check again
    if (!better) {
      const hitZone = zones.find((z) => z.id === firstHits[0].alert_id);
      if (hitZone) {
        search: for (const reach of [1, 1.4, 1.9]) {
          for (const wp of detourPoints(hitZone, from, to, reach)) {
            try {
              const [via] = await ask(mode, [from, wp, to], false);
              if (dangerHits(via.geometry.coordinates).length === 0 && via.distance < chosen.distance * 2.5 + 500) {
                better = via;
                break search;
              }
            } catch {
              /* that side has no road: try the other */
            }
          }
        }
      }
    }
    if (better) {
      chosen = better;
      line = better.geometry.coordinates;
      for (const h of firstHits) avoided.push({ alert_id: h.alert_id, title: h.title });
    } else could_not_avoid = true;
  }

  const result: RouteResult = {
    mode,
    distance_m: Math.round(chosen.distance),
    duration_s: Math.round(chosen.duration),
    geometry: simplify(line),
    steps: stepsOf(chosen),
    warnings: crossing(line, zones, from, to),
    avoided,
    could_not_avoid: could_not_avoid && crossing(line, dangers, from, to).length > 0,
    help_nearby: helpAlong(line),
  };
  cache.set(key, { at: Date.now(), result });
  if (cache.size > 200) cache.delete(cache.keys().next().value as string);
  return result;
}
