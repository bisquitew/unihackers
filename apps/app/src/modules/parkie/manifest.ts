import type { MapLayer, MapPin } from '@hub/map';
// Straight from the seed file: the @hub/contracts entry loads zod-shim (top-level await), which breaks Expo's web build.
import { PARKIE_SEED_LOTS } from '../../../../../packages/contracts/src/seed/parkie.seed.ts';

/**
 * Mobile App Parkie Integration:
 * Citizens can view real-time parking lots and availability on the interactive city map.
 * The Admin Camera Feed & Plot Calibration Dashboard is exclusively available on the Web Portal.
 */
export function parkieMapLayer(): MapLayer {
  const pins: MapPin[] = PARKIE_SEED_LOTS.map((lot) => ({
    id: lot.id,
    kind: 'parking' as const,
    layerId: 'parkie',
    coordinate: {
      latitude: lot.latitude,
      longitude: lot.longitude,
    },
    title: lot.name,
    subtitle: `${lot.available_spots}/${lot.capacity} locuri libere`,
    visibility: 'public' as const,
    owner: 'official' as const,
    href: '/m/parkie',
    createdAt: lot.last_updated || '2026-11-14T10:00:00Z',
    demo: true,
  }));

  return {
    id: 'parkie',
    title: 'Parcări (Parkie)',
    moduleId: 'parkie',
    pins,
    defaultVisible: true,
  };
}

export const parkieManifest = {
  id: 'parkie',
  title: 'Parkie Smart Parking',
  owner: 'P1' as const,
  status: 'live' as const,
  icon: 'parking',
  entryRoute: '/m/parkie',
  mapLayer: parkieMapLayer,
};

export default parkieManifest;
