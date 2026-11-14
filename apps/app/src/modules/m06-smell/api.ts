import { API_URL } from './config';

const BASE = `${API_URL}/v1/m/smell`;

export type SmellType = 'burnt_rubber' | 'smoke' | 'sewage' | 'chemical' | 'garbage' | 'other';

/** Labels, icons and pin colours, shared by the screen and the map layer. */
export const SMELL_TYPES: { id: SmellType; label: string; icon: string; color: string }[] = [
  { id: 'burnt_rubber', label: 'Cauciuc ars', icon: '🛞', color: '#ef4444' },
  { id: 'smoke', label: 'Fum', icon: '💨', color: '#a1a1aa' },
  { id: 'sewage', label: 'Canalizare', icon: '🚰', color: '#a16207' },
  { id: 'chemical', label: 'Chimic', icon: '🧪', color: '#a855f7' },
  { id: 'garbage', label: 'Gunoi', icon: '🗑️', color: '#22c55e' },
  { id: 'other', label: 'Altceva', icon: '❔', color: '#38bdf8' },
];
export const smellType = (id: SmellType) => SMELL_TYPES.find((t) => t.id === id) ?? SMELL_TYPES[SMELL_TYPES.length - 1];

export interface SmellPin {
  id: string;
  lat: number;
  lng: number;
  type: SmellType;
  intensity: number;
  createdAt: string;
  areaId: string;
  isDemo: boolean;
}

export interface SmellAreaStats {
  areaId: string;
  areaName: string;
  count: number;
  avgIntensity: number;
  dominantType: SmellType;
  center: { lat: number; lng: number };
}

export interface HourBucket {
  hour: string;
  total: number;
  byType: Record<SmellType, number>;
}

export interface Wind {
  source: 'open-meteo' | 'mock';
  reason: string | null;
  speedKmh: number;
  directionDeg: number;
  from: string;
  observedAt: string;
  cached: boolean;
}

export interface SourceHint {
  ro: string;
  en: string;
  areaId: string;
}

export interface CoreArea {
  id: string;
  name: string;
  slug: string;
  center_lat: number;
  center_lng: number;
}

export interface NewReport {
  type: SmellType;
  intensity: number;
  areaId?: string;
  lat?: number;
  lng?: number;
  note?: string;
}

interface DemoInfo {
  includeDemo: boolean;
  demoCount: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

const q = (hours: number, includeDemo: boolean) => `?hours=${hours}&includeDemo=${includeDemo}`;

export const postReport = (input: NewReport) =>
  request<{ report: SmellPin }>(`${BASE}/reports`, { method: 'POST', body: JSON.stringify(input) }).then((r) => r.report);

export const fetchPins = (hours = 24, includeDemo = true) =>
  request<DemoInfo & { pins: SmellPin[] }>(`${BASE}/pins${q(hours, includeDemo)}`);

export const fetchAreas = (hours = 24, includeDemo = true) =>
  request<DemoInfo & { areas: SmellAreaStats[]; total: number }>(`${BASE}/areas${q(hours, includeDemo)}`);

export const fetchTimeseries = (hours = 24, includeDemo = true) =>
  request<DemoInfo & { buckets: HourBucket[]; total: number }>(`${BASE}/timeseries${q(hours, includeDemo)}`);

export const fetchWind = () => request<{ wind: Wind }>(`${BASE}/wind`).then((r) => r.wind);

export const fetchSourceHint = (hours = 6, includeDemo = true) =>
  request<DemoInfo & { hint: SourceHint | null; total: number }>(`${BASE}/source-hint${q(hours, includeDemo)}`);

/** Neighbourhoods from the core API (same list the backend uses to place reports). */
export const fetchCoreAreas = () => request<CoreArea[]>(`${API_URL}/v1/core/areas`);
