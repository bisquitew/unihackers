import { buddyRoutes } from './routes.ts';
import { buddyAssistantTools } from './assistant-tools.ts';
import { buddyService, BuddyService } from './service.ts';
import type { ApiModule } from '../../types.ts';

export const apiModule: ApiModule = {
  id: 'm07-buddy',
  title: 'Event Buddy Finder',
  routes: buddyRoutes,
  assistantTools: buddyAssistantTools,
};

export { buddyService, BuddyService };
export default apiModule;
