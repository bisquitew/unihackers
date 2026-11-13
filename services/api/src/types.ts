import type { Hono } from 'hono';

export interface ApiModule {
  id: string;
  title?: string;
  routes: Hono;
  assistantTools?: any[];
  jobs?: any[];
  onEvent?: Record<string, Function>;
}
