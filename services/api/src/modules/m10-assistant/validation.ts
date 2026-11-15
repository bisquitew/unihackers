import type { AssistantLanguage, ChatInput, ChatTurn } from './types.ts';

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export const MAX_MESSAGE = 2000;
export const MAX_HISTORY_TURNS = 20;
const MAX_HISTORY_TEXT = 4000;
const LANGUAGES: AssistantLanguage[] = ['ro', 'en'];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** POST /v1/m/assistant/chat — { message, history?, language? } */
export function parseChatInput(body: unknown): Parsed<ChatInput> {
  if (!isObject(body)) return { ok: false, error: 'Body must be a JSON object' };
  const { message, history, language, location } = body;

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { ok: false, error: 'message is required' };
  }
  if (message.length > MAX_MESSAGE) {
    return { ok: false, error: `message must be at most ${MAX_MESSAGE} characters` };
  }

  let turns: ChatTurn[] = [];
  if (history !== undefined && history !== null) {
    if (!Array.isArray(history)) return { ok: false, error: 'history must be an array' };
    if (history.length > MAX_HISTORY_TURNS) {
      return { ok: false, error: `history must have at most ${MAX_HISTORY_TURNS} turns` };
    }
    for (const [i, turn] of history.entries()) {
      if (!isObject(turn) || (turn.role !== 'user' && turn.role !== 'model') || typeof turn.text !== 'string') {
        return { ok: false, error: `history[${i}] must be { role: "user" | "model", text: string }` };
      }
      if (turn.text.length > MAX_HISTORY_TEXT) {
        return { ok: false, error: `history[${i}].text must be at most ${MAX_HISTORY_TEXT} characters` };
      }
    }
    turns = (history as ChatTurn[]).filter((t) => t.text.trim().length > 0);
  }

  if (language !== undefined && language !== null && !LANGUAGES.includes(language as AssistantLanguage)) {
    return { ok: false, error: 'language must be "ro" or "en"' };
  }

  // optional: where the person is, if they chose to share it. It is coarsened here (3 decimals is about 100 m) and not kept.
  let approx: ChatInput['location'] = null;
  if (location !== undefined && location !== null) {
    const lat = isObject(location) ? Number((location as Record<string, unknown>).latitude) : NaN;
    const lng = isObject(location) ? Number((location as Record<string, unknown>).longitude) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return { ok: false, error: 'location must be { latitude, longitude } with valid coordinates' };
    }
    approx = { latitude: Math.round(lat * 1000) / 1000, longitude: Math.round(lng * 1000) / 1000 };
  }

  return {
    ok: true,
    value: { message: message.trim(), history: turns, language: (language as AssistantLanguage | undefined) ?? null, location: approx },
  };
}
