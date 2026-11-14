import { safetyRoutes } from './routes.ts';
import { safetyAssistantTools } from './assistant-tools.ts';
import { safetyService, SafetyService } from './service.ts';
import type { ApiModule } from '../../types.ts';

export const apiModule: ApiModule = {
  id: 'm03-safety',
  title: 'Urban Safety',
  routes: safetyRoutes,
  assistantTools: safetyAssistantTools,
};

export { safetyService, SafetyService };
export default apiModule;
