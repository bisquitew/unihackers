import { Hono } from 'hono';
import m01Events from './m01-events';
import m07Buddy from './m07-buddy';
import m08Forum from './m08-forum';
import m09Wallet from './m09-wallet';
import { utilitiesApiModule } from './m04-utilities/index';
import { transitApiModule } from './m05-transit/index';
import type { ApiModule } from '../types';

// Helper to create empty stub module so all routes exist without merge conflicts
function createStubModule(id: string): ApiModule {
  const router = new Hono();
  router.get('/', (c) => c.json({ module: id, status: 'stub_ready' }));
  return {
    id,
    title: id,
    routes: router
  };
}

export const registeredModules: ApiModule[] = [
  m01Events,
  createStubModule('m02-visitor-info'),
  createStubModule('m03-safety'),
  utilitiesApiModule as unknown as ApiModule,  // [M04_UTILITIES] - P2
  transitApiModule as unknown as ApiModule,    // [M05_TRANSIT] - P2
  createStubModule('m06-smell'),
  m07Buddy,                                    // [M07_BUDDY] - P3
  m08Forum,                                    // [M08_FORUM] - P3
  m09Wallet,                                   // [M09_WALLET] - P3
  createStubModule('m10-assistant'),
  createStubModule('m11-feedback'),
  createStubModule('m12-dashboard'),
  createStubModule('parkie')
];

export const registeredApiModules = registeredModules;

export {
  m01Events,
  m07Buddy,
  m08Forum,
  m09Wallet,
  utilitiesApiModule,
  transitApiModule,
};
