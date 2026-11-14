import { Hono } from 'hono';
import { visitorInfoService } from './service.ts';
import { parseCategory, parseLang } from './validation.ts';

export const visitorInfoRoutes = new Hono();

// List, optionally filtered: ?category=transport&lang=en
visitorInfoRoutes.get('/', (c) => {
  const lang = parseLang(c.req.query('lang'));
  if (lang.ok === false) return c.json({ error: lang.error }, 400);
  const category = parseCategory(c.req.query('category'));
  if (category.ok === false) return c.json({ error: category.error }, 400);
  const entries = visitorInfoService.list(lang.value, category.value);
  return c.json({ lang: lang.value, category: category.value ?? null, count: entries.length, entries });
});

// Declared before "/:id" so "categories" is not read as an id.
visitorInfoRoutes.get('/categories', (c) => {
  return c.json({ categories: visitorInfoService.categories() });
});

visitorInfoRoutes.get('/:id', (c) => {
  const lang = parseLang(c.req.query('lang'));
  if (lang.ok === false) return c.json({ error: lang.error }, 400);
  const entry = visitorInfoService.get(c.req.param('id'), lang.value);
  if (!entry) return c.json({ error: 'Entry not found' }, 404);
  return c.json({ entry });
});
