// City alerts, live from the API: outages (/v1/m/utilities/outages) and transit lines with a detour (/v1/m/transit/lines).
// Until the server answers, or when it cannot be reached, the sample alerts in mock/alerts.ts stay on screen.
import { useSyncExternalStore } from 'react';
import { api } from './api';
import { notifyMapLayersChanged } from './map-layers/changes';
import { alerts as sampleAlerts, type AlertItem } from './mock/alerts';

// the API names areas, not coordinates: the middle of each one is where its pin goes
const AREA_SPOTS: Record<string, { latitude: number; longitude: number }> = {
  circumvalatiunii: { latitude: 45.762, longitude: 21.218 },
  mehala: { latitude: 45.7705, longitude: 21.2105 },
  'complex studentesc': { latitude: 45.748, longitude: 21.239 },
  'calea sagului': { latitude: 45.732, longitude: 21.205 },
  'calea aradului': { latitude: 45.772, longitude: 21.224 },
  iosefin: { latitude: 45.745, longitude: 21.209 },
  fabric: { latitude: 45.7533, longitude: 21.2508 },
  cetate: { latitude: 45.7537, longitude: 21.2272 },
  elisabetin: { latitude: 45.7412, longitude: 21.2261 },
};
const CENTRE = { latitude: 45.7537, longitude: 21.2257 };
const spotOf = (areas: string[] = []) => {
  const key = (areas[0] ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return AREA_SPOTS[key] ?? CENTRE;
};
const clock = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '');
const words = (s = '') => s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function fromOutage(o: any): AlertItem {
  const until = clock(o.estimated_restore_time);
  return {
    id: String(o.id),
    coordinate: spotOf(o.affected_areas),
    module: 'utilities',
    group: 'places',
    title: o.title,
    detail: `${words(o.provider)} · ${(o.affected_areas ?? []).join(', ')}`,
    trailing: until ? { kind: 'time', text: `until ${until}` } : { kind: 'new' },
    headline: o.title,
    context: o.description ?? '',
    steps: [
      { state: 'done', title: 'Reported', note: clock(o.start_time) || undefined },
      { state: 'now', title: words(o.status), note: o.severity ? `Severity: ${o.severity}` : undefined },
      { state: 'next', title: until ? `Expected back about ${until}` : 'Restore time to be confirmed' },
    ],
    confirmedBy: 0,
  };
}

function fromLine(l: any): AlertItem {
  const detour = l.detour_alert;
  return {
    id: `line-${l.id ?? l.line_number}`,
    coordinate: CENTRE,
    module: 'transit',
    group: 'city',
    title: `Line ${l.line_number}: ${l.name}`,
    detail: l.current_route_summary ?? words(l.status),
    trailing: { kind: 'time', text: words(l.status) },
    headline: detour?.title ?? `Line ${l.line_number} is ${l.status}`,
    context: [detour?.reason, l.current_route_summary].filter(Boolean).join(' '),
    steps: [
      { state: 'done', title: 'Announced' },
      { state: 'now', title: words(l.status), note: l.current_route_summary },
    ],
    confirmedBy: 0,
  };
}

// danger and works alerts with a radius around a spot (published by city staff)
function fromArea(a: any): AlertItem {
  const danger = a.type === 'danger';
  const until = a.expected_end_time ? new Date(a.expected_end_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
  return {
    id: String(a.id),
    coordinate: { latitude: a.latitude, longitude: a.longitude },
    module: danger ? 'safety' : 'utilities',
    group: 'city',
    title: String(a.title ?? '').replace(/^[^\p{L}\p{N}]+/u, ''),
    detail: `${a.neighbourhood ?? 'Area'} · ${a.radius_meters} m around`,
    trailing: until ? { kind: 'time', text: `until ${until}` } : { kind: 'new' },
    headline: String(a.title ?? '').replace(/^[^\p{L}\p{N}]+/u, ''),
    context: a.description ?? '',
    steps: [
      { state: 'done', title: 'Reported', note: clock(a.start_time) || undefined },
      { state: 'now', title: danger ? 'Keep away from the area' : 'Works in progress', note: `${a.radius_meters} m perimeter` },
      { state: 'next', title: until ? `Expected to end ${until}` : 'End date to be confirmed' },
    ],
    confirmedBy: a.affected_residents_count ?? 0,
  };
}

let current: AlertItem[] = sampleAlerts;
let version = 0;
const listeners = new Set<() => void>();

/** Loads the current outages and transit changes. Keeps the sample alerts when the API cannot be reached. */
export async function refreshAlerts(): Promise<void> {
  try {
    const [outages, lines, areas] = await Promise.all([
      api.get<any[]>('/v1/m/utilities/outages'),
      api.get<any[]>('/v1/m/transit/lines'),
      api.get<any[]>('/v1/core/area-alerts', { status: 'active' }).catch(() => [] as any[]),
    ]);
    const live = [...(Array.isArray(areas) ? areas.map(fromArea) : []), ...(Array.isArray(outages) ? outages.map(fromOutage) : []), ...(Array.isArray(lines) ? lines.filter((l) => l.status !== 'normal').map(fromLine) : [])];
    current = live;
    version += 1;
    listeners.forEach((fn) => fn());
    notifyMapLayersChanged();
  } catch {
    /* offline: the sample alerts stay */
  }
}
void refreshAlerts();

export const getAlerts = () => current;
export const alertById = (id: string) => current.find((a) => a.id === id);
export const alertsFor = (group: AlertItem['group']) => current.filter((a) => a.group === group);

/** The alerts, re-read whenever they are refreshed. */
export function useAlerts(): AlertItem[] {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
  );
  return current;
}
