import { manifest as m01Manifest } from './m01-events/manifest';
import { manifest as m07Manifest } from './m07-buddy/manifest';
import { manifest as m08Manifest } from './m08-forum/manifest';
import { manifest as m09Manifest } from './m09-wallet/manifest';
import { manifest as m10Manifest } from './m10-assistant/manifest';
import { manifest as m11Manifest } from './m11-feedback/manifest';
import { manifest as m02Manifest } from './m02-visitor-info/manifest';
import { manifest as m06Manifest } from './m06-smell/manifest';
import { utilitiesManifest } from './m04-utilities/manifest';
import { transitManifest } from './m05-transit/manifest';
import { dashboardManifest } from './m12-dashboard/manifest';
import { parkieManifest } from './parkie/manifest';

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
  m02Manifest, // [M02_VISITOR_INFO] - P4
  createStubManifest('m03-safety', 'Siguranță Urbană', 'P4', 'shield', '/m/safety'),
  utilitiesManifest, // [M04_UTILITIES] - Owned by P2
  transitManifest,   // [M05_TRANSIT] - Owned by P2
  m06Manifest, // [M06_SMELL] - P4
  m07Manifest as unknown as ModuleManifest,
  m08Manifest as unknown as ModuleManifest,
  m09Manifest as unknown as ModuleManifest,
  m10Manifest, // [M10_ASSISTANT] - P4
  m11Manifest, // [M11_FEEDBACK] - P4
  dashboardManifest, // [M12_DASHBOARD] - P4 & P2
  parkieManifest // [PARKIE] - P1 & P2
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
