import type { TransitLine, DetourAlert } from '@hub/contracts';
import { TRANSIT_LINES_SEED_DATA, TRANSIT_DETOURS_SEED_DATA } from '@hub/contracts';
import { notify } from '../../core/notifications.ts';
import { eventBus } from '../../core/events.ts';
import { placeMatches } from '../../core/text.ts';

let transitLines: TransitLine[] = [...TRANSIT_LINES_SEED_DATA];
let detourAlerts: DetourAlert[] = [...TRANSIT_DETOURS_SEED_DATA];

export const transitService = {
  getAllLines(): TransitLine[] {
    return transitLines;
  },

  getAllDetours(): DetourAlert[] {
    return detourAlerts;
  },

  getLineByNumber(lineNumber: string): TransitLine | undefined {
    return transitLines.find((l) => l.line_number.toUpperCase() === lineNumber.toUpperCase());
  },

  checkStopImpact(stopName: string): {
    stop_name: string;
    is_affected_by_detour: boolean;
    active_alerts: DetourAlert[];
    available_lines: string[];
    suspended_lines: string[];
    guidance_message: string;
  } {
    // Find alerts affecting this stop (diacritics, case and articles don't matter)
    const matchedAlerts = detourAlerts.filter((alert) =>
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
      available_lines: isAffected ? ['5C', '1 (deviat)'] : ['1', '2', '4'],
      suspended_lines: suspendedLines,
      guidance_message: guidance
    };
  },

  async addDetourAlert(alert: DetourAlert): Promise<DetourAlert> {
    detourAlerts.unshift(alert);

    // Update corresponding transit line status
    const line = transitLines.find((l) => l.line_number === alert.line_number);
    if (line) {
      line.status = alert.status;
      line.detour_alert = alert;
    }

    await eventBus.emit('transit.detour_updated', { alert });

    await notify({
      userId: 'all-transit-users',
      moduleId: 'm05-transit',
      title: `🚧 Modificare Traseu: Linia ${alert.line_number}`,
      body: alert.title,
      category: 'transit_detour',
      data: { alertId: alert.id, lineNumber: alert.line_number }
    });

    return alert;
  }
};
