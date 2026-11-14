import { TIMISOARA_AREAS } from '../../core/areas.ts';
import { HOURS_MAX, parseType, resolveArea } from './validation.ts';
import { TYPE_LABELS, isNight, safetyService } from './service.ts';
import { SAFETY_TYPES } from './types.ts';

export const safetyAssistantTools = [
  {
    name: 'get_safety_reports',
    description:
      'Residents\' reports about how safe places in Timișoara feel: poor lighting, noise at night, abandoned buildings, places that feel unsafe. Returns counts by area and type, the share made at night (20:00–06:00) and the latest reports. These are unverified perceptions about places, not crime statistics, and they never describe people. Optionally for one area and/or one type.',
    parameters: {
      type: 'object',
      properties: {
        area: { type: 'string', description: 'Neighbourhood name, e.g. "Gara de Nord", "Iosefin", "Complex Studențesc". Leave empty for the whole city.' },
        type: { type: 'string', enum: [...SAFETY_TYPES], description: 'Only this kind of report.' },
        hours: { type: 'integer', description: 'How many hours back to look (1–720). Default 168 (one week).' },
      },
    },
    handler: async (args: { area?: string; type?: string; hours?: number }) => {
      const hours = Number.isInteger(args.hours) && (args.hours as number) >= 1 && (args.hours as number) <= HOURS_MAX ? (args.hours as number) : 168;
      let areaId: string | undefined;
      if (args.area && args.area.trim()) {
        const area = resolveArea(args.area);
        if (!area) return { error: `Unknown area "${args.area}"`, knownAreas: TIMISOARA_AREAS.map((a) => a.name) };
        areaId = area.id;
      }
      const type = parseType(args.type);
      if (type.ok === false) return { error: type.error };

      const { reports } = await safetyService.window({ hours, includeDemo: true });
      const scoped = reports.filter((r) => (!areaId || r.areaId === areaId) && (!type.value || r.type === type.value));
      const byType = Object.fromEntries(SAFETY_TYPES.map((t) => [TYPE_LABELS[t].en, scoped.filter((r) => r.type === t).length]));
      const demo = scoped.filter((r) => r.isDemo).length;
      return {
        hours,
        area: areaId ? TIMISOARA_AREAS.find((a) => a.id === areaId)!.name : 'all of Timișoara',
        type: type.value ? TYPE_LABELS[type.value].en : 'all types',
        total: scoped.length,
        byType,
        shareAtNight: scoped.length ? Math.round((scoped.filter((r) => isNight(r.createdAt)).length / scoped.length) * 100) / 100 : null,
        byArea: safetyService.groupByArea(scoped).slice(0, 5).map((a) => ({ area: a.areaName, count: a.count, mostly: TYPE_LABELS[a.dominantType].en })),
        // Notes are left out on purpose: the assistant describes places and conditions, not what people wrote about others.
        latest: scoped.slice(0, 5).map((r) => ({ type: TYPE_LABELS[r.type].en, area: TIMISOARA_AREAS.find((a) => a.id === r.areaId)?.name ?? r.areaId, at: r.createdAt })),
        demoReports: demo,
        note: [
          'Unverified reports from residents about places, not crime statistics. Do not call an area dangerous and never mention or blame people or groups.',
          demo > 0 ? 'Includes simulated demo reports (hackathon demo data); say so if you mention numbers.' : '',
        ].filter(Boolean).join(' '),
      };
    },
  },
];
