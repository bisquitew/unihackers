import type { Outage, OutageCreatePayload } from '@hub/contracts';
import { UTILITIES_SEED_DATA } from '@hub/contracts';
import { notify } from '../../core/notifications.ts';
import { eventBus } from '../../core/events.ts';
import { placeMatches } from '../../core/text.ts';
import { db } from '../../core/db.ts';

function rowToOutage(row: any): Outage {
  return {
    id: row.id,
    provider: row.provider,
    type: row.type,
    status: row.status,
    severity: row.severity,
    title: row.title,
    description: row.description,
    affected_areas: Array.isArray(row.affected_areas) ? row.affected_areas : [row.affected_areas],
    affected_streets: Array.isArray(row.affected_streets) ? row.affected_streets : [],
    start_time: new Date(row.start_time).toISOString(),
    estimated_restore_time: row.estimated_restore_time ? new Date(row.estimated_restore_time).toISOString() : null,
    resolved_at: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
    source_url: row.source_url,
    crowd_confirmations_count: Number(row.crowd_confirmations_count || 1),
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

let inMemoryOutages: Outage[] = [...UTILITIES_SEED_DATA];

export const utilitiesService = {
  getAllOutages(filter?: { provider?: string; status?: string; area?: string }): Outage[] {
    // If we have sync caller, we provide cached or in-memory, but when async we populate from DB
    return inMemoryOutages.filter((o) => {
      if (filter?.provider && o.provider !== filter.provider) return false;
      if (filter?.status && o.status !== filter.status) return false;
      if (filter?.area) {
        const areaMatch = o.affected_areas.some((a) => a.toLowerCase().includes(filter.area!.toLowerCase()));
        if (!areaMatch) return false;
      }
      return true;
    });
  },

  async loadOutagesFromDb(): Promise<Outage[]> {
    if (db.isTigerConnected()) {
      try {
        const rows = await db.query<any>(`
          SELECT id, provider, type, status, severity, title, description,
                 affected_areas, affected_streets, start_time, estimated_restore_time,
                 resolved_at, source_url, crowd_confirmations_count, created_at, updated_at
          FROM m04_utilities_outages
          ORDER BY start_time DESC;
        `);
        if (rows && rows.length > 0) {
          inMemoryOutages = rows.map(rowToOutage);
          return inMemoryOutages;
        }
      } catch (err: any) {
        console.warn('UtilitiesService TimescaleDB fallback:', err.message);
      }
    }
    return inMemoryOutages;
  },

  confirmOutage(id: string): Outage | undefined {
    const outage = inMemoryOutages.find((o) => o.id === id);
    if (!outage) return undefined;
    outage.crowd_confirmations_count = (outage.crowd_confirmations_count || 0) + 1;
    if (db.isTigerConnected()) {
      db.query('UPDATE m04_utilities_outages SET crowd_confirmations_count = crowd_confirmations_count + 1 WHERE id = $1;', [id]).catch(() => {});
    }
    return outage;
  },

  getOutageById(id: string): Outage | undefined {
    return inMemoryOutages.find((o) => o.id === id);
  },

  async createOutage(payload: OutageCreatePayload): Promise<Outage> {
    const id = crypto.randomUUID();
    const newOutage: Outage = {
      ...payload,
      id,
      status: payload.status || 'investigating',
      severity: payload.severity || 'medium',
      affected_areas: Array.isArray(payload.affected_areas) ? payload.affected_areas : [(payload as any).neighbourhood || 'Timișoara'],
      affected_streets: Array.isArray(payload.affected_streets) ? payload.affected_streets : [],
      start_time: payload.start_time || new Date().toISOString(),
      estimated_restore_time: payload.estimated_restore_time || null,
      resolved_at: null,
      crowd_confirmations_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (db.isTigerConnected()) {
      try {
        await db.query(`
          INSERT INTO m04_utilities_outages (
            id, provider, type, status, severity, title, description,
            affected_areas, affected_streets, start_time, estimated_restore_time,
            crowd_confirmations_count, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1, NOW(), NOW());
        `, [
          newOutage.id, newOutage.provider, newOutage.type, newOutage.status,
          newOutage.severity, newOutage.title, newOutage.description,
          newOutage.affected_areas, newOutage.affected_streets,
          newOutage.start_time, newOutage.estimated_restore_time
        ]);
      } catch (err: any) {
        console.warn('UtilitiesService createOutage TimescaleDB error:', err.message);
      }
    }

    inMemoryOutages.unshift(newOutage);

    await eventBus.emit('outage.created', { outage: newOutage });

    await notify({
      userId: 'all-affected-residents',
      moduleId: 'm04-utilities',
      title: `Avarie nouă: ${newOutage.title}`,
      body: `Afectează: ${newOutage.affected_areas.join(', ')}. Estimare remediere: ${newOutage.estimated_restore_time || 'în curs de evaluare'}`,
      category: 'outage',
      data: { outageId: newOutage.id, provider: newOutage.provider }
    });

    return newOutage;
  },

  checkAddressImpact(queryAddress: string): {
    address: string;
    is_affected: boolean;
    active_outages: Outage[];
    summary: string;
  } {
    const q = queryAddress.toLowerCase();
    const matchedOutages = inMemoryOutages.filter((o) => {
      if (o.status === 'resolved') return false;
      const areaHit = o.affected_areas.some((a) => q.includes(a.toLowerCase()) || a.toLowerCase().includes(q));
      const streetHit = o.affected_streets.some((s) => placeMatches(s, q));
      return areaHit || streetHit;
    });

    const isAffected = matchedOutages.length > 0;
    let summary = `Nu există avarii active raportate pentru adresa/zona "${queryAddress}". Toate utilitățile funcționează normal.`;

    if (isAffected) {
      const providers = Array.from(new Set(matchedOutages.map((o) => o.provider))).join(', ');
      summary = `Atenție! Adresa/zona "${queryAddress}" este afectată de ${matchedOutages.length} avarii active (${providers}).`;
    }

    return {
      address: queryAddress,
      is_affected: isAffected,
      active_outages: matchedOutages,
      summary
    };
  }
};

// Initial background load from TimescaleDB
utilitiesService.loadOutagesFromDb().catch(() => {});
