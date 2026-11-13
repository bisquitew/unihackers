import type { ApiModule } from '@hub/contracts';
import { utilitiesRouter } from './routes.ts';
import { utilitiesAssistantTools } from './assistant-tools.ts';

export const utilitiesApiModule: ApiModule = {
  id: 'm04-utilities',
  routes: utilitiesRouter,
  assistantTools: utilitiesAssistantTools,
  onEvent: {
    'place.saved': async (payload) => {
      console.log(`[UTILITIES MODULE] Resident saved new place: ${payload.address}. Checking for active outages...`);
    }
  }
};
