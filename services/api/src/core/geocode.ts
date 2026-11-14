// Turns a place name or address into coordinates, so an event can be tied to the place that actually holds it.
// It asks OpenStreetMap's Nominatim from the server (so the app never sends the person's details to a third party, and the
// public service sees one polite client). Results are cached, searches are limited to the city's box, and Nominatim's
// usage policy is followed: an identifying User-Agent and at most one request per second.
const BOUNDS = (process.env.CITY_BOUNDS || '20.9,45.95,21.55,45.55').split(',').map(Number); // west,north,east,south
const CITY = process.env.CITY_NAME || 'Timișoara';
const USER_AGENT = process.env.GEOCODE_USER_AGENT || 'hop-city-app/1.0 (hackathon demo)';

export interface GeocodeResult {
  found: boolean;
  latitude?: number;
  longitude?: number;
  displayName?: string;
}

const cache = new Map<string, GeocodeResult>();
let lastCall = 0;

export async function geocode(query: string): Promise<GeocodeResult> {
  const q = query.trim().replace(/\s+/g, ' ').slice(0, 160);
  if (q.length < 3) return { found: false };
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;

  // one request per second, queued
  const wait = Math.max(0, lastCall + 1100 - Date.now());
  lastCall = Date.now() + wait;
  if (wait) await new Promise((r) => setTimeout(r, wait));

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', /\b(timi[sș]oara)\b/i.test(q) ? q : `${q}, ${CITY}`);
  url.searchParams.set('viewbox', BOUNDS.join(','));
  url.searchParams.set('bounded', '1');
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' }, signal: AbortSignal.timeout(6000) });
    const rows: any[] = res.ok ? ((await res.json()) as any[]) : [];
    const first = rows[0];
    const result: GeocodeResult = first ? { found: true, latitude: Number(first.lat), longitude: Number(first.lon), displayName: String(first.display_name) } : { found: false };
    cache.set(key, result);
    return result;
  } catch {
    return { found: false }; // not cached: a later try may work
  }
}
