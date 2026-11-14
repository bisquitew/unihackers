import { forumRoutes } from './routes.ts';
import { forumAssistantTools } from './assistant-tools.ts';
import { forumService, ForumService } from './service.ts';
import type { ApiModule } from '../../types.ts';

export const apiModule: ApiModule = {
  id: 'm08-forum',
  title: 'Community Forum',
  routes: forumRoutes,
  assistantTools: forumAssistantTools,
};

export { forumService, ForumService };
export default apiModule;
