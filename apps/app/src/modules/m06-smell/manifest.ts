import type { ModuleManifest } from '@hub/contracts';
import { SMELL_TYPES } from './api';
import { useSmellPins } from './useSmellPins';

/**
 * Layer for the app's one shared map (P1's Map tab). Data only, no map component:
 * the map calls `usePins()` inside its own pin-layer component and draws each pin at
 * (lat, lng) in `color`, with `label` as the accessible name / callout.
 */
export const smellMapLayer = {
  id: 'm06-smell',
  label: 'Mirosuri',
  usePins: useSmellPins,
  legend: SMELL_TYPES.map(({ id, label, color }) => ({ id, label, color })),
};

export const manifest: ModuleManifest = {
  id: 'm06-smell',
  title: 'Sesizări de Miros',
  owner: 'P4',
  status: 'beta',
  icon: 'wind',
  entryRoute: '/m/smell',
  mapLayer: smellMapLayer,
};
