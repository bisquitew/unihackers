import { Hono } from 'hono';
import { assistantService, AssistantUnavailableError } from './service.ts';
import { parseChatInput } from './validation.ts';

export const assistantRoutes = new Hono();

// Chat with the city assistant (Gemini + function calling over every module's tools)
assistantRoutes.post('/chat', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const parsed = parseChatInput(body);
  if (parsed.ok === false) return c.json({ error: parsed.error }, 400); // `=== false` narrows even with strict: false

  try {
    const result = await assistantService.chat(parsed.value);
    return c.json(result);
  } catch (err) {
    if (err instanceof AssistantUnavailableError) return c.json({ error: err.message }, 503);
    console.error('[m10-assistant] Unexpected chat error:', err instanceof Error ? err.name : 'unknown');
    return c.json({ error: 'The assistant failed unexpectedly. Please try again.' }, 500);
  }
});

// Tools the assistant can call, grouped by module (debugging and demo)
assistantRoutes.get('/tools', async (c) => {
  const modules = await assistantService.listTools();
  return c.json({ count: modules.reduce((n, m) => n + m.tools.length, 0), modules });
});
