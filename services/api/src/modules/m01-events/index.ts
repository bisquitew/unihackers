import { eventsRoutes } from './routes';
import { eventsAssistantTools } from './assistant-tools';
import { eventsService, EventsService } from './service';
import type { ApiModule } from '../../types';

export const apiModule: ApiModule = {
  id: 'm01-events',
  title: 'Micro-Events & Culture',
  routes: eventsRoutes,
  assistantTools: eventsAssistantTools,
};

export { eventsService, EventsService };
export default apiModule;
