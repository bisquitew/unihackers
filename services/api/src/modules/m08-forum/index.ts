import { forumRoutes } from './routes';
import { forumAssistantTools } from './assistant-tools';
import { forumService, ForumService } from './service';
import type { ApiModule } from '../../types';

export const apiModule: ApiModule = {
  id: 'm08-forum',
  title: 'Community Forum',
  routes: forumRoutes,
  assistantTools: forumAssistantTools,
};

export { forumService, ForumService };
export default apiModule;
