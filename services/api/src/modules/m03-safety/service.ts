import { randomUUID } from 'node:crypto';
import { TIMISOARA_AREAS } from '../../core/areas.ts';
import { FallbackSafetyRepository } from './repository.ts';
import { getDemoReports } from './seed.ts';
import { SAFETY_TYPES, type NewSafetyReport, type SafetyAreaStats, type SafetyPin, type SafetyReport, type SafetyType } from './types.ts';

const HOUR = 3_600_000;

export const TYPE_LABELS: Record<SafetyType, { ro: string; en: string }> = {
  poor_lighting: { ro: 'iluminat slab', en: 'poor lighting' },
  noise_at_night: { ro: 'zgomot noaptea', en: 'noise at night' },
  abandoned_building: { ro: 'clădire abandonată', en: 'abandoned building' },
  feeling_unsafe: { ro: 'senzație de nesiguranță', en: 'feeling unsafe' },
  other: { ro: 'altceva', en: 'other' },
};

const localHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', hour: 'numeric', hourCycle: 'h23' });
/** 20:00–06:00 local time. */
export const isNight = (iso: string) => {
  const h = Number(localHour.format(new Date(iso)));
  return h >= 20 || h < 6;
};

export const areaName = (id: string) => TIMISOARA_AREAS.find((a) => a.id === id)?.name ?? id;
const emptyByType = () => Object.fromEntries(SAFETY_TYPES.map((t) => [t, 0])) as Record<SafetyType, number>;

export interface ReadOptions {
  hours: number;
  includeDemo: boolean;
}

export interface ReportWindow {
  reports: SafetyReport[];
  demoCount: number;
}

export class SafetyService {
  readonly repository: FallbackSafetyRepository;

  constructor(repository: FallbackSafetyRepository = new FallbackSafetyRepository()) {
    this.repository = repository;
  }

  async create(input: NewSafetyReport): Promise<SafetyReport> {
    const report: SafetyReport = { id: randomUUID(), ...input, createdAt: new Date().toISOString(), isDemo: false };
    return this.repository.insert(report);
  }

  /** Real reports plus (optionally) demo reports in the last `hours`, newest first. */
  async window({ hours, includeDemo }: ReadOptions, now = new Date()): Promise<ReportWindow> {
    const since = new Date(now.getTime() - hours * HOUR);
    const real = await this.repository.listSince(since);
    const demo = includeDemo ? getDemoReports(now).filter((r) => Date.parse(r.createdAt) >= since.getTime()) : [];
    return { reports: [...real, ...demo].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), demoCount: demo.length };
  }

  async list(opts: ReadOptions & { areaId?: string; type?: SafetyType; limit: number }) {
    const { reports } = await this.window(opts);
    const filtered = reports.filter((r) => (!opts.areaId || r.areaId === opts.areaId) && (!opts.type || r.type === opts.type));
    return { total: filtered.length, demoCount: filtered.filter((r) => r.isDemo).length, reports: filtered.slice(0, opts.limit) };
  }

  async pins(opts: ReadOptions): Promise<{ pins: SafetyPin[]; demoCount: number }> {
    const { reports, demoCount } = await this.window(opts);
    // Notes stay out of the map: pins only say what kind of problem and where.
    const pins = reports.map(({ id, lat, lng, type, createdAt, areaId, isDemo }) => ({ id, lat, lng, type, createdAt, areaId, isDemo }));
    return { pins, demoCount };
  }

  groupByArea(reports: SafetyReport[]): SafetyAreaStats[] {
    const byArea = new Map<string, SafetyReport[]>();
    for (const r of reports) {
      const list = byArea.get(r.areaId);
      if (list) list.push(r);
      else byArea.set(r.areaId, [r]);
    }
    return [...byArea.entries()]
      .map(([areaId, list]) => {
        const byType = emptyByType();
        for (const r of list) byType[r.type]++;
        const area = TIMISOARA_AREAS.find((a) => a.id === areaId);
        return {
          areaId,
          areaName: areaName(areaId),
          count: list.length,
          byType,
          dominantType: SAFETY_TYPES.reduce((best, t) => (byType[t] > byType[best] ? t : best), SAFETY_TYPES[0]),
          nightShare: Math.round((list.filter((r) => isNight(r.createdAt)).length / list.length) * 100) / 100,
          lastReportAt: list.reduce((latest, r) => (r.createdAt > latest ? r.createdAt : latest), list[0].createdAt),
          center: area ? { lat: area.center_lat, lng: area.center_lng } : { lat: list[0].lat, lng: list[0].lng },
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  async areas(opts: ReadOptions): Promise<{ areas: SafetyAreaStats[]; total: number; demoCount: number }> {
    const { reports, demoCount } = await this.window(opts);
    return { areas: this.groupByArea(reports), total: reports.length, demoCount };
  }

  /** Stats for one area (null when it has no reports in the window). */
  async areaStats(areaId: string, opts: ReadOptions): Promise<{ stats: SafetyAreaStats | null; demoCount: number }> {
    const { reports } = await this.window(opts);
    const inArea = reports.filter((r) => r.areaId === areaId);
    return { stats: inArea.length ? this.groupByArea(inArea)[0] : null, demoCount: inArea.filter((r) => r.isDemo).length };
  }

  status() {
    return this.repository.status();
  }
}

export const safetyService = new SafetyService();
