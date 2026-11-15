import type { ApiModule } from '@hub/contracts';
import { utilitiesRouter } from './routes.ts';
import { utilitiesAssistantTools } from './assistant-tools.ts';
import { utilitiesService } from './service.ts';
import { db } from '../../core/db.ts';

// Load the outages saved in Tiger Cloud once the database is connected (loadOutagesFromDb existed but was never
// called, so the API always showed the seed list and forgot published outages on restart). Without a database the
// seed list stays.
void db.query('SELECT 1').then(() => utilitiesService.loadOutagesFromDb()).catch(() => {});

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
