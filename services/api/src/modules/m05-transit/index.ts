import type { ApiModule } from '@hub/contracts';
import { transitRouter } from './routes.ts';
import { transitAssistantTools } from './assistant-tools.ts';

export const transitApiModule: ApiModule = {
  id: 'm05-transit',
  routes: transitRouter,
  assistantTools: transitAssistantTools,
  onEvent: {
    'place.saved': async (payload) => {
      console.log(`[TRANSIT MODULE] Checking nearby transit stops for newly saved place: ${payload.address}`);
    }
  }
};
