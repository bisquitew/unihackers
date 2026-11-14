import { Hono } from 'hono';
import m01Events from './m01-events/index.ts';
import m07Buddy from './m07-buddy/index.ts';
import m08Forum from './m08-forum/index.ts';
import m09Wallet from './m09-wallet/index.ts';
import m10Assistant from './m10-assistant/index.ts';
import m11Feedback from './m11-feedback/index.ts';
import m02VisitorInfo from './m02-visitor-info/index.ts';
import m06Smell from './m06-smell/index.ts';
import { utilitiesApiModule } from './m04-utilities/index.ts';
import { transitApiModule } from './m05-transit/index.ts';
import { parkieApiModule } from './parkie/index.ts';
import type { ApiModule } from '../types.ts';

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
  m02VisitorInfo,                              // [M02_VISITOR_INFO] - P4
  createStubModule('m03-safety'),
  utilitiesApiModule as unknown as ApiModule,  // [M04_UTILITIES] - P2
  transitApiModule as unknown as ApiModule,    // [M05_TRANSIT] - P2
  m06Smell,                                    // [M06_SMELL] - P4
  m07Buddy,                                    // [M07_BUDDY] - P3
  m08Forum,                                    // [M08_FORUM] - P3
  m09Wallet,                                   // [M09_WALLET] - P3
  m10Assistant,                                // [M10_ASSISTANT] - P4
  m11Feedback,                                 // [M11_FEEDBACK] - P4
  createStubModule('m12-dashboard'),
  parkieApiModule      // [PARKIE] - P2 & P1
];

export const registeredApiModules = registeredModules;

export {
  m01Events,
  m07Buddy,
  m08Forum,
  m09Wallet,
  utilitiesApiModule,
  transitApiModule,
  parkieApiModule,
};
