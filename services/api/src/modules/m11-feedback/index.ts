import { feedbackRoutes } from './routes.ts';
import { feedbackAssistantTools } from './assistant-tools.ts';
import { feedbackService, FeedbackService } from './service.ts';
import type { ApiModule } from '../../types.ts';

export const apiModule: ApiModule = {
  id: 'm11-feedback',
  title: 'Living Labs Feedback',
  routes: feedbackRoutes,
  assistantTools: feedbackAssistantTools,
};

export { feedbackService, FeedbackService };
export default apiModule;
