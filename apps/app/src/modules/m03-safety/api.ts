import { API_URL } from './config';

const BASE = `${API_URL}/v1/m/safety`;

export type SafetyType = 'poor_lighting' | 'noise_at_night' | 'abandoned_building' | 'feeling_unsafe' | 'other';

/** Labels, icons and pin colours, shared by the screen and the map layer. */
export const SAFETY_TYPES: { id: SafetyType; label: string; icon: string; color: string }[] = [
  { id: 'poor_lighting', label: 'Iluminat slab', icon: '💡', color: '#f59e0b' },
  { id: 'noise_at_night', label: 'Zgomot noaptea', icon: '🔊', color: '#38bdf8' },
  { id: 'abandoned_building', label: 'Clădire abandonată', icon: '🏚️', color: '#a16207' },
  { id: 'feeling_unsafe', label: 'Mă simt nesigur', icon: '⚠️', color: '#ef4444' },
  { id: 'other', label: 'Altceva', icon: '❔', color: '#a1a1aa' },
];
export const safetyType = (id: SafetyType) => SAFETY_TYPES.find((t) => t.id === id) ?? SAFETY_TYPES[SAFETY_TYPES.length - 1];

export const NOTE_MAX = 200;

export interface SafetyPin {
  id: string;
  lat: number;
  lng: number;
  type: SafetyType;
  createdAt: string;
  areaId: string;
  isDemo: boolean;
}

export interface SafetyAreaStats {
  areaId: string;
  areaName: string;
  count: number;
  byType: Record<SafetyType, number>;
  dominantType: SafetyType;
  nightShare: number;
  lastReportAt: string;
  center: { lat: number; lng: number };
}

export interface AreaSummary {
  areaId: string;
  areaName: string;
  lang: 'ro' | 'en';
  text: string;
  source: 'gemini' | 'fallback';
  cached: boolean;
  generatedAt: string;
}

export interface CoreArea {
  id: string;
  name: string;
  slug: string;
  center_lat: number;
  center_lng: number;
}

export interface NewReport {
  type: SafetyType;
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
  request<{ report: SafetyPin & { note: string | null }; noteRedacted: boolean }>(`${BASE}/reports`, { method: 'POST', body: JSON.stringify(input) });

export const fetchPins = (hours = 168, includeDemo = true) => request<DemoInfo & { pins: SafetyPin[] }>(`${BASE}/pins${q(hours, includeDemo)}`);

export const fetchAreas = (hours = 168, includeDemo = true) =>
  request<DemoInfo & { areas: SafetyAreaStats[]; total: number }>(`${BASE}/areas${q(hours, includeDemo)}`);

export const fetchSummary = (areaId: string, lang: 'ro' | 'en', hours = 168, includeDemo = true) =>
  request<{ summary: AreaSummary }>(`${BASE}/summary${q(hours, includeDemo)}&area=${encodeURIComponent(areaId)}&lang=${lang}`).then((r) => r.summary);

/** Neighbourhoods from the core API (same list the backend uses to place reports). */
export const fetchCoreAreas = () => request<CoreArea[]>(`${API_URL}/v1/core/areas`);
