import { eventsRoutes } from './routes.ts';
import { eventsAssistantTools } from './assistant-tools.ts';
import { eventsService, EventsService } from './service.ts';
import type { ApiModule } from '../../types.ts';

export const apiModule: ApiModule = {
  id: 'm01-events',
  title: 'Micro-Events & Culture',
  routes: eventsRoutes,
  assistantTools: eventsAssistantTools,
};

export { eventsService, EventsService };
export default apiModule;
