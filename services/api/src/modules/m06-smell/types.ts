export const SMELL_TYPES = ['burnt_rubber', 'smoke', 'sewage', 'chemical', 'garbage', 'other'] as const;
export type SmellType = (typeof SMELL_TYPES)[number];

export interface SmellReport {
  id: string;
  type: SmellType;
  /** 1 (faint) to 5 (very strong). */
  intensity: number;
  lat: number;
  lng: number;
  areaId: string;
  note: string | null;
  createdAt: string;
  /** Simulated report from seed.ts, never stored in the database. */
  isDemo: boolean;
}

export interface NewSmellReport {
  type: SmellType;
  intensity: number;
  lat: number;
  lng: number;
  areaId: string;
  note: string | null;
}

/** What the shared map needs for one pin. */
export interface SmellPin {
  id: string;
  lat: number;
  lng: number;
  type: SmellType;
  intensity: number;
  createdAt: string;
  areaId: string;
}

export interface SmellAreaStats {
  areaId: string;
  areaName: string;
  count: number;
  avgIntensity: number;
  dominantType: SmellType;
  center: { lat: number; lng: number };
}

export interface SmellHourBucket {
  /** Start of the hour (ISO, UTC). */
  hour: string;
  total: number;
  byType: Record<SmellType, number>;
}

export type StorageKind = 'postgres' | 'memory';

export interface StorageStatus {
  active: StorageKind;
  databaseConfigured: boolean;
  /** Why the database is not used, or the last write error that caused a fallback. */
  reason: string | null;
  /** Reports kept in memory because a database write failed. */
  fallbackWrites: number;
}

export interface WindReading {
  source: 'open-meteo' | 'mock';
  /** Why the mock was used. */
  reason: string | null;
  speedKmh: number;
  /** Meteorological direction: where the wind comes FROM, degrees clockwise from north. */
  directionDeg: number;
  /** Compass point the wind comes from, e.g. "W". */
  from: string;
  observedAt: string;
  fetchedAt: string;
  cached: boolean;
}

/** Extra fields on every read response, so the app can label demo data. */
export interface DemoInfo {
  includeDemo: boolean;
  demoCount: number;
}
