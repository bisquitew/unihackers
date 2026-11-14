import type { ModuleManifest } from '@hub/contracts';
import { smellMapLayer } from './mapLayer';

export const manifest: ModuleManifest = {
  id: 'm06-smell',
  title: 'Sesizări de Miros',
  owner: 'P4',
  status: 'beta',
  icon: 'wind',
  entryRoute: '/m/smell',
  // P1's shared map calls this (collectModuleLayers) and gets a MapLayer of 'smell' pins.
  mapLayer: smellMapLayer,
};
