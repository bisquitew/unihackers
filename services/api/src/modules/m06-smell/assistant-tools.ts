import { TIMISOARA_AREAS, getAreaBySlugOrName } from '../../core/areas.ts';
import { HOURS_MAX } from './validation.ts';
import { TYPE_LABELS, smellService } from './service.ts';

export const smellAssistantTools = [
  {
    name: 'get_smell_reports',
    description:
      'Community reports of bad smells in Timișoara (burnt rubber, smoke, sewage, chemical, garbage, other): how many, how strong, which areas, the current wind and a cautious hint about the possible source. Optionally for one area.',
    parameters: {
      type: 'object',
      properties: {
        area: {
          type: 'string',
          description: 'Neighbourhood name, e.g. "Fabric", "Calea Lipovei", "Mehala". Leave empty for the whole city.',
        },
        hours: {
          type: 'integer',
          description: 'How many hours back to look (1–168). Default 24; use 24 for "today".',
        },
      },
    },
    handler: async (args: { area?: string; hours?: number }) => {
      const hours = Number.isInteger(args.hours) && args.hours! >= 1 && args.hours! <= HOURS_MAX ? args.hours! : 24;
      let areaId: string | null = null;
      if (args.area && args.area.trim()) {
        const area = getAreaBySlugOrName(args.area);
        if (!area) return { error: `Unknown area "${args.area}"`, knownAreas: TIMISOARA_AREAS.map((a) => a.name) };
        areaId = area.id;
      }
      const opts = { hours, includeDemo: true };
      const { reports, demoCount } = await smellService.window(opts);
      const scoped = areaId ? reports.filter((r) => r.areaId === areaId) : reports;
      const areas = smellService.groupByArea(scoped);
      const hint = areaId ? null : (await smellService.sourceHint({ hours: Math.min(hours, 6), includeDemo: true })).hint;
      const wind = await smellService.windNow();
      return {
        hours,
        area: areaId ? areas[0]?.areaName ?? TIMISOARA_AREAS.find((a) => a.id === areaId)!.name : 'all of Timișoara',
        total: scoped.length,
        demoReports: areaId ? scoped.filter((r) => r.isDemo).length : demoCount,
        note: demoCount > 0 ? 'Includes simulated demo reports (hackathon demo data); say so if you mention numbers.' : undefined,
        avgIntensity: scoped.length ? Math.round((scoped.reduce((s, r) => s + r.intensity, 0) / scoped.length) * 10) / 10 : null,
        byArea: areas.slice(0, 5).map((a) => ({ area: a.areaName, count: a.count, avgIntensity: a.avgIntensity, mostlySmellOf: TYPE_LABELS[a.dominantType].en })),
        latest: scoped.slice(0, 5).map((r) => ({ type: TYPE_LABELS[r.type].en, intensity: r.intensity, area: TIMISOARA_AREAS.find((a) => a.id === r.areaId)?.name ?? r.areaId, at: r.createdAt })),
        wind: { from: wind.from, speedKmh: wind.speedKmh, source: wind.source },
        sourceHint: hint ? hint.en : null,
      };
    },
  },
];
