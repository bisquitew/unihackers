import type { TransitLine, DetourAlert } from '@hub/contracts';
import { TRANSIT_LINES_SEED_DATA, TRANSIT_DETOURS_SEED_DATA } from '@hub/contracts';
import { notify } from '../../core/notifications.ts';
import { eventBus } from '../../core/events.ts';
import { placeMatches } from '../../core/text.ts';
import { db } from '../../core/db.ts';

function rowToLine(row: any): TransitLine {
  return {
    id: row.id,
    line_number: row.line_number,
    type: row.type,
    name: row.name,
    status: row.status,
    current_route_summary: row.current_route_summary || '',
  };
}

function rowToDetour(row: any): DetourAlert {
  return {
    id: row.id,
    line_number: row.line_number,
    title: row.title,
    reason: row.reason,
    status: row.status,
    affected_stops: Array.isArray(row.affected_stops) ? row.affected_stops : [row.affected_stops],
    alternative_instructions: row.alternative_instructions,
    replacement_line: row.replacement_line,
    valid_from: new Date(row.valid_from).toISOString(),
    valid_until: row.valid_until ? new Date(row.valid_until).toISOString() : null,
    created_at: new Date(row.created_at).toISOString(),
  };
}

let inMemoryLines: TransitLine[] = [...TRANSIT_LINES_SEED_DATA];
let inMemoryDetours: DetourAlert[] = [...TRANSIT_DETOURS_SEED_DATA];

export const transitService = {
  getAllLines(): TransitLine[] {
    return inMemoryLines;
  },

  getAllDetours(): DetourAlert[] {
    return inMemoryDetours;
  },

  async loadFromDb(): Promise<void> {
    if (db.isTigerConnected()) {
      try {
        const lines = await db.query<any>(`
          SELECT id, line_number, type, name, status, current_route_summary, updated_at
          FROM m05_transit_lines ORDER BY line_number ASC;
        `);
        if (lines && lines.length > 0) {
          inMemoryLines = lines.map(rowToLine);
        }

        const detours = await db.query<any>(`
          SELECT id, line_number, title, reason, status, affected_stops,
                 alternative_instructions, replacement_line, valid_from, valid_until, created_at
          FROM m05_detour_alerts ORDER BY created_at DESC;
        `);
        if (detours && detours.length > 0) {
          inMemoryDetours = detours.map(rowToDetour);
        }
      } catch (err: any) {
        console.warn('TransitService TimescaleDB fallback:', err.message);
      }
    }
  },

  getLineByNumber(lineNumber: string): TransitLine | undefined {
    return inMemoryLines.find((l) => l.line_number.toUpperCase() === lineNumber.toUpperCase());
  },

  checkStopImpact(stopName: string): {
    stop_name: string;
    is_affected_by_detour: boolean;
    active_alerts: DetourAlert[];
    available_lines: string[];
    suspended_lines: string[];
    guidance_message: string;
  } {
    const matchedAlerts = inMemoryDetours.filter((alert) =>
      alert.affected_stops.some((s) => placeMatches(s, stopName))
    );

    const suspendedLines = matchedAlerts
      .filter((a) => a.status === 'suspended')
      .map((a) => a.line_number);

    const isAffected = matchedAlerts.length > 0;

    let guidance = `Stația "${stopName}" funcționează normal.`;
    if (isAffected) {
      guidance = `Atenție! Stația "${stopName}" este afectată de lucrările 2026. Liniile ${suspendedLines.join(', ')} sunt suspendate sau deviate.`;
      if (suspendedLines.includes('5')) {
        guidance += ' Folosiți linia temporară de autobuz 5C din Piața Sf. Gheorghe.';
      }
    }

    return {
      stop_name: stopName,
      is_affected_by_detour: isAffected,
      active_alerts: matchedAlerts,
      available_lines: inMemoryLines.map((l) => l.line_number).filter((num) => !suspendedLines.includes(num)),
      suspended_lines: suspendedLines,
      guidance_message: guidance
    };
  },

  async addDetourAlert(alert: DetourAlert): Promise<DetourAlert> {
    if (db.isTigerConnected()) {
      try {
        await db.query(`
          INSERT INTO m05_detour_alerts (
            id, line_number, title, reason, status, affected_stops,
            alternative_instructions, replacement_line, valid_from, valid_until, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            reason = EXCLUDED.reason,
            status = EXCLUDED.status,
            affected_stops = EXCLUDED.affected_stops,
            alternative_instructions = EXCLUDED.alternative_instructions;
        `, [
          alert.id, alert.line_number, alert.title, alert.reason,
          alert.status, alert.affected_stops, alert.alternative_instructions,
          alert.replacement_line, alert.valid_from, alert.valid_until
        ]);
      } catch (err: any) {
        console.warn('TransitService addDetourAlert TimescaleDB error:', err.message);
      }
    }

    inMemoryDetours.unshift(alert);

    // Update status of corresponding line
    const targetLine = inMemoryLines.find((l) => l.line_number === alert.line_number);
    if (targetLine) {
      targetLine.status = alert.status === 'suspended' ? 'suspended' : 'detoured';
    }

    await eventBus.emit('transit.detour_added', { detour: alert });

    await notify({
      userId: 'all-passengers',
      moduleId: 'm05-transit',
      title: `Deviere STPT Linia ${alert.line_number}`,
      body: alert.title,
      category: 'transit_detour',
      data: { lineNumber: alert.line_number, detourId: alert.id }
    });

    return alert;
  }
};

// Initial background load from TimescaleDB
transitService.loadFromDb().catch(() => {});
