export const SAFETY_TYPES = ['poor_lighting', 'noise_at_night', 'abandoned_building', 'feeling_unsafe', 'other'] as const;
export type SafetyType = (typeof SAFETY_TYPES)[number];

/** A resident's report about a place (never about a person). */
export interface SafetyReport {
  id: string;
  type: SafetyType;
  lat: number;
  lng: number;
  areaId: string;
  /** Optional, max 200 characters, contact details removed (see validation.ts). */
  note: string | null;
  createdAt: string;
  /** Simulated report from seed.ts, never stored in the database. */
  isDemo: boolean;
}

export interface NewSafetyReport {
  type: SafetyType;
  lat: number;
  lng: number;
  areaId: string;
  note: string | null;
}

/** What the shared map needs for one pin. Notes are not included. */
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
  /** Share of reports made between 20:00 and 06:00 local time (0–1). */
  nightShare: number;
  lastReportAt: string;
  center: { lat: number; lng: number };
}

export type StorageKind = 'postgres' | 'memory';

export interface StorageStatus {
  active: StorageKind;
  databaseConfigured: boolean;
  reason: string | null;
  fallbackWrites: number;
}

export type SummaryLang = 'ro' | 'en';

export interface AreaSummary {
  areaId: string;
  areaName: string;
  lang: SummaryLang;
  text: string;
  /** 'gemini' when the model wrote it; 'fallback' when GEMINI_API_KEY is not set. */
  source: 'gemini' | 'fallback';
  cached: boolean;
  generatedAt: string;
  stats: SafetyAreaStats | null;
}
