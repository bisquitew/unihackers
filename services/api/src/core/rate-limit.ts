// Small in-memory rate limiter for public write routes (one fixed window per client and route).
// Good enough for one API process; a shared store (Redis, Postgres) would be needed behind several instances.
import type { Context, MiddlewareHandler } from 'hono';

export interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests allowed per client in one window. */
  max: number;
  /** Shown to the client when the limit is hit. */
  message?: string;
}

/**
 * The client's address. On the modular API (@hono/node-server) it comes from the socket; behind server.ts,
 * which forwards to the Hono routers, server.ts passes its socket address in x-forwarded-for.
 */
export function clientKey(c: Context): string {
  const env = c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined;
  const socket = env?.incoming?.socket?.remoteAddress;
  if (socket) return socket;
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();
  let lastSweep = Date.now();

  return async (c, next) => {
    const now = Date.now();
    // Forget finished windows now and then, so the map does not grow forever.
    if (now - lastSweep > options.windowMs) {
      for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
      lastSweep = now;
    }

    const key = clientKey(c);
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + options.windowMs };
      hits.set(key, entry);
    }

    if (entry.count >= options.max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      c.header('Retry-After', String(retryAfterSeconds));
      return c.json({ error: options.message ?? 'Too many requests. Please wait a moment and try again.', retryAfterSeconds }, 429);
    }
    await next();
    // Only accepted requests count, so someone fixing a typo is not locked out.
    if (c.res.status < 400) entry.count++;
  };
}
