// ElevenLabs text-to-speech and speech-to-text for the city assistant.
// The API key stays on the server: it is read from ELEVENLABS_API_KEY, sent only in the xi-api-key header to
// api.elevenlabs.io, and never returned, logged or sent to the app.
import { createHash } from 'node:crypto';

const API = 'https://api.elevenlabs.io/v1';
/** Multilingual, stable on long text, speaks Romanian well (https://elevenlabs.io/docs/models). */
export const DEFAULT_TTS_MODEL = 'eleven_multilingual_v2';
/** "Sarah": a premade voice every ElevenLabs account has; calm and clear in Romanian and English. */
export const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
export const DEFAULT_STT_MODEL = 'scribe_v3';
/** Characters actually spoken per request (protects the monthly quota). */
export const TTS_MAX_CHARS = 800;
/** Bigger inputs are refused instead of trimmed. */
export const TTS_MAX_INPUT = 4000;
/** About 2–3 minutes of compressed speech. */
export const STT_MAX_BYTES = 10 * 1024 * 1024;
const OUTPUT_FORMAT = 'mp3_44100_64';
const TIMEOUT_MS = 30_000;

/** Voice is not configured or ElevenLabs refused; routes answer 503 and the app falls back to text. */
export class VoiceUnavailableError extends Error {}

export type VoiceLang = 'ro' | 'en';

const config = () => ({
  key: process.env.ELEVENLABS_API_KEY?.trim() || '',
  ttsModel: process.env.ELEVENLABS_MODEL?.trim() || DEFAULT_TTS_MODEL,
  voiceId: process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_VOICE_ID,
  sttModel: process.env.ELEVENLABS_STT_MODEL?.trim() || DEFAULT_STT_MODEL,
});

export function voiceStatus() {
  const c = config();
  return { configured: Boolean(c.key), ttsModel: c.ttsModel, voiceId: c.voiceId, sttModel: c.sttModel, maxChars: TTS_MAX_CHARS };
}

function requireKey(): string {
  const key = config().key;
  if (!key) throw new VoiceUnavailableError('Voice is not configured on this server. The assistant still works as text.');
  return key;
}

/** Never let the key into a log line or an error message. */
function redact(text: string): string {
  const key = config().key;
  return key ? text.split(key).join('[redacted]') : text;
}

/**
 * Turns an ElevenLabs error into a clear message. The status codes and detail.status values come from
 * ElevenLabs error bodies, e.g. {"detail":{"status":"quota_exceeded","message":"..."}}.
 */
async function toVoiceError(res: Response, what: string): Promise<VoiceUnavailableError> {
  let detail = '';
  try {
    const body = (await res.json()) as { detail?: { status?: string; message?: string } | string };
    detail = typeof body.detail === 'string' ? body.detail : body.detail?.status ?? '';
  } catch {
    // not JSON
  }
  console.error(`[m10-voice] ElevenLabs ${what} failed (HTTP ${res.status}${detail ? `, ${redact(detail).slice(0, 80)}` : ''})`);
  if (res.status === 401 || detail === 'invalid_api_key') return new VoiceUnavailableError('The voice service rejected this server\'s credentials. The assistant still works as text.');
  if (detail === 'quota_exceeded' || res.status === 402) return new VoiceUnavailableError('The voice quota for this month is used up. The assistant still works as text.');
  if (res.status === 429) return new VoiceUnavailableError('The voice service is busy right now. Please wait a few seconds and try again.');
  return new VoiceUnavailableError('The voice service is unavailable right now. The assistant still works as text.');
}

async function call(url: string, init: RequestInit, what: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    console.error(`[m10-voice] ElevenLabs ${what} unreachable: ${redact(err instanceof Error ? err.message : String(err)).slice(0, 120)}`);
    throw new VoiceUnavailableError('The voice service is unreachable right now. The assistant still works as text.');
  }
  if (!res.ok) throw await toVoiceError(res, what);
  return res;
}

/**
 * Text that sounds right when read aloud: no markdown symbols, no URLs, short.
 * Cut at the end of a sentence when it is too long.
 */
export function speakable(raw: string): { text: string; truncated: boolean } {
  let t = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(\S(?:.*?\S)?)\1/g, '$2')
    .replace(/[*_~#|]/g, ' ')
    // A line break becomes a pause: keep the line's own punctuation, otherwise add a full stop.
    .replace(/([.!?:;,])?[ \t]*\n+\s*/g, (_m, p: string | undefined) => (p ? `${p} ` : '. '))
    .replace(/\.(\s*\.)+/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
  let truncated = false;
  if (t.length > TTS_MAX_CHARS) {
    truncated = true;
    const cut = t.slice(0, TTS_MAX_CHARS);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    t = end > TTS_MAX_CHARS * 0.5 ? cut.slice(0, end + 1) : cut.trimEnd() + '…';
  }
  return { text: t, truncated };
}

// --- Text to speech, cached in memory by hash(text + voice + model + language) ---

const CACHE_MAX_ENTRIES = 200;
const CACHE_MAX_BYTES = 30 * 1024 * 1024;
const ttsCache = new Map<string, Uint8Array>();
let cacheBytes = 0;
const inflight = new Map<string, Promise<Uint8Array>>();

function remember(key: string, audio: Uint8Array) {
  ttsCache.set(key, audio);
  cacheBytes += audio.byteLength;
  // Map keeps insertion order: drop the oldest entries first.
  for (const [k, v] of ttsCache) {
    if (ttsCache.size <= CACHE_MAX_ENTRIES && cacheBytes <= CACHE_MAX_BYTES) break;
    ttsCache.delete(k);
    cacheBytes -= v.byteLength;
  }
}

export interface TtsResult {
  audio: Uint8Array;
  cached: boolean;
  truncated: boolean;
  characters: number;
}

export async function textToSpeech(rawText: string, lang: VoiceLang | null): Promise<TtsResult> {
  const key = requireKey();
  const { ttsModel, voiceId } = config();
  const { text, truncated } = speakable(rawText);
  if (!text) throw new RangeError('Nothing to read aloud after removing formatting.');

  const cacheKey = createHash('sha256').update([ttsModel, voiceId, lang ?? '', text].join('\u0000')).digest('hex');
  const hit = ttsCache.get(cacheKey);
  if (hit) {
    // Refresh its place so popular answers stay cached.
    ttsCache.delete(cacheKey);
    ttsCache.set(cacheKey, hit);
    return { audio: hit, cached: true, truncated, characters: text.length };
  }

  let pending = inflight.get(cacheKey);
  if (!pending) {
    const body: Record<string, unknown> = { text, model_id: ttsModel };
    // multilingual_v2 detects the language itself and rejects language_code; newer models accept it.
    if (lang && ttsModel !== 'eleven_multilingual_v2') body.language_code = lang;
    pending = call(`${API}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${OUTPUT_FORMAT}`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    }, 'text-to-speech')
      .then(async (res) => new Uint8Array(await res.arrayBuffer()))
      .then((audio) => {
        remember(cacheKey, audio);
        return audio;
      })
      .finally(() => inflight.delete(cacheKey));
    inflight.set(cacheKey, pending);
  }
  const audio = await pending;
  return { audio, cached: false, truncated, characters: text.length };
}

// --- Speech to text ---

const LANG_MAP: Record<string, VoiceLang> = { ro: 'ro', ron: 'ro', rum: 'ro', en: 'en', eng: 'en' };

export interface SttResult {
  text: string;
  /** 'ro' or 'en' when detected as one of those, otherwise the ElevenLabs code (e.g. 'fra'). */
  lang: string;
  languageProbability: number | null;
}

export async function speechToText(audio: Blob, filename: string, langHint: VoiceLang | null): Promise<SttResult> {
  const key = requireKey();
  const form = new FormData();
  form.append('model_id', config().sttModel);
  form.append('file', audio, filename);
  form.append('tag_audio_events', 'false');
  if (langHint) form.append('language_code', langHint);
  const res = await call(`${API}/speech-to-text`, { method: 'POST', headers: { 'xi-api-key': key }, body: form }, 'speech-to-text');
  const data = (await res.json()) as { text?: string; language_code?: string; language_probability?: number };
  const code = (data.language_code ?? '').toLowerCase();
  return { text: (data.text ?? '').trim(), lang: LANG_MAP[code] ?? code, languageProbability: typeof data.language_probability === 'number' ? data.language_probability : null };
}
