// Narrated walking tour: stops come from docs/voice/tour.md (edited by hand), read on request and re-read when
// the file changes. The app plays each stop through POST /v1/m/assistant/tts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planRoute, type RouteStep } from '../../core/route.ts';

const TOUR_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../docs/voice/tour.md');
const FIELDS = ['title_ro', 'title_en', 'lat', 'lng', 'ro', 'en'] as const;

export interface TourStop {
  id: string;
  title: { ro: string; en: string };
  coordinate: { lat: number; lng: number };
  text: { ro: string; en: string };
}

export interface Tour {
  stops: TourStop[];
  /** Problems found in the file (skipped stops), so the author can fix them. */
  warnings: string[];
  source: string;
}

export function parseTour(markdown: string): Omit<Tour, 'source'> {
  const stops: TourStop[] = [];
  const warnings: string[] = [];
  for (const section of markdown.replace(/\r\n/g, '\n').split(/^## /m).slice(1)) {
    const [heading, ...lines] = section.split('\n');
    const id = heading.trim();
    const f: Record<string, string> = {};
    for (const line of lines) {
      const m = /^- ([a-z_]+): (.*)$/.exec(line.trim());
      if (m) f[m[1]] = m[2].trim();
    }
    if (Object.keys(f).length === 0) continue; // notes, not a stop
    const missing = FIELDS.filter((k) => !f[k]);
    const lat = Number(f.lat);
    const lng = Number(f.lng);
    if (!/^[a-z0-9-]+$/.test(id)) warnings.push(`"${id}": id must use a-z, 0-9 and "-"`);
    else if (missing.length) warnings.push(`"${id}": missing ${missing.join(', ')}`);
    else if (!Number.isFinite(lat) || !Number.isFinite(lng)) warnings.push(`"${id}": lat/lng must be numbers`);
    else stops.push({ id, title: { ro: f.title_ro, en: f.title_en }, coordinate: { lat, lng }, text: { ro: f.ro, en: f.en } });
  }
  return { stops, warnings };
}

let cache: { mtimeMs: number; tour: Tour } | null = null;

export function loadTour(): Tour {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(TOUR_FILE);
  } catch {
    return { stops: [], warnings: ['docs/voice/tour.md was not found on this server'], source: 'docs/voice/tour.md' };
  }
  if (!cache || cache.mtimeMs !== stat.mtimeMs) {
    cache = { mtimeMs: stat.mtimeMs, tour: { ...parseTour(fs.readFileSync(TOUR_FILE, 'utf8')), source: 'docs/voice/tour.md' } };
  }
  return cache.tour;
}

/* ---------- exact walking directions between the stops ---------- */

export type TourLang = 'ro' | 'en';

export interface TourLegStep {
  text: string;
  distance_m: number;
}

export interface TourLeg {
  /** the stop before this leg, or null when the leg starts at the person's own position */
  from_id: string | null;
  to_id: string;
  distance_m: number;
  duration_s: number;
  steps: TourLegStep[];
  /** the line to draw on the map, [lng, lat] pairs */
  geometry: [number, number][];
  /** the whole leg as one short passage, for the voice to read before the stop's story */
  spoken: string;
  /** danger or works zones on the way (titles), so the walk can warn about them */
  warnings: string[];
}

const T = {
  en: {
    start: (s: string) => (s ? `Set off along ${s}` : 'Set off'),
    arrive: 'You have arrived',
    roundabout: (s: string) => (s ? `Take the roundabout onto ${s}` : 'Take the roundabout'),
    uturn: 'Make a U-turn',
    turn: (d: string, s: string) => `${d}${s ? ` onto ${s}` : ''}`,
    cont: (s: string) => (s ? `Continue on ${s}` : 'Continue straight'),
    dirs: { left: 'Turn left', right: 'Turn right', 'slight left': 'Bear left', 'slight right': 'Bear right', 'sharp left': 'Make a sharp left', 'sharp right': 'Make a sharp right' } as Record<string, string>,
    walk: (m: number) => `walk ${m} metres`,
    intro: (to: string, mins: number, m: number) => `To get to ${to}: about ${mins} minutes on foot, ${m} metres.`,
    introFrom: (from: string, to: string, mins: number, m: number) => `From ${from} to ${to}: about ${mins} minutes on foot, ${m} metres.`,
    then: 'Then',
    warn: (t: string) => `Careful: the way passes ${t}.`,
  },
  ro: {
    start: (s: string) => (s ? `Pornește pe ${s}` : 'Pornește'),
    arrive: 'Ai ajuns',
    roundabout: (s: string) => (s ? `Intră în sensul giratoriu spre ${s}` : 'Intră în sensul giratoriu'),
    uturn: 'Fă o întoarcere',
    turn: (d: string, s: string) => `${d}${s ? ` pe ${s}` : ''}`,
    cont: (s: string) => (s ? `Continuă pe ${s}` : 'Continuă înainte'),
    dirs: { left: 'Virează la stânga', right: 'Virează la dreapta', 'slight left': 'Ține stânga', 'slight right': 'Ține dreapta', 'sharp left': 'Virează brusc la stânga', 'sharp right': 'Virează brusc la dreapta' } as Record<string, string>,
    walk: (m: number) => `mergi ${m} de metri`,
    intro: (to: string, mins: number, m: number) => `Până la ${to}: aproximativ ${mins} minute pe jos, ${m} de metri.`,
    introFrom: (from: string, to: string, mins: number, m: number) => `De la ${from} la ${to}: aproximativ ${mins} minute pe jos, ${m} de metri.`,
    then: 'Apoi',
    warn: (t: string) => `Atenție: drumul trece pe lângă ${t}.`,
  },
};

function phrase(step: RouteStep, lang: TourLang): string {
  const t = T[lang];
  const [type, ...rest] = step.maneuver.split(' ');
  const mod = rest.join(' ');
  if (type === 'depart') return t.start(step.street);
  if (type === 'arrive') return t.arrive;
  if (type === 'roundabout' || type === 'rotary') return t.roundabout(step.street);
  if (mod === 'uturn') return t.uturn;
  if (t.dirs[mod]) return t.turn(t.dirs[mod], step.street);
  return t.cont(step.street);
}

const round10 = (m: number) => Math.max(10, Math.round(m / 10) * 10);

/** One leg of the walk, in the tour's language. Instructions are written here (not taken from the route's English). */
export async function tourLeg(from: { lat: number; lng: number; title?: string; id: string | null }, to: TourStop, lang: TourLang): Promise<TourLeg> {
  const route = await planRoute([from.lng, from.lat], [to.coordinate.lng, to.coordinate.lat], 'foot', true);
  const t = T[lang];
  const steps: TourLegStep[] = route.steps.map((s) => ({ text: phrase(s, lang), distance_m: s.distance_m }));
  const mins = Math.max(1, Math.round(route.duration_s / 60));
  const intro = from.title ? t.introFrom(from.title, to.title[lang], mins, round10(route.distance_m)) : t.intro(to.title[lang], mins, round10(route.distance_m));
  // spoken: only the movements, a distance after each one that is long enough to matter, short ones chained with "then"
  const moves = route.steps.filter((s) => !s.maneuver.startsWith('arrive') && !(s.maneuver.startsWith('continue') && !s.street && s.distance_m < 30));
  const parts = moves.map((s) => ({ text: phrase(s, lang) + (s.distance_m >= 30 ? `, ${t.walk(round10(s.distance_m))}` : ''), long: s.distance_m >= 30 }));
  const lower = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
  let body = '';
  parts.forEach((p, i) => {
    if (i === 0) body = p.text;
    else body += (parts[i - 1].long ? `. ${t.then} ` : ', ') + lower(p.text);
  });
  const warnings = route.warnings.filter((w) => !w.at_endpoint).map((w) => w.title.replace(/^[^\p{L}\p{N}]+/u, '').trim());
  let spoken = `${intro} ${body}. ${t.arrive}.`.replace(/\.\./g, '.');
  if (warnings.length) spoken = `${warnings.map(t.warn).join(' ')} ${spoken}`;
  if (spoken.length > 760) spoken = `${spoken.slice(0, 740).replace(/[,.][^,.]*$/, '')}. ${t.arrive}.`;
  return { from_id: from.id, to_id: to.id, distance_m: route.distance_m, duration_s: route.duration_s, geometry: route.geometry, steps, spoken, warnings };
}

const walkCache = new Map<string, { at: number; legs: TourLeg[] }>();

/** The walk from stop to stop (and from `start`, the person's own position, to the first stop when given). */
export async function tourWalk(lang: TourLang, start?: { lat: number; lng: number }): Promise<{ legs: TourLeg[]; warnings: string[] }> {
  const tour = loadTour();
  const key = `${lang}|${start ? `${start.lat.toFixed(3)},${start.lng.toFixed(3)}` : '-'}|${tour.stops.map((s) => s.id).join(',')}`;
  const hit = walkCache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60_000) return { legs: hit.legs, warnings: tour.warnings };
  const legs: TourLeg[] = [];
  if (start && tour.stops[0]) legs.push(await tourLeg({ lat: start.lat, lng: start.lng, id: null }, tour.stops[0], lang));
  for (let i = 1; i < tour.stops.length; i++) {
    const prev = tour.stops[i - 1];
    legs.push(await tourLeg({ lat: prev.coordinate.lat, lng: prev.coordinate.lng, title: prev.title[lang], id: prev.id }, tour.stops[i], lang));
  }
  walkCache.set(key, { at: Date.now(), legs });
  if (walkCache.size > 40) walkCache.delete(walkCache.keys().next().value as string);
  return { legs, warnings: tour.warnings };
}
