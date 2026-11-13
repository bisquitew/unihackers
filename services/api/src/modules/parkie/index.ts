import type { ApiModule } from '@hub/contracts';
import { parkieAssistantTools } from './assistant-tools.ts';

export const parkieApiModule: ApiModule = {
  id: 'parkie',
  assistantTools: parkieAssistantTools,
  onEvent: {
    'transit.detour_updated': async (payload) => {
      console.log(`[PARKIE MODULE] Transit detour received. Drivers may need parking near detour route: ${payload.alert?.line_number}`);
    }
  }
};
