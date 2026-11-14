import type { WindReading } from './types.ts';

// Timișoara city centre.
const LAT = 45.7489;
const LNG = 21.2087;
const URL_OPEN_METEO =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}` +
  `&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=GMT`;

const CACHE_MS = 10 * 60_000;
/** After a failure, retry the real API sooner than the normal cache time. */
const MOCK_CACHE_MS = 60_000;
const TIMEOUT_MS = 4_000;

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export const compassPoint = (deg: number) => COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

export interface WindAdapter {
  current(): Promise<Omit<WindReading, 'cached' | 'from'>>;
}

export class OpenMeteoWindAdapter implements WindAdapter {
  async current() {
    const res = await fetch(URL_OPEN_METEO, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
    const data = (await res.json()) as { current?: { time?: string; wind_speed_10m?: number; wind_direction_10m?: number } };
    const c = data.current;
    if (!c || typeof c.wind_speed_10m !== 'number' || typeof c.wind_direction_10m !== 'number') {
      throw new Error('Open-Meteo response has no current wind');
    }
    return {
      source: 'open-meteo' as const,
      reason: null,
      speedKmh: c.wind_speed_10m,
      directionDeg: c.wind_direction_10m,
      observedAt: c.time ? new Date(`${c.time}Z`).toISOString() : new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    };
  }
}

/** Used when Open-Meteo is unreachable: a light westerly, the most common wind direction for a demo. */
export class MockWindAdapter implements WindAdapter {
  private readonly reason: string;
  constructor(reason: string) {
    this.reason = reason;
  }
  async current() {
    const now = new Date().toISOString();
    return { source: 'mock' as const, reason: this.reason, speedKmh: 8, directionDeg: 270, observedAt: now, fetchedAt: now };
  }
}

export class WindService {
  private cache: { reading: WindReading; expires: number } | null = null;
  private inflight: Promise<WindReading> | null = null;
  private readonly live: WindAdapter;

  constructor(live: WindAdapter = new OpenMeteoWindAdapter()) {
    this.live = live;
  }

  async current(): Promise<WindReading> {
    if (this.cache && this.cache.expires > Date.now()) return { ...this.cache.reading, cached: true };
    // One request at a time, even if several clients ask at once.
    this.inflight ??= this.fetchFresh().finally(() => { this.inflight = null; });
    return this.inflight;
  }

  private async fetchFresh(): Promise<WindReading> {
    let base: Omit<WindReading, 'cached' | 'from'>;
    try {
      base = await this.live.current();
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[m06-smell] Wind: using mock data (${reason})`);
      base = await new MockWindAdapter(reason).current();
    }
    const reading: WindReading = { ...base, from: compassPoint(base.directionDeg), cached: false };
    this.cache = { reading, expires: Date.now() + (reading.source === 'mock' ? MOCK_CACHE_MS : CACHE_MS) };
    return reading;
  }
}

export const windService = new WindService();
