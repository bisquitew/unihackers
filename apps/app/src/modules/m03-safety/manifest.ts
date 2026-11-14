import type { ModuleManifest } from '@hub/contracts';
import { safetyMapLayer } from './mapLayer';

export const manifest: ModuleManifest = {
  id: 'm03-safety',
  title: 'Siguranță Urbană',
  owner: 'P4',
  status: 'beta',
  icon: 'shield',
  entryRoute: '/m/safety',
  // P1's shared map calls this (collectModuleLayers) and gets a MapLayer of 'safety' pins.
  mapLayer: safetyMapLayer,
};
