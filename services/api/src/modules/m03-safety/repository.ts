import { db } from '../../core/db.ts';
import type { SafetyReport, SafetyType, StorageKind, StorageStatus } from './types.ts';

/** Where real (non-demo) reports live. Demo reports come from seed.ts and are never stored. */
export interface SafetyRepository {
  readonly kind: StorageKind;
  insert(report: SafetyReport): Promise<SafetyReport>;
  /** Real reports created at or after `since`, newest first. */
  listSince(since: Date): Promise<SafetyReport[]>;
}

const newestFirst = (a: SafetyReport, b: SafetyReport) => b.createdAt.localeCompare(a.createdAt);

export class MemorySafetyRepository implements SafetyRepository {
  readonly kind = 'memory' as const;
  private readonly reports: SafetyReport[] = [];

  async insert(report: SafetyReport): Promise<SafetyReport> {
    this.reports.push(report);
    return report;
  }

  async listSince(since: Date): Promise<SafetyReport[]> {
    const t = since.getTime();
    return this.reports.filter((r) => Date.parse(r.createdAt) >= t).sort(newestFirst);
  }
}

interface ReportRow {
  id: string;
  type: SafetyType;
  lat: number | string;
  lng: number | string;
  area_id: string;
  note: string | null;
  created_at: Date | string;
}

/** m03_safety.reports (db/modules/m03-safety/migrations/0001_init_safety.sql) through core/db.ts. */
export class PostgresSafetyRepository implements SafetyRepository {
  readonly kind = 'postgres' as const;

  async insert(report: SafetyReport): Promise<SafetyReport> {
    // core/db.ts returns [] instead of throwing, so RETURNING tells us whether the row was written.
    const rows = await db.query<{ id: string }>(
      `INSERT INTO m03_safety.reports (id, type, lat, lng, area_id, note, created_at, is_demo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING id;`,
      [report.id, report.type, report.lat, report.lng, report.areaId, report.note, report.createdAt],
    );
    if (rows.length === 0) throw new Error('Database insert returned no row (table missing or database unreachable)');
    return report;
  }

  async listSince(since: Date): Promise<SafetyReport[]> {
    const rows = await db.query<ReportRow>(
      `SELECT id, type, lat, lng, area_id, note, created_at
       FROM m03_safety.reports
       WHERE created_at >= $1 AND is_demo = FALSE
       ORDER BY created_at DESC
       LIMIT 5000;`,
      [since.toISOString()],
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      lat: Number(r.lat),
      lng: Number(r.lng),
      areaId: r.area_id,
      note: r.note,
      createdAt: new Date(r.created_at).toISOString(),
      isDemo: false,
    }));
  }
}

/**
 * Postgres when DATABASE_URL is set and core/db.ts is connected, memory otherwise. A failed database write
 * falls back to memory, and reads always include those fallback reports, so nothing a user sends is lost.
 */
export class FallbackSafetyRepository implements SafetyRepository {
  private readonly primary: SafetyRepository;
  private readonly memory: MemorySafetyRepository;
  private lastError: string | null = null;
  private fallbackWrites = 0;

  constructor(primary: SafetyRepository = new PostgresSafetyRepository(), memory: MemorySafetyRepository = new MemorySafetyRepository()) {
    this.primary = primary;
    this.memory = memory;
  }

  get kind(): StorageKind {
    return db.isTigerConnected() ? 'postgres' : 'memory';
  }

  async insert(report: SafetyReport): Promise<SafetyReport> {
    if (this.kind === 'postgres') {
      try {
        return await this.primary.insert(report);
      } catch (err) {
        this.lastError = err instanceof Error ? err.message : String(err);
        this.fallbackWrites++;
        console.warn(`[m03-safety] Database write failed, keeping report in memory: ${this.lastError}`);
      }
    }
    return this.memory.insert(report);
  }

  async listSince(since: Date): Promise<SafetyReport[]> {
    const fromMemory = await this.memory.listSince(since);
    if (this.kind !== 'postgres') return fromMemory;
    const fromDb = await this.primary.listSince(since);
    const seen = new Set(fromDb.map((r) => r.id));
    return [...fromDb, ...fromMemory.filter((r) => !seen.has(r.id))].sort(newestFirst);
  }

  status(): StorageStatus {
    const databaseConfigured = Boolean(process.env.DATABASE_URL);
    let reason: string | null = this.lastError;
    if (!databaseConfigured) reason = 'DATABASE_URL is not set';
    else if (!db.isTigerConnected()) reason = db.getConnectionError() ?? 'database not connected yet';
    return { active: this.kind, databaseConfigured, reason, fallbackWrites: this.fallbackWrites };
  }
}
