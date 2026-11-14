import { visitorInfoRoutes } from './routes.ts';
import { visitorInfoAssistantTools } from './assistant-tools.ts';
import { visitorInfoService, VisitorInfoService } from './service.ts';
import type { ApiModule } from '../../types.ts';

export const apiModule: ApiModule = {
  id: 'm02-visitor-info',
  title: 'Visitor Info',
  routes: visitorInfoRoutes,
  assistantTools: visitorInfoAssistantTools,
};

export { visitorInfoService, VisitorInfoService };
export default apiModule;
