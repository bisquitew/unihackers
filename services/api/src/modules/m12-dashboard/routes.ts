import { Hono } from 'hono';
import { dashboardService } from './service.ts';

export const dashboardRoutes = new Hono();

dashboardRoutes.get('/', async (c) => {
  const overview = await dashboardService.getCityOverview();
  return c.json(overview);
});

dashboardRoutes.get('/overview', async (c) => {
  const overview = await dashboardService.getCityOverview();
  return c.json(overview);
});

dashboardRoutes.get('/heatmap', (c) => {
  const heatmap = dashboardService.getHeatmapData();
  return c.json(heatmap);
});
