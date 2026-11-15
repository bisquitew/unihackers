import { TIMISOARA_AREAS, calculateDistanceMeters } from '../../core/areas.ts';
import type { ToolContext } from '../m10-assistant/types.ts';
import { HOURS_MAX, parseType, resolveArea } from './validation.ts';
import { TYPE_LABELS, isNight, safetyService } from './service.ts';
import { SAFETY_TYPES } from './types.ts';
import { EMERGENCY_NUMBER, SAFE_PLACE_LABEL, describeSafePlace, nearestSafePlaces, safePlaces, type SafePlaceKind } from '../../core/safe-places.ts';

export const safetyAssistantTools = [
  {
    name: 'find_safe_places',
    description:
      'The safe places in Timișoara where a person can get help: hospitals (with emergency care where known), police stations and fire stations, each with its address where known and how far it is from a given spot. Use it for "where is the nearest hospital / police / fire station", "where can I go if I feel unsafe", "is there a safe place near X". Give a neighbourhood name in "near" to sort by distance. When the user says "near me", "around me" or "where I am", set near_me to true: it uses the approximate location the user chose to share with this question (the tool tells you if they have not). Without near or near_me the list is not sorted by distance. All of them can be reached through the emergency number 112.',
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['hospital', 'police', 'fire'], description: 'Only this kind of place. Leave empty for all three.' },
        near: { type: 'string', description: 'Neighbourhood name to measure from, e.g. "Iosefin", "Gara de Nord", "Complex Studențesc". Leave empty for the whole city.' },
        near_me: { type: 'boolean', description: 'true when the user asks about places near them ("near me", "around me", "where I am"). Uses their shared approximate location.' },
        limit: { type: 'integer', description: 'How many places to return (1–10). Default 3 when "near" or near_me is used, otherwise 10.' },
      },
    },
    handler: async (args: { kind?: string; near?: string; near_me?: boolean; limit?: number }, ctx?: ToolContext) => {
      if (args.kind && !['hospital', 'police', 'fire'].includes(args.kind)) return { error: 'kind must be hospital, police or fire' };
      const kind = args.kind as SafePlaceKind | undefined;
      const wanted = Number.isInteger(args.limit) ? Math.max(1, Math.min(10, args.limit as number)) : undefined;
      let from: { name: string; lat: number; lng: number } | null = null;
      let usedMyLocation = false;
      if (args.near_me && !(args.near && args.near.trim())) {
        const loc = ctx?.location;
        if (!loc) {
          return {
            needsLocation: true,
            note: 'The user has not shared their location with this question. Tell them they can turn on "Use my location" in the assistant (it is only used for this question and is never stored), or name a neighbourhood instead. Do not guess where they are.',
          };
        }
        // far from the city: say so instead of listing places that are many kilometres away as if they were close
        const awayKm = calculateDistanceMeters(loc.latitude, loc.longitude, 45.7537, 21.2257) / 1000;
        if (awayKm > 30) {
          return { outsideTimisoara: true, kilometresFromCentre: Math.round(awayKm), note: 'The shared location is not in Timișoara, so these safe places would be far away. Tell the user, and offer to look near a Timișoara neighbourhood instead.' };
        }
        from = { name: 'your approximate location', lat: loc.latitude, lng: loc.longitude };
        usedMyLocation = true;
      } else if (args.near && args.near.trim()) {
        const area = resolveArea(args.near);
        if (!area) return { error: `Unknown area "${args.near}"`, knownAreas: TIMISOARA_AREAS.map((a) => a.name) };
        from = { name: area.name, lat: area.center_lat, lng: area.center_lng };
      }
      const places = from
        ? nearestSafePlaces(from.lat, from.lng, { kind, limit: wanted ?? 3 })
        : safePlaces.filter((p) => !kind || p.kind === kind).slice(0, wanted ?? 10).map((p) => ({ ...p, distance_meters: null as number | null }));
      return {
        emergencyNumber: EMERGENCY_NUMBER,
        measuredFrom: from ? (usedMyLocation ? 'your approximate location (shared by you for this question, rounded to about 100 m)' : `the centre of ${from.name}`) : null,
        places: places.map((p) => ({
          name: p.name,
          kind: SAFE_PLACE_LABEL[p.kind],
          emergencyCare: p.kind === 'hospital' ? p.emergency : undefined,
          street: p.street,
          distanceMeters: p.distance_meters,
          latitude: p.latitude,
          longitude: p.longitude,
          summary: describeSafePlace(p),
        })),
        note: 'These are the main hospitals, police stations and fire stations inside the city, from OpenStreetMap. In an emergency, call 112 first. They are shown on the map as safe places.',
      };
    },
  },
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
