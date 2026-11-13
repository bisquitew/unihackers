import { Hono } from 'hono';
import type { ApiModule } from '@hub/contracts';
import { parkieAssistantTools } from './assistant-tools.ts';

const parkieRouter = new Hono();
parkieRouter.get('/', (c) => c.json({ module: 'parkie', status: 'ready' }));

export const parkieApiModule: ApiModule = {
  id: 'parkie',
  routes: parkieRouter,
  assistantTools: parkieAssistantTools,
  onEvent: {
    'transit.detour_updated': async (payload) => {
      console.log(`[PARKIE MODULE] Transit detour received. Drivers may need parking near detour route: ${payload.alert?.line_number}`);
    }
  }
};
