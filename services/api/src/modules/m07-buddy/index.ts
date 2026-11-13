import { buddyRoutes } from './routes';
import { buddyAssistantTools } from './assistant-tools';
import { buddyService, BuddyService } from './service';
import type { ApiModule } from '../../types';

export const apiModule: ApiModule = {
  id: 'm07-buddy',
  title: 'Event Buddy Finder',
  routes: buddyRoutes,
  assistantTools: buddyAssistantTools,
};

export { buddyService, BuddyService };
export default apiModule;
