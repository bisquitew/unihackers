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

export interface PlaceMatch {
  id: string;
  name: string;
  detail: string;
  latitude: number;
  longitude: number;
  /** what OpenStreetMap calls it: "road", "pharmacy", "restaurant"... */
  kind: string;
}

const manyCache = new Map<string, { at: number; places: PlaceMatch[] }>();
const MANY_TTL_MS = 10 * 60_000;

/** The first few parts of an OpenStreetMap display name, without the county, country and postcode at the end. */
function shortDetail(display: string, name: string): string {
  const parts = display.split(',').map((p) => p.trim()).filter(Boolean);
  const kept = parts.filter((p) => p !== name && !/^(\d{6}|România|Romania|Timiș|Timis|Județul Timiș|Timișoara)$/i.test(p));
  return kept.slice(0, 3).join(', ');
}

/**
 * Place and address search for the map's search box: up to `limit` matches inside the city's box, best first. Same rules as
 * geocode(): the server asks Nominatim (one polite client, at most one request a second, an identifying User-Agent), and
 * answers are remembered for ten minutes.
 */
export async function searchPlaces(query: string, limit = 6): Promise<PlaceMatch[]> {
  const q = query.trim().replace(/\s+/g, ' ').slice(0, 120);
  if (q.length < 3) return [];
  const key = `${q.toLowerCase()}|${limit}`;
  const hit = manyCache.get(key);
  if (hit && Date.now() - hit.at < MANY_TTL_MS) return hit.places;

  const wait = Math.max(0, lastCall + 1100 - Date.now());
  lastCall = Date.now() + wait;
  if (wait) await new Promise((r) => setTimeout(r, wait));

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', String(Math.max(1, Math.min(10, limit))));
  url.searchParams.set('addressdetails', '1');
  // Nominatim often finds nothing for Romanian text with comma-below letters ("Piața" returns no result, "Piata" does), so the
  // search is sent without diacritics; the names that come back keep theirs.
  const plain = q.normalize('NFD').replace(/[̀-ͯ]/g, '');
  url.searchParams.set('q', /\b(timi[sș]oara)\b/i.test(q) ? plain : `${plain}, ${CITY}`);
  url.searchParams.set('viewbox', BOUNDS.join(','));
  url.searchParams.set('bounded', '1');
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ro,en' }, signal: AbortSignal.timeout(6000) });
    const rows: any[] = res.ok ? ((await res.json()) as any[]) : [];
    const places: PlaceMatch[] = rows
      .filter((r) => Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lon)))
      .map((r) => {
        const a = r.address ?? {};
        const street = a.road ? `${a.road}${a.house_number ? ` ${a.house_number}` : ''}` : '';
        const name = String(r.name || street || String(r.display_name).split(',')[0]).trim();
        return {
          id: `${r.osm_type ?? 'x'}-${r.osm_id ?? r.place_id}`,
          name,
          detail: shortDetail(String(r.display_name ?? ''), name),
          latitude: Number(r.lat),
          longitude: Number(r.lon),
          kind: String(r.type ?? r.category ?? 'place'),
        };
      });
    manyCache.set(key, { at: Date.now(), places });
    return places;
  } catch {
    return []; // not cached: a later try may work
  }
}
