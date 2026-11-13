import { ModuleManifest } from '@hub/contracts';
import { utilitiesManifest } from './m04-utilities/manifest';
import { transitManifest } from './m05-transit/manifest';

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
  createStubManifest('m01-events', 'Evenimente Culturale', 'P3', 'calendar', '/m/events'),
  createStubManifest('m02-visitor-info', 'Ghid Turistic', 'P4', 'info', '/m/visitor-info'),
  createStubManifest('m03-safety', 'Siguranță Urbană', 'P4', 'shield', '/m/safety'),
  utilitiesManifest, // [M04_UTILITIES] - Owned by P2
  transitManifest,   // [M05_TRANSIT] - Owned by P2
  createStubManifest('m06-smell', 'Harta Mirosurilor', 'P4', 'wind', '/m/smell'),
  createStubManifest('m07-buddy', 'Cu Cine? (Event Buddy)', 'P3', 'users', '/m/buddy'),
  createStubManifest('m08-forum', 'Forum Comunitar', 'P3', 'message-square', '/m/forum'),
  createStubManifest('m09-wallet', 'Solana Civic Wallet', 'P3', 'credit-card', '/m/wallet'),
  createStubManifest('m10-assistant', 'Asistent AI Timișoara', 'P4', 'bot', '/m/assistant'),
  createStubManifest('m11-feedback', 'Living Labs Feedback', 'P4', 'star', '/m/feedback'),
  createStubManifest('m12-dashboard', 'Panou Municipal', 'P4', 'bar-chart', '/m/dashboard'),
  createStubManifest('parkie', 'Parkie Smart Parking', 'P1', 'parking', '/m/parkie')
];
