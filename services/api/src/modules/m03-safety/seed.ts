import { TIMISOARA_AREAS } from '../../core/areas.ts';
import type { SafetyReport, SafetyType } from './types.ts';

/**
 * Demo reports for the last 7 days, marked isDemo: true and never written to the database.
 * Pattern (evenings and nights, 19:00–03:00 local time, most of them):
 *  - Gara de Nord: poor lighting and feeling unsafe near the station, some night noise;
 *  - Iosefin: poor lighting and an abandoned building;
 *  - Complex Studențesc: night noise;
 *  - a few scattered reports elsewhere, some during the day.
 * Notes describe places and conditions only. Deterministic (fixed PRNG seed), regenerated each hour.
 */

const HOUR = 3_600_000;
const DAYS = 7;

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

const NOTES: Partial<Record<SafetyType, string[]>> = {
  poor_lighting: ['Felinarele de pe trotuar nu merg.', 'Pasajul e complet întunecat seara.', 'Lumină slabă lângă stația de tramvai.'],
  noise_at_night: ['Zgomot puternic după miezul nopții.', 'Muzică tare până târziu.'],
  abandoned_building: ['Clădire goală, ușa de la intrare e spartă.', 'Schele vechi, zona nu e împrejmuită.'],
  feeling_unsafe: ['Zonă pustie și slab luminată după ora 22.', 'Trecere subterană fără lumină și fără oameni.'],
};

/** Where demo reports go, how often per evening/night hour, and which types. */
const HOTSPOTS: { areaId: string; perNightHour: number; types: [SafetyType, number][] }[] = [
  { areaId: 'area-gara', perNightHour: 0.45, types: [['poor_lighting', 4], ['feeling_unsafe', 4], ['noise_at_night', 2], ['other', 1]] },
  { areaId: 'area-iosefin', perNightHour: 0.2, types: [['poor_lighting', 3], ['abandoned_building', 3], ['feeling_unsafe', 1]] },
  { areaId: 'area-complex', perNightHour: 0.18, types: [['noise_at_night', 5], ['poor_lighting', 1]] },
];
const SCATTER_AREAS = ['area-mehala', 'area-fabric', 'area-dambovita', 'area-cetate', 'area-girocului'];

export function generateDemoReports(now = new Date()): SafetyReport[] {
  const rand = mulberry32(31415);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const weighted = (list: [SafetyType, number][]) => {
    let r = rand() * list.reduce((s, [, w]) => s + w, 0);
    for (const [t, w] of list) if ((r -= w) <= 0) return t;
    return list[0][0];
  };
  const hourStart = Math.floor(now.getTime() / HOUR) * HOUR;
  const reports: SafetyReport[] = [];

  const add = (areaId: string, type: SafetyType, at: number) => {
    const a = TIMISOARA_AREAS.find((x) => x.id === areaId);
    if (!a) return;
    const r = a.radius_meters * 0.45 * Math.sqrt(rand());
    const angle = rand() * 2 * Math.PI;
    const notes = NOTES[type];
    reports.push({
      id: `demo-safety-${new Date(at).toISOString().slice(0, 13)}-${reports.length + 1}`,
      type,
      lat: +(a.center_lat + (r * Math.cos(angle)) / 111_000).toFixed(5),
      lng: +(a.center_lng + (r * Math.sin(angle)) / 78_000).toFixed(5),
      areaId,
      note: notes && rand() < 0.4 ? pick(notes) : null,
      createdAt: new Date(at).toISOString(),
      isDemo: true,
    });
  };

  for (let h = DAYS * 24 - 1; h >= 0; h--) {
    const start = hourStart - h * HOUR;
    const local = Number(localHour.format(new Date(start)));
    const at = () => Math.min(start + Math.floor(rand() * HOUR), now.getTime() - 60_000);
    const night = local >= 19 || local <= 3;

    for (const spot of HOTSPOTS) {
      if (night && rand() < spot.perNightHour) add(spot.areaId, weighted(spot.types), at());
    }
    // A few scattered reports, mostly in the evening.
    if (rand() < (night ? 0.06 : 0.015)) {
      add(pick(SCATTER_AREAS), weighted([['poor_lighting', 3], ['abandoned_building', 1], ['noise_at_night', 2], ['feeling_unsafe', 1], ['other', 1]]), at());
    }
  }

  return reports.filter((r) => Date.parse(r.createdAt) <= now.getTime()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

let cache: { hour: number; reports: SafetyReport[] } | null = null;

/** Demo reports for the current hour (regenerated once per hour). */
export function getDemoReports(now = new Date()): SafetyReport[] {
  const hour = Math.floor(now.getTime() / HOUR);
  if (!cache || cache.hour !== hour) cache = { hour, reports: generateDemoReports(now) };
  return cache.reports;
}
