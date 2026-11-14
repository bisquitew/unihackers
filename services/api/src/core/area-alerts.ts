import type { AreaAlert, AreaAlertType, AreaAlertSeverity } from '@hub/contracts';
import { TIMISOARA_AREAS, calculateDistanceMeters, findMatchingArea } from './areas.ts';
import { notify } from './notifications.ts';
import { eventBus } from './events.ts';
import { DEV_USERS } from './auth.ts';
import { placeMatches } from './text.ts';

// Initial seeded danger & construction radius events in Timișoara
const SEED_AREA_ALERTS: AreaAlert[] = [
  {
    id: 'alert-danger-jiul',
    title: '🚨 Alertă Scurgere Gaze & Perimetru Pasajul Jiul',
    description: 'Scurgere de gaze identificată în timpul lucrărilor edilitare. A fost instituit un perimetru de siguranță de 650m. Evitați zona, închideți geamurile și permiteți accesul echipajelor ISU Banat.',
    type: 'danger',
    severity: 'critical',
    latitude: 45.7530,
    longitude: 21.2160,
    radius_meters: 650,
    neighbourhood: 'Circumvalațiunii',
    affected_neighbourhoods: ['Circumvalațiunii', 'Cetate (Centru)', 'Gara de Nord'],
    affected_residents_count: 1420,
    status: 'active',
    start_time: '2026-11-14T17:30:00Z',
    expected_end_time: '2026-11-14T23:00:00Z',
    created_at: '2026-11-14T17:32:00Z',
    updated_at: '2026-11-14T17:32:00Z'
  },
  {
    id: 'alert-const-bogdanestilor',
    title: '🚧 Șantier Modernizare Cale Rulată Calea Bogdăneștilor',
    description: 'Lucrări de reabilitare a carosabilului și a căii de rulare STPT. Utilaje grele în mișcare, acces auto restricționat doar pentru riverani pe o rază de 900m.',
    type: 'construction',
    severity: 'high',
    latitude: 45.7665,
    longitude: 21.2050,
    radius_meters: 900,
    neighbourhood: 'Mehala',
    affected_neighbourhoods: ['Mehala', 'Circumvalațiunii', 'Dâmbovița'],
    affected_residents_count: 860,
    status: 'active',
    start_time: '2026-11-10T08:00:00Z',
    expected_end_time: '2026-12-15T18:00:00Z',
    created_at: '2026-11-10T08:00:00Z',
    updated_at: '2026-11-14T12:00:00Z'
  },
  {
    id: 'alert-const-complex',
    title: '🚧 Șantier Înlocuire Magistrală Termică Colterm',
    description: 'Săpături și înlocuire rețea secundară de termoficare pe Aleea Studenților. Perimetru de șantier marcat cu semnalizare pe o rază de 550m.',
    type: 'construction',
    severity: 'medium',
    latitude: 45.7485,
    longitude: 21.2420,
    radius_meters: 550,
    neighbourhood: 'Complex Studențesc',
    affected_neighbourhoods: ['Complex Studențesc', 'Elisabetin', 'Fabric'],
    affected_residents_count: 640,
    status: 'active',
    start_time: '2026-11-12T07:00:00Z',
    expected_end_time: '2026-11-18T17:00:00Z',
    created_at: '2026-11-12T07:00:00Z',
    updated_at: '2026-11-14T09:00:00Z'
  },
  {
    id: 'alert-danger-traian',
    title: '⚠️ Pericol Desprindere Fațadă Istorică Piața Traian',
    description: 'Risc de cădere de tencuială și elemente decorative de pe clădire monument istoric. Perimetru de delimitare pietonală instituit de Poliția Locală pe o rază de 350m.',
    type: 'danger',
    severity: 'high',
    latitude: 45.7570,
    longitude: 21.2505,
    radius_meters: 350,
    neighbourhood: 'Fabric',
    affected_neighbourhoods: ['Fabric', 'Cetate (Centru)'],
    affected_residents_count: 410,
    status: 'active',
    start_time: '2026-11-14T14:15:00Z',
    expected_end_time: '2026-11-15T20:00:00Z',
    created_at: '2026-11-14T14:15:00Z',
    updated_at: '2026-11-14T14:15:00Z'
  }
];

let areaAlerts: AreaAlert[] = [...SEED_AREA_ALERTS];

/**
 * Computes all Timișoara neighbourhoods that overlap with the alert's danger or construction radius.
 */
export function computeAffectedNeighbourhoods(lat: number, lng: number, radiusMeters: number): string[] {
  const affected: string[] = [];

  for (const area of TIMISOARA_AREAS) {
    const dist = calculateDistanceMeters(lat, lng, area.center_lat, area.center_lng);
    // Overlap condition: distance between centers <= (alert radius + neighborhood approximate radius * 0.75)
    if (dist <= (radiusMeters + area.radius_meters * 0.75)) {
      affected.push(area.name);
    }
  }

  if (affected.length === 0) {
    const closest = findMatchingArea(lat, lng);
    if (closest) affected.push(closest.name);
  }

  return affected;
}

/**
 * Broadcasts emergency / construction signals to all nearest residents and logging channels.
 */
export async function signalNearestNeighbours(alert: AreaAlert): Promise<number> {
  const affectedNeighbourhoods = alert.affected_neighbourhoods;
  let signaledCount = 0;

  // Signal all known registered users in affected neighbourhoods
  for (const [token, user] of Object.entries(DEV_USERS)) {
    const userNeighbourhood = (user as any).neighbourhood || 'Cetate';
    const isAffected = affectedNeighbourhoods.some(n => placeMatches(n, userNeighbourhood));

    if (isAffected) {
      signaledCount++;
      await notify({
        userId: user.sub,
        moduleId: 'm03-safety',
        title: `${alert.type === 'danger' ? '🚨 PERICOL IMINENT' : '🚧 ALERTĂ ȘANTIER / CONSTRUCȚIE'}: ${alert.title}`,
        body: `Atenție! Cartierul dumneavoastră (${userNeighbourhood}) se află în raza de ${alert.radius_meters}m a incidentului. Recomandare: ${alert.description.slice(0, 120)}...`,
        category: 'safety',
        data: {
          alertId: alert.id,
          type: alert.type,
          severity: alert.severity,
          radius_meters: alert.radius_meters,
          latitude: alert.latitude,
          longitude: alert.longitude
        }
      });
    }
  }

  // Also broadcast a public area notification
  await notify({
    userId: 'all-residents-in-radius',
    moduleId: 'm03-safety',
    title: `📡 Alertă Radiată: ${alert.title}`,
    body: `Zone și vecini semnalați: ${affectedNeighbourhoods.join(', ')} (Rază de impact: ${alert.radius_meters} metri).`,
    category: 'safety',
    data: { alertId: alert.id }
  });

  return Math.max(signaledCount * 120, alert.affected_residents_count || 350);
}

export const areaAlertsService = {
  getAll(filter?: { type?: AreaAlertType; status?: string; neighbourhood?: string }): AreaAlert[] {
    return areaAlerts.filter(a => {
      if (filter?.type && a.type !== filter.type) return false;
      if (filter?.status && a.status !== filter.status) return false;
      if (filter?.neighbourhood) {
        const matchesPrimary = a.neighbourhood?.toLowerCase().includes(filter.neighbourhood.toLowerCase());
        const matchesAffected = a.affected_neighbourhoods.some(n => n.toLowerCase().includes(filter.neighbourhood!.toLowerCase()));
        if (!matchesPrimary && !matchesAffected) return false;
      }
      return true;
    });
  },

  getById(id: string): AreaAlert | undefined {
    return areaAlerts.find(a => a.id === id);
  },

  async create(payload: {
    title: string;
    description: string;
    type: AreaAlertType;
    severity?: AreaAlertSeverity;
    latitude: number;
    longitude: number;
    radius_meters: number;
    neighbourhood?: string;
    expected_end_time?: string;
  }): Promise<AreaAlert> {
    const computedNeighbours = computeAffectedNeighbourhoods(payload.latitude, payload.longitude, payload.radius_meters);
    const primaryArea = payload.neighbourhood || findMatchingArea(payload.latitude, payload.longitude)?.name || 'Timișoara';

    const newAlert: AreaAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      severity: payload.severity || (payload.type === 'danger' ? 'critical' : 'high'),
      latitude: payload.latitude,
      longitude: payload.longitude,
      radius_meters: payload.radius_meters,
      neighbourhood: primaryArea,
      affected_neighbourhoods: computedNeighbours,
      affected_residents_count: 0,
      status: 'active',
      start_time: new Date().toISOString(),
      expected_end_time: payload.expected_end_time || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const count = await signalNearestNeighbours(newAlert);
    newAlert.affected_residents_count = count;

    areaAlerts.unshift(newAlert);
    await eventBus.emit('area_alert.created', { alert: newAlert });

    return newAlert;
  },

  checkProximity(query: { latitude?: number; longitude?: number; address?: string; neighbourhood?: string }): {
    in_danger_zone: boolean;
    in_construction_zone: boolean;
    matching_alerts: Array<{
      alert: AreaAlert;
      distance_meters: number;
      is_inside_radius: boolean;
      status_message: string;
    }>;
  } {
    let checkLat = query.latitude;
    let checkLng = query.longitude;

    if ((checkLat === undefined || checkLng === undefined) && (query.address || query.neighbourhood)) {
      const searchTerm = query.neighbourhood || query.address || '';
      for (const area of TIMISOARA_AREAS) {
        if (placeMatches(area.name, searchTerm) || placeMatches(area.slug, searchTerm)) {
          checkLat = area.center_lat;
          checkLng = area.center_lng;
          break;
        }
      }
    }

    if (checkLat === undefined || checkLng === undefined) {
      // Default fallback coordinates: Timișoara Centru
      checkLat = 45.7578;
      checkLng = 21.2290;
    }

    const activeAlerts = areaAlerts.filter(a => a.status === 'active');
    const matches = activeAlerts.map(alert => {
      const distance = Math.round(calculateDistanceMeters(checkLat!, checkLng!, alert.latitude, alert.longitude));
      const isNeighbourhoodMatch = Boolean(query.neighbourhood && alert.affected_neighbourhoods.some(n => placeMatches(n, query.neighbourhood!)));
      const isAddressMatch = Boolean(query.address && (
        placeMatches(alert.title, query.address) ||
        alert.affected_neighbourhoods.some(n => placeMatches(n, query.address!))
      ));
      const inside = (distance <= alert.radius_meters) || isNeighbourhoodMatch || isAddressMatch;
      let statusMsg = '';

      if (inside) {
        statusMsg = alert.type === 'danger'
          ? `⚠️ SUNTEȚI ÎN PERIMETRUL DE PERICOL! Zona dumneavoastră este semnalată direct (${distance}m de focar, perimetru: ${alert.radius_meters}m). Respectați recomandările de siguranță.`
          : `🚧 SUNTEȚI ÎN ZONA DE ȘANTIER! Zona dumneavoastră este afectată direct de lucrări (${distance}m distanță, perimetru marcat: ${alert.radius_meters}m). Posibil trafic restricționat și zgomot.`;
      } else {
        const delta = distance - alert.radius_meters;
        statusMsg = `Sunteți în afara perimetrului direct (${distance}m distanță, la ${delta}m de limita perimetrului de ${alert.radius_meters}m).`;
      }

      return {
        alert,
        distance_meters: distance,
        is_inside_radius: inside,
        status_message: statusMsg
      };
    });

    const inDanger = matches.some(m => m.is_inside_radius && m.alert.type === 'danger');
    const inConstruction = matches.some(m => m.is_inside_radius && m.alert.type === 'construction');

    // Sort matching alerts so inside radius come first, then closest distance
    matches.sort((a, b) => {
      if (a.is_inside_radius !== b.is_inside_radius) return a.is_inside_radius ? -1 : 1;
      return a.distance_meters - b.distance_meters;
    });

    return {
      in_danger_zone: inDanger,
      in_construction_zone: inConstruction,
      matching_alerts: matches
    };
  }
};
