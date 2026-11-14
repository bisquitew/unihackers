import { db } from '../../core/db.ts';
import type { SmellReport, SmellType, StorageKind, StorageStatus } from './types.ts';

/** Where real (non-demo) reports live. Demo reports come from seed.ts and are never stored. */
export interface SmellRepository {
  readonly kind: StorageKind;
  insert(report: SmellReport): Promise<SmellReport>;
  /** Real reports created at or after `since`, newest first. */
  listSince(since: Date): Promise<SmellReport[]>;
}

export class MemorySmellRepository implements SmellRepository {
  readonly kind = 'memory' as const;
  private readonly reports: SmellReport[] = [];

  async insert(report: SmellReport): Promise<SmellReport> {
    this.reports.push(report);
    return report;
  }

  async listSince(since: Date): Promise<SmellReport[]> {
    const t = since.getTime();
    return this.reports.filter((r) => Date.parse(r.createdAt) >= t).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

interface ReportRow {
  id: string;
  type: SmellType;
  intensity: number;
  lat: number | string;
  lng: number | string;
  area_id: string;
  note: string | null;
  created_at: Date | string;
}

/** m06_smell.reports (db/modules/m06-smell/migrations/0001_init_smell.sql) through core/db.ts. */
export class PostgresSmellRepository implements SmellRepository {
  readonly kind = 'postgres' as const;

  async insert(report: SmellReport): Promise<SmellReport> {
    // core/db.ts returns [] instead of throwing, so RETURNING tells us whether the row was written.
    const rows = await db.query<{ id: string }>(
      `INSERT INTO m06_smell.reports (id, type, intensity, lat, lng, area_id, note, created_at, is_demo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
       RETURNING id;`,
      [report.id, report.type, report.intensity, report.lat, report.lng, report.areaId, report.note, report.createdAt],
    );
    if (rows.length === 0) throw new Error('Database insert returned no row (table missing or database unreachable)');
    return report;
  }

  async listSince(since: Date): Promise<SmellReport[]> {
    const rows = await db.query<ReportRow>(
      `SELECT id, type, intensity, lat, lng, area_id, note, created_at
       FROM m06_smell.reports
       WHERE created_at >= $1 AND is_demo = FALSE
       ORDER BY created_at DESC
       LIMIT 5000;`,
      [since.toISOString()],
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      intensity: Number(r.intensity),
      lat: Number(r.lat),
      lng: Number(r.lng),
      areaId: r.area_id,
      note: r.note,
      createdAt: typeof r.created_at === 'string' ? new Date(r.created_at).toISOString() : r.created_at.toISOString(),
      isDemo: false,
    }));
  }
}

/**
 * The repository the module uses: Postgres when DATABASE_URL is set and core/db.ts is connected,
 * memory otherwise. A failed database write falls back to memory, and reads always include
 * those fallback reports, so nothing a user sends is lost.
 */
export class FallbackSmellRepository implements SmellRepository {
  private lastError: string | null = null;
  private fallbackWrites = 0;

  constructor(
    private readonly primary: SmellRepository = new PostgresSmellRepository(),
    private readonly memory: MemorySmellRepository = new MemorySmellRepository(),
  ) {}

  get kind(): StorageKind {
    return db.isTigerConnected() ? 'postgres' : 'memory';
  }

  async insert(report: SmellReport): Promise<SmellReport> {
    if (this.kind === 'postgres') {
      try {
        return await this.primary.insert(report);
      } catch (err) {
        this.lastError = err instanceof Error ? err.message : String(err);
        this.fallbackWrites++;
        console.warn(`[m06-smell] Database write failed, keeping report in memory: ${this.lastError}`);
      }
    }
    return this.memory.insert(report);
  }

  async listSince(since: Date): Promise<SmellReport[]> {
    const fromMemory = await this.memory.listSince(since);
    if (this.kind !== 'postgres') return fromMemory;
    const fromDb = await this.primary.listSince(since);
    const seen = new Set(fromDb.map((r) => r.id));
    return [...fromDb, ...fromMemory.filter((r) => !seen.has(r.id))].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  status(): StorageStatus {
    const databaseConfigured = Boolean(process.env.DATABASE_URL);
    let reason: string | null = this.lastError;
    if (!databaseConfigured) reason = 'DATABASE_URL is not set';
    else if (!db.isTigerConnected()) reason = db.getConnectionError() ?? 'database not connected yet';
    return { active: this.kind, databaseConfigured, reason, fallbackWrites: this.fallbackWrites };
  }
}
