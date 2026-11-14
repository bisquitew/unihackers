import { manifest as m01Manifest } from './m01-events/manifest';
import { manifest as m07Manifest } from './m07-buddy/manifest';
import { manifest as m08Manifest } from './m08-forum/manifest';
import { manifest as m09Manifest } from './m09-wallet/manifest';
import { manifest as m10Manifest } from './m10-assistant/manifest';
import { manifest as m11Manifest } from './m11-feedback/manifest';
import { utilitiesManifest } from './m04-utilities/manifest';
import { transitManifest } from './m05-transit/manifest';

export interface ModuleManifest {
  id: string;
  title: string;
  owner: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'draft' | 'beta' | 'live';
  icon: string;
  entryRoute: string;
  homeCard?: any;
  mapLayer?: any;
}

function createStubManifest(id: string, title: string, owner: 'P1' | 'P2' | 'P3' | 'P4', icon: string, route: string): ModuleManifest {
  return {
    id,
    title,
    owner,
    status: 'draft',
    icon,
    entryRoute: route
  };
}

export const registeredModuleManifests: ModuleManifest[] = [
  m01Manifest as unknown as ModuleManifest,
  createStubManifest('m02-visitor-info', 'Ghid Turistic', 'P4', 'info', '/m/visitor-info'),
  createStubManifest('m03-safety', 'Siguranță Urbană', 'P4', 'shield', '/m/safety'),
  utilitiesManifest, // [M04_UTILITIES] - Owned by P2
  transitManifest,   // [M05_TRANSIT] - Owned by P2
  createStubManifest('m06-smell', 'Harta Mirosurilor', 'P4', 'wind', '/m/smell'),
  m07Manifest as unknown as ModuleManifest,
  m08Manifest as unknown as ModuleManifest,
  m09Manifest as unknown as ModuleManifest,
  m10Manifest, // [M10_ASSISTANT] - P4
  m11Manifest, // [M11_FEEDBACK] - P4
  createStubManifest('m12-dashboard', 'Panou Municipal', 'P4', 'bar-chart', '/m/dashboard'),
  createStubManifest('parkie', 'Parkie Smart Parking', 'P1', 'parking', '/m/parkie')
];

export const registeredModules = registeredModuleManifests;

export {
  m01Manifest,
  m07Manifest,
  m08Manifest,
  m09Manifest,
  utilitiesManifest,
  transitManifest,
};
