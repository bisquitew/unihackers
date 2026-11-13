import { assistantRoutes } from './routes.ts';
import { assistantService, AssistantService } from './service.ts';
import type { ApiModule } from '../../types.ts';

// No assistantTools of its own: the assistant collects the other modules' tools (tools.ts).
export const apiModule: ApiModule = {
  id: 'm10-assistant',
  title: 'City Assistant',
  routes: assistantRoutes,
};

export { assistantService, AssistantService };
export default apiModule;
