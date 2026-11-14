import { Hono } from 'hono';
import { enforceSecurityPolicy, resolveAuthUser } from '../../core/auth.ts';
import { clientKey, rateLimit } from '../../core/rate-limit.ts';
import { utilitiesService } from '../m04-utilities/service.ts';
import { NOTICE_IMAGE_TYPES, NOTICE_MAX_BYTES, NoticeUnavailableError, parseConfirmedDraft, parseNoticePhoto } from './notice.ts';
import { assistantService, AssistantUnavailableError } from './service.ts';
import { loadTour } from './tour.ts';
import { parseChatInput } from './validation.ts';
import { STT_MAX_BYTES, TTS_MAX_INPUT, VoiceUnavailableError, speechToText, textToSpeech, voiceStatus, type VoiceLang } from './voice.ts';

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

// --- Voice (ElevenLabs). The key never leaves the server; without it these routes answer 503 and the app stays text-only.

const parseVoiceLang = (raw: unknown): VoiceLang | null | undefined => {
  if (raw === undefined || raw === null || raw === '') return null;
  return raw === 'ro' || raw === 'en' ? raw : undefined;
};

// Whether voice is available (the app hides the mic and speaker buttons when it is not).
assistantRoutes.get('/voice', (c) => c.json(voiceStatus()));

// 40 spoken answers per client per 10 minutes (cached answers are cheap, new ones use the monthly quota).
const ttsLimit = rateLimit({ windowMs: 10 * 60_000, max: 40, message: 'Too many spoken answers in a short time. Please wait a few minutes.' });

assistantRoutes.post('/tts', ttsLimit, async (c) => {
  let body: { text?: unknown; lang?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  if (typeof body?.text !== 'string' || !body.text.trim()) return c.json({ error: 'text is required' }, 400);
  if (body.text.length > TTS_MAX_INPUT) return c.json({ error: `text must be at most ${TTS_MAX_INPUT} characters` }, 400);
  const lang = parseVoiceLang(body.lang);
  if (lang === undefined) return c.json({ error: 'lang must be ro or en' }, 400);
  try {
    const result = await textToSpeech(body.text, lang);
    return c.body(result.audio as unknown as ArrayBuffer, 200, {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=86400',
      'X-Voice-Cached': String(result.cached),
      'X-Voice-Truncated': String(result.truncated),
      'X-Voice-Characters': String(result.characters),
      'Access-Control-Expose-Headers': 'X-Voice-Cached, X-Voice-Truncated, X-Voice-Characters',
    });
  } catch (err) {
    if (err instanceof VoiceUnavailableError) return c.json({ error: err.message }, 503);
    if (err instanceof RangeError) return c.json({ error: err.message }, 400);
    throw err;
  }
});

// 20 transcriptions per client per 10 minutes.
const sttLimit = rateLimit({ windowMs: 10 * 60_000, max: 20, message: 'Too many voice messages in a short time. Please wait a few minutes.' });

// Audio as multipart form field "file" (optional field "lang"), or as a raw audio/* body (?lang=ro).
assistantRoutes.post('/stt', sttLimit, async (c) => {
  const contentType = c.req.header('content-type') ?? '';
  let audio: Blob | null = null;
  let filename = 'speech.webm';
  let langRaw: unknown = c.req.query('lang');
  try {
    if (contentType.startsWith('multipart/form-data')) {
      const form = await c.req.parseBody();
      const file = form.file;
      if (file instanceof Blob) {
        audio = file;
        if (file instanceof File && file.name) filename = file.name;
      }
      if (form.lang !== undefined) langRaw = form.lang;
    } else if (contentType.startsWith('audio/') || contentType.startsWith('video/webm') || contentType === 'application/octet-stream') {
      const buf = await c.req.arrayBuffer();
      audio = new Blob([buf], { type: contentType });
      filename = `speech.${contentType.includes('mpeg') ? 'mp3' : contentType.includes('wav') ? 'wav' : contentType.includes('ogg') ? 'ogg' : 'webm'}`;
    }
  } catch {
    return c.json({ error: 'Could not read the uploaded audio' }, 400);
  }
  if (!audio || audio.size === 0) return c.json({ error: 'Send the recording as multipart field "file" or as an audio/* body' }, 400);
  if (audio.size > STT_MAX_BYTES) return c.json({ error: `Recording too large (max ${Math.round(STT_MAX_BYTES / 1024 / 1024)} MB)` }, 400);
  const lang = parseVoiceLang(langRaw);
  if (lang === undefined) return c.json({ error: 'lang must be ro or en' }, 400);
  try {
    const result = await speechToText(audio, filename, lang);
    if (!result.text) return c.json({ error: 'No speech was recognised. Please try again a little closer to the microphone.' }, 422);
    return c.json(result);
  } catch (err) {
    if (err instanceof VoiceUnavailableError) return c.json({ error: err.message }, 503);
    throw err;
  }
});

// Narrated walking tour, read from docs/voice/tour.md.
assistantRoutes.get('/tour', (c) => c.json(loadTour()));

// --- Photo of a utility notice -> draft outage -> (admin with MFA) publish through m04's createOutage.

// 10 photos per client per 10 minutes (each one is a Gemini call).
const noticeLimit = rateLimit({ windowMs: 10 * 60_000, max: 10, message: 'Too many photos in a short time. Please wait a few minutes.' });

// Anyone may ask for a draft; nothing is saved. Image as multipart field image or a raw image/* body.
assistantRoutes.post('/notice/parse', noticeLimit, async (c) => {
  const contentType = c.req.header('content-type') ?? '';
  let image: Uint8Array | null = null;
  let mime = '';
  try {
    if (contentType.startsWith('multipart/form-data')) {
      const form = await c.req.parseBody();
      const file = form.image ?? form.file;
      if (file instanceof Blob) {
        image = new Uint8Array(await file.arrayBuffer());
        mime = file.type;
      }
    } else if (contentType.startsWith('image/')) {
      image = new Uint8Array(await c.req.arrayBuffer());
      mime = contentType.split(';')[0].trim();
    }
  } catch {
    return c.json({ error: 'Could not read the uploaded photo' }, 400);
  }
  if (!image || image.byteLength === 0) return c.json({ error: 'Send the photo as multipart field "image" or as an image/* body' }, 400);
  if (!NOTICE_IMAGE_TYPES.includes(mime)) return c.json({ error: `Photo must be one of: ${NOTICE_IMAGE_TYPES.join(', ')}` }, 400);
  if (image.byteLength > NOTICE_MAX_BYTES) return c.json({ error: `Photo too large (max ${NOTICE_MAX_BYTES / 1024 / 1024} MB)` }, 400);
  try {
    return c.json(await parseNoticePhoto(image, mime));
  } catch (err) {
    if (err instanceof NoticeUnavailableError) return c.json({ error: err.message }, 503);
    throw err;
  }
});

// Publishing a city-wide alert follows P2's rule for creating outages: admin role with MFA.
assistantRoutes.post('/notice/confirm', async (c) => {
  const user = await resolveAuthUser(c.req.header('Authorization'));
  const auth = enforceSecurityPolicy(user, 'utilities.outages_create_from_photo', { requiredRoles: ['admin'], requireMfa: true, ip: clientKey(c) });
  if (auth.authorized === false) return c.json(auth.body, auth.status as 401 | 403);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const parsed = parseConfirmedDraft(body);
  if (parsed.ok === false) return c.json({ error: parsed.error }, 400);
  const outage = await utilitiesService.createOutage(parsed.value);
  return c.json({ outage }, 201);
});
