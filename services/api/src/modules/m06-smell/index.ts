import { smellRoutes } from './routes.ts';
import { smellAssistantTools } from './assistant-tools.ts';
import { smellService, SmellService } from './service.ts';
import type { ApiModule } from '../../types.ts';

export const apiModule: ApiModule = {
  id: 'm06-smell',
  title: 'Smell Map',
  routes: smellRoutes,
  assistantTools: smellAssistantTools,
};

export { smellService, SmellService };
export default apiModule;
