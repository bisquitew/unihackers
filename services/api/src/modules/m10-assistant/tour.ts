// Narrated walking tour: stops come from docs/voice/tour.md (edited by hand), read on request and re-read when
// the file changes. The app plays each stop through POST /v1/m/assistant/tts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
