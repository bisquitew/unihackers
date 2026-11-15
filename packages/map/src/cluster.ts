import type { MapPin, PinKind } from './types';

/**
 * When several people report the same issue close to each other, they are one problem, not five dots. Reports of the same
 * kind and the same issue (same title, e.g. "Burnt rubber") that lie within `radiusMeters` of each other become ONE pin at
 * their centre. It carries `count`, so the map draws it bigger with a ring and the number, and its details say how many
 * neighbours reported it. A single report stays as it is.
 *
 * Only reports from other people are grouped: your own pins are never merged, and a private pin never counts.
 */
export interface GroupOptions {
  /** how close reports must be to count as the same spot, for a local issue (default 150 m); issues that spread, like smoke or noise, use a wider area (see AREA_BY_ISSUE) */
  radiusMeters?: number;
  /** how many reports make a group (default 2) */
  minCount?: number;
  /** which kinds of pin are reports (default smell and safety) */
  kinds?: PinKind[];
}

const REPORT_KINDS: PinKind[] = ['smell', 'safety'];

/** Issues that affect a whole neighbourhood, not one spot, group over a wider area (metres). Everything else stays local. */
const AREA_BY_ISSUE: Record<string, number> = {
  smoke: 500,
  'burnt rubber': 500,
  chemical: 500,
  sewage: 400,
  'noise at night': 400,
};

const metres = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** "5m ago", "3h ago", "2d ago": the same short forms the rest of the app uses (and has Romanian for). */
function ago(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (!Number.isFinite(mins)) return '';
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export function groupSimilarReports(pins: MapPin[], options: GroupOptions = {}): MapPin[] {
  const local = options.radiusMeters ?? 150;
  const radiusOf = (title: string) => Math.max(local, AREA_BY_ISSUE[plain(title)] ?? 0);
  const minCount = options.minCount ?? 2;
  const kinds = options.kinds ?? REPORT_KINDS;
  const isReport = (p: MapPin) => kinds.includes(p.kind) && p.owner !== 'me' && p.visibility !== 'private' && !p.radiusMeters;

  const reports = pins.filter(isReport);
  if (reports.length < minCount) return pins;

  // newest first, so a group's "latest" is its first member
  const sorted = [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const clusters: { key: string; members: MapPin[]; centre: { latitude: number; longitude: number } }[] = [];
  for (const pin of sorted) {
    const key = `${pin.kind}|${plain(pin.title)}`;
    const reach = radiusOf(pin.title);
    const home = clusters.find((c) => c.key === key && metres(c.centre, pin.coordinate) <= reach);
    if (home) {
      home.members.push(pin);
      const n = home.members.length;
      home.centre = {
        latitude: home.members.reduce((t, m) => t + m.coordinate.latitude, 0) / n,
        longitude: home.members.reduce((t, m) => t + m.coordinate.longitude, 0) / n,
      };
    } else {
      clusters.push({ key, members: [pin], centre: { ...pin.coordinate } });
    }
  }

  const merged = new Map<string, MapPin>(); // member id -> the pin that replaces its group (set on the first member only)
  const dropped = new Set<string>();
  for (const c of clusters) {
    if (c.members.length < minCount) continue;
    const first = c.members[0];
    const ids = c.members.map((m) => m.id).sort();
    const pin: MapPin = {
      ...first,
      id: `hot-${first.kind}-${ids[0]}`,
      coordinate: c.centre,
      subtitle: `${c.members.length} neighbours reported this here. Latest ${ago(first.createdAt)}.`,
      count: c.members.length,
      createdAt: first.createdAt,
      demo: c.members.every((m) => m.demo),
    };
    merged.set(first.id, pin);
    c.members.slice(1).forEach((m) => dropped.add(m.id));
  }
  if (merged.size === 0) return pins;
  return pins.filter((p) => !dropped.has(p.id)).map((p) => merged.get(p.id) ?? p);
}
