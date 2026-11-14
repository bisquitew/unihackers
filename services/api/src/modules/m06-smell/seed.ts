import { TIMISOARA_AREAS } from '../../core/areas.ts';
import type { SmellReport, SmellType } from './types.ts';

/**
 * Demo reports for the last 48 hours, marked isDemo: true and never written to the database.
 * Pattern:
 *  - burnt rubber in Fabric and the neighbouring Calea Lipovei on weekday-like mornings (06–10 local time),
 *  - wood/leaf smoke in Mehala and Dâmbovița in the evenings (18–22),
 *  - a few scattered sewage, garbage, chemical and other reports.
 * Deterministic (fixed PRNG seed) and regenerated relative to the current hour, so it always covers 48 h.
 */

const HOUR = 3_600_000;

// Small deterministic PRNG (mulberry32), so the demo looks the same on every run.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const localHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', hour: 'numeric', hourCycle: 'h23' });

const area = (id: string) => {
  const a = TIMISOARA_AREAS.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown area ${id}`);
  return a;
};

const SCATTER: { type: SmellType; areas: string[] }[] = [
  { type: 'sewage', areas: ['area-iosefin', 'area-gara', 'area-elisabetin'] },
  { type: 'garbage', areas: ['area-complex', 'area-girocului', 'area-soarelui'] },
  { type: 'chemical', areas: ['area-aradului', 'area-lipovei'] },
  { type: 'other', areas: ['area-cetate', 'area-circumvalatiunii'] },
];

export function generateDemoReports(now = new Date()): SmellReport[] {
  const rand = mulberry32(20261114);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const hourStart = Math.floor(now.getTime() / HOUR) * HOUR;
  const reports: SmellReport[] = [];

  const add = (areaId: string, type: SmellType, intensity: number, at: number) => {
    const a = area(areaId);
    // Spread pins inside 40% of the area radius (1° lat ≈ 111 km; 1° lng ≈ 78 km at Timișoara).
    const r = a.radius_meters * 0.4 * Math.sqrt(rand());
    const angle = rand() * 2 * Math.PI;
    reports.push({
      id: `demo-${new Date(at).toISOString().slice(0, 13)}-${reports.length + 1}`,
      type,
      intensity: Math.max(1, Math.min(5, Math.round(intensity))),
      lat: +(a.center_lat + (r * Math.cos(angle)) / 111_000).toFixed(5),
      lng: +(a.center_lng + (r * Math.sin(angle)) / 78_000).toFixed(5),
      areaId,
      note: null,
      createdAt: new Date(at).toISOString(),
      isDemo: true,
    });
  };

  for (let h = 47; h >= 0; h--) {
    const start = hourStart - h * HOUR;
    const local = Number(localHour.format(new Date(start)));
    const minute = () => start + Math.floor(rand() * HOUR);
    const at = () => Math.min(minute(), now.getTime() - 60_000);

    if (local >= 6 && local <= 9) {
      // Morning burnt-rubber cluster, strongest around 07–08.
      const peak = local === 7 || local === 8;
      const fabric = peak ? 4 : 2 + Math.floor(rand() * 2);
      const lipovei = peak ? 2 : 1;
      for (let i = 0; i < fabric; i++) add('area-fabric', 'burnt_rubber', (peak ? 4 : 3) + rand(), at());
      for (let i = 0; i < lipovei; i++) add('area-lipovei', 'burnt_rubber', (peak ? 3 : 2) + rand(), at());
    }
    if (local >= 18 && local <= 22 && rand() < 0.7) {
      add(pick(['area-mehala', 'area-dambovita']), 'smoke', 2 + rand() * 2, at());
    }
    if (rand() < 0.22) {
      const s = pick(SCATTER);
      add(pick(s.areas), s.type, 1 + rand() * 3, at());
    }
  }

  return reports.filter((r) => Date.parse(r.createdAt) <= now.getTime()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

let cache: { hour: number; reports: SmellReport[] } | null = null;

/** Demo reports for the current hour (regenerated once per hour). */
export function getDemoReports(now = new Date()): SmellReport[] {
  const hour = Math.floor(now.getTime() / HOUR);
  if (!cache || cache.hour !== hour) cache = { hour, reports: generateDemoReports(now) };
  return cache.reports;
}
