import type { Outage, OutageCreatePayload } from '@hub/contracts';
import { UTILITIES_SEED_DATA } from '@hub/contracts';
import { notify } from '../../core/notifications.ts';
import { eventBus } from '../../core/events.ts';
import { placeMatches } from '../../core/text.ts';

// In-memory outage store seeded with realistic Timișoara data
let outages: Outage[] = [...UTILITIES_SEED_DATA];

export const utilitiesService = {
  getAllOutages(filter?: { provider?: string; status?: string; area?: string }): Outage[] {
    return outages.filter((o) => {
      if (filter?.provider && o.provider !== filter.provider) return false;
      if (filter?.status && o.status !== filter.status) return false;
      if (filter?.area) {
        const areaMatch = o.affected_areas.some((a) => a.toLowerCase().includes(filter.area!.toLowerCase()));
        if (!areaMatch) return false;
      }
      return true;
    });
  },

  getOutageById(id: string): Outage | undefined {
    return outages.find((o) => o.id === id);
  },

  async createOutage(payload: OutageCreatePayload): Promise<Outage> {
    const newOutage: Outage = {
      ...payload,
      id: crypto.randomUUID(),
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

    outages.unshift(newOutage);

    // Emit event so other services / push listeners can react
    await eventBus.emit('outage.created', { outage: newOutage });

    // Broadcast notification to console / push queue
    await notify({
      userId: 'all-affected-residents',
      moduleId: 'm04-utilities',
      title: `⚠️ Alertă Utilități: ${newOutage.title}`,
      body: `Zone afectate: ${newOutage.affected_areas.join(', ')}. Reluare estimată: ${newOutage.estimated_restore_time || 'Necunoscut'}.`,
      category: 'outage',
      data: { outageId: newOutage.id }
    });

    return newOutage;
  },

  checkAddressImpact(addressOrArea: string): { is_affected: boolean; active_outages: Outage[]; message: string } {
    const active = outages.filter((o) => o.status !== 'resolved');

    // Diacritics, case and Romanian articles ("Complexul") don't matter.
    const matched = active.filter((o) =>
      o.affected_areas.some((area) => placeMatches(area, addressOrArea)) ||
      o.affected_streets.some((street) => placeMatches(street, addressOrArea))
    );

    if (matched.length > 0) {
      return {
        is_affected: true,
        active_outages: matched,
        message: `Adresa dumneavoastră este afectată de ${matched.length} avarii/lucrări active.`
      };
    }

    return {
      is_affected: false,
      active_outages: [],
      message: 'Nu există avarii de încălzire, apă caldă sau energie raportate în această zonă.'
    };
  },

  confirmOutage(outageId: string): Outage | undefined {
    const outage = outages.find((o) => o.id === outageId);
    if (outage) {
      outage.crowd_confirmations_count += 1;
      outage.updated_at = new Date().toISOString();
      eventBus.emit('outage.confirmed', { outageId, count: outage.crowd_confirmations_count });
    }
    return outage;
  }
};
