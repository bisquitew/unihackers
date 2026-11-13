import type { ApiModule } from '@hub/contracts';
import { Hono } from 'hono';
import { utilitiesApiModule } from './m04-utilities/index.ts';
import { transitApiModule } from './m05-transit/index.ts';

// Helper to create empty stub module so all routes exist without merge conflicts
function createStubModule(id: string): ApiModule {
  const router = new Hono();
  router.get('/', (c) => c.json({ module: id, status: 'stub_ready' }));
  return {
    id,
    routes: router
  };
}

export const registeredModules: ApiModule[] = [
  createStubModule('m01-events'),
  createStubModule('m02-visitor-info'),
  createStubModule('m03-safety'),
  utilitiesApiModule,  // [M04_UTILITIES] - P2
  transitApiModule,    // [M05_TRANSIT] - P2
  createStubModule('m06-smell'),
  createStubModule('m07-buddy'),
  createStubModule('m08-forum'),
  createStubModule('m09-wallet'),
  createStubModule('m10-assistant'),
  createStubModule('m11-feedback'),
  createStubModule('m12-dashboard'),
  createStubModule('parkie')
];
