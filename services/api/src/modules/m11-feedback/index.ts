import { feedbackRoutes } from './routes';
import { feedbackAssistantTools } from './assistant-tools';
import { feedbackService, FeedbackService } from './service';
import type { ApiModule } from '../../types';

export const apiModule: ApiModule = {
  id: 'm11-feedback',
  title: 'Living Labs Feedback',
  routes: feedbackRoutes,
  assistantTools: feedbackAssistantTools,
};

export { feedbackService, FeedbackService };
export default apiModule;
