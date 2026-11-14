import { dashboardRoutes } from './routes.ts';
import type { ApiModule } from '../../types.ts';

export const m12Dashboard: ApiModule = {
  id: 'm12-dashboard',
  title: 'Panou Municipal — Tiger Data & Analytics',
  routes: dashboardRoutes
};

export default m12Dashboard;
export { dashboardService } from './service.ts';
