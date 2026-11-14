import { randomUUID } from 'node:crypto';
import { TIMISOARA_AREAS } from '../../core/areas.ts';
import { FallbackSmellRepository } from './repository.ts';
import { getDemoReports } from './seed.ts';
import { windService, type WindService } from './wind.ts';
import {
  SMELL_TYPES,
  type NewSmellReport,
  type SmellAreaStats,
  type SmellHourBucket,
  type SmellPin,
  type SmellReport,
  type SmellType,
  type WindReading,
} from './types.ts';

const HOUR = 3_600_000;
/** Below this many reports the source hint is not shown: too little to say anything. */
export const MIN_REPORTS_FOR_HINT = 5;

export const TYPE_LABELS: Record<SmellType, { ro: string; en: string }> = {
  burnt_rubber: { ro: 'cauciuc ars', en: 'burnt rubber' },
  smoke: { ro: 'fum', en: 'smoke' },
  sewage: { ro: 'canalizare', en: 'sewage' },
  chemical: { ro: 'miros chimic', en: 'chemical' },
  garbage: { ro: 'gunoi', en: 'garbage' },
  other: { ro: 'altceva', en: 'other' },
};

const COMPASS_NAMES: Record<string, { ro: string; en: string }> = {
  N: { ro: 'nord', en: 'north' },
  NE: { ro: 'nord-est', en: 'north-east' },
  E: { ro: 'est', en: 'east' },
  SE: { ro: 'sud-est', en: 'south-east' },
  S: { ro: 'sud', en: 'south' },
  SW: { ro: 'sud-vest', en: 'south-west' },
  W: { ro: 'vest', en: 'west' },
  NW: { ro: 'nord-vest', en: 'north-west' },
};

export interface ReadOptions {
  hours: number;
  includeDemo: boolean;
}

export interface ReportWindow {
  reports: SmellReport[];
  demoCount: number;
}

export interface SourceHint {
  ro: string;
  en: string;
  areaId: string;
  areaReports: number;
  totalReports: number;
  dominantType: SmellType;
  wind: Pick<WindReading, 'source' | 'speedKmh' | 'directionDeg' | 'from'>;
}

const areaName = (id: string) => TIMISOARA_AREAS.find((a) => a.id === id)?.name ?? id;
const emptyByType = () => Object.fromEntries(SMELL_TYPES.map((t) => [t, 0])) as Record<SmellType, number>;
const round1 = (n: number) => Math.round(n * 10) / 10;

function dominant(reports: SmellReport[]): SmellType {
  const counts = emptyByType();
  for (const r of reports) counts[r.type]++;
  return SMELL_TYPES.reduce((best, t) => (counts[t] > counts[best] ? t : best), SMELL_TYPES[0]);
}

export class SmellService {
  constructor(
    readonly repository = new FallbackSmellRepository(),
    private readonly wind: WindService = windService,
  ) {}

  async create(input: NewSmellReport): Promise<SmellReport> {
    const report: SmellReport = { id: randomUUID(), ...input, createdAt: new Date().toISOString(), isDemo: false };
    return this.repository.insert(report);
  }

  /** Real reports plus (optionally) demo reports in the last `hours`, newest first. */
  async window({ hours, includeDemo }: ReadOptions, now = new Date()): Promise<ReportWindow> {
    const since = new Date(now.getTime() - hours * HOUR);
    const real = await this.repository.listSince(since);
    const demo = includeDemo ? getDemoReports(now).filter((r) => Date.parse(r.createdAt) >= since.getTime()) : [];
    const reports = [...real, ...demo].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { reports, demoCount: demo.length };
  }

  async pins(opts: ReadOptions): Promise<{ pins: SmellPin[]; demoCount: number }> {
    const { reports, demoCount } = await this.window(opts);
    const pins = reports.map(({ id, lat, lng, type, intensity, createdAt, areaId }) => ({ id, lat, lng, type, intensity, createdAt, areaId }));
    return { pins, demoCount };
  }

  async areas(opts: ReadOptions): Promise<{ areas: SmellAreaStats[]; total: number; demoCount: number }> {
    const { reports, demoCount } = await this.window(opts);
    return { areas: this.groupByArea(reports), total: reports.length, demoCount };
  }

  groupByArea(reports: SmellReport[]): SmellAreaStats[] {
    const byArea = new Map<string, SmellReport[]>();
    for (const r of reports) byArea.set(r.areaId, [...(byArea.get(r.areaId) ?? []), r]);
    return [...byArea.entries()]
      .map(([areaId, list]) => {
        const area = TIMISOARA_AREAS.find((a) => a.id === areaId);
        return {
          areaId,
          areaName: areaName(areaId),
          count: list.length,
          avgIntensity: round1(list.reduce((s, r) => s + r.intensity, 0) / list.length),
          dominantType: dominant(list),
          center: area ? { lat: area.center_lat, lng: area.center_lng } : { lat: list[0].lat, lng: list[0].lng },
        };
      })
      .sort((a, b) => b.count - a.count || b.avgIntensity - a.avgIntensity);
  }

  async timeseries(opts: ReadOptions, now = new Date()): Promise<{ buckets: SmellHourBucket[]; total: number; demoCount: number }> {
    const { reports, demoCount } = await this.window(opts, now);
    const currentHour = Math.floor(now.getTime() / HOUR) * HOUR;
    const buckets: SmellHourBucket[] = [];
    const index = new Map<number, SmellHourBucket>();
    for (let h = opts.hours - 1; h >= 0; h--) {
      const start = currentHour - h * HOUR;
      const bucket = { hour: new Date(start).toISOString(), total: 0, byType: emptyByType() };
      buckets.push(bucket);
      index.set(start, bucket);
    }
    for (const r of reports) {
      const bucket = index.get(Math.floor(Date.parse(r.createdAt) / HOUR) * HOUR);
      if (!bucket) continue; // older than the first full bucket
      bucket.total++;
      bucket.byType[r.type]++;
    }
    return { buckets, total: buckets.reduce((s, b) => s + b.total, 0), demoCount };
  }

  windNow(): Promise<WindReading> {
    return this.wind.current();
  }

  /** A cautious sentence: busiest area + wind direction. Null under MIN_REPORTS_FOR_HINT reports. */
  async sourceHint(opts: ReadOptions): Promise<{ hint: SourceHint | null; total: number; demoCount: number; reason: string | null }> {
    const { reports, demoCount } = await this.window(opts);
    if (reports.length < MIN_REPORTS_FOR_HINT) {
      return { hint: null, total: reports.length, demoCount, reason: `Fewer than ${MIN_REPORTS_FOR_HINT} reports in the last ${opts.hours} h` };
    }
    const top = this.groupByArea(reports)[0];
    const areaReports = reports.filter((r) => r.areaId === top.areaId);
    const wind = await this.windNow();
    const dir = COMPASS_NAMES[wind.from];
    const type = TYPE_LABELS[top.dominantType];
    const calm = wind.speedKmh < 3;
    const speed = Math.round(wind.speedKmh);
    const ro =
      `Cele mai multe sesizări din ultimele ${opts.hours} ore sunt din ${top.areaName} (${top.count} din ${reports.length}, mai ales ${type.ro}). ` +
      (calm
        ? `Vântul e aproape calm, deci sursa e probabil aproape de ${top.areaName}. `
        : `Vântul bate dinspre ${dir.ro} cu ${speed} km/h, deci mirosul ar putea veni din partea de ${dir.ro} a zonei ${top.areaName}. `) +
      'Este doar un indiciu din sesizările comunității, nu o sursă confirmată.';
    const en =
      `Most reports in the last ${opts.hours} hours are from ${top.areaName} (${top.count} of ${reports.length}, mostly ${type.en}). ` +
      (calm
        ? `The wind is almost calm, so the source is probably close to ${top.areaName}. `
        : `The wind is coming from the ${dir.en} at ${speed} km/h, so the smell may come from the ${dir.en} side of ${top.areaName}. `) +
      'This is only a hint from community reports, not a confirmed source.';
    return {
      hint: {
        ro,
        en,
        areaId: top.areaId,
        areaReports: areaReports.length,
        totalReports: reports.length,
        dominantType: top.dominantType,
        wind: { source: wind.source, speedKmh: wind.speedKmh, directionDeg: wind.directionDeg, from: wind.from },
      },
      total: reports.length,
      demoCount,
      reason: null,
    };
  }

  status() {
    return this.repository.status();
  }
}

export const smellService = new SmellService();
