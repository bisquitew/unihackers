// Directions on the map: one call to the API's /v1/core/route (which checks the way against the danger and works zones) and the
// small helpers that turn its numbers into words. The same shapes are used by the website (apps/web/src/views/MapView.js).
import type { Coordinate } from '@hub/map';
import { api } from './api';

export type RouteMode = 'foot' | 'bike' | 'car';

export interface RouteStep {
  instruction: string;
  maneuver: string;
  street: string;
  distance_m: number;
  duration_s: number;
}

export interface RouteWarning {
  alert_id: string;
  title: string;
  type: 'danger' | 'construction';
  severity: string;
  radius_meters: number;
  meters_inside: number;
  at_endpoint: boolean;
}

export interface RouteHelp {
  id: string;
  name: string;
  kind: 'hospital' | 'police' | 'fire';
  label: string;
  meters_from_route: number;
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  mode: RouteMode;
  distance_m: number;
  duration_s: number;
  geometry: [number, number][];
  steps: RouteStep[];
  warnings: RouteWarning[];
  avoided: { alert_id: string; title: string }[];
  could_not_avoid: boolean;
  help_nearby: RouteHelp[];
}

export async function fetchRoute(from: Coordinate, to: Coordinate, mode: RouteMode): Promise<RouteResult> {
  return api.get<RouteResult>('/v1/core/route', {
    from: `${from.latitude.toFixed(6)},${from.longitude.toFixed(6)}`,
    to: `${to.latitude.toFixed(6)},${to.longitude.toFixed(6)}`,
    mode,
  });
}

/** "6 min", "1 h 5 min" */
export function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "350 m", "2.7 km" */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.max(10, Math.round(metres / 10) * 10)} m`;
  return `${(metres / 1000).toFixed(metres < 10000 ? 1 : 0)} km`;
}

/** Alert titles come with an emoji in front ("🚨 Alert ..."); in a sentence they read better without it. */
export function plainTitle(title: string): string {
  return title.replace(/^[^\p{L}\p{N}]+/u, '').trim();
}
