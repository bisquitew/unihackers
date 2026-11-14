// Short, cautious per-area summary of safety reports, written by Gemini in the user's language.
// Only counts go to the model (never the notes), so it cannot repeat anything a resident typed about someone.
import { GoogleGenAI } from '@google/genai';
import { TYPE_LABELS, areaName, safetyService, type ReadOptions } from './service.ts';
import { SAFETY_TYPES, type AreaSummary, type SafetyAreaStats, type SummaryLang } from './types.ts';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const CACHE_MS = 10 * 60_000;

/** Gemini is missing or failing; the route answers 503, like the assistant. */
export class SummaryUnavailableError extends Error {}

const SYSTEM_INSTRUCTION = `You summarise community safety reports for one neighbourhood of Timișoara, Romania, for residents and visitors.
Rules:
- Use only the numbers you are given. Do not add facts, places, events or statistics.
- These are unverified reports from residents about places (lighting, noise, empty buildings, how safe a place feels). They are not crime statistics; say so briefly.
- Describe places, times of day and conditions. Never mention, blame or speculate about people or groups (no nationalities, ethnicities, ages, social groups, professions).
- Be calm and cautious; do not call an area dangerous. If useful, end with one general precaution (well-lit streets, walking with someone at night).
- 2 or 3 short sentences, plain text, no lists, no markdown.`;

let client: GoogleGenAI | null = null;
let clientKey = '';

function getClient(key: string): GoogleGenAI {
  if (!client || key !== clientKey) {
    client = new GoogleGenAI({ apiKey: key });
    clientKey = key;
  }
  return client;
}

function safeMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const key = process.env.GEMINI_API_KEY?.trim();
  return (key ? raw.split(key).join('[redacted]') : raw).slice(0, 300);
}

/** No-key fallback: plain sentences with the counts per type. */
export function fallbackText(stats: SafetyAreaStats | null, name: string, lang: SummaryLang, hours: number): string {
  const days = Math.round(hours / 24);
  const period = lang === 'ro' ? (days >= 1 ? `ultimele ${days} zile` : `ultimele ${hours} ore`) : days >= 1 ? `the last ${days} days` : `the last ${hours} hours`;
  if (!stats) {
    return lang === 'ro' ? `Nicio sesizare pentru ${name} în ${period}.` : `No reports for ${name} in ${period}.`;
  }
  const parts = SAFETY_TYPES.filter((t) => stats.byType[t] > 0).map((t) => `${TYPE_LABELS[t][lang]}: ${stats.byType[t]}`);
  const night = Math.round(stats.nightShare * 100);
  return lang === 'ro'
    ? `${name}: ${stats.count} sesizări în ${period} (${parts.join(', ')}). ${night}% au fost făcute între 20:00 și 06:00. Sunt sesizări ale locuitorilor, nu statistici oficiale.`
    : `${name}: ${stats.count} reports in ${period} (${parts.join(', ')}). ${night}% were made between 20:00 and 06:00. These are residents' reports, not official statistics.`;
}

const cache = new Map<string, { summary: AreaSummary; expires: number }>();

export async function summarizeArea(areaId: string, lang: SummaryLang, opts: ReadOptions): Promise<AreaSummary> {
  const name = areaName(areaId);
  const { stats, demoCount } = await safetyService.areaStats(areaId, opts);
  const key = process.env.GEMINI_API_KEY?.trim();
  const now = new Date();

  if (!key) {
    return { areaId, areaName: name, lang, text: fallbackText(stats, name, lang, opts.hours), source: 'fallback', cached: false, generatedAt: now.toISOString(), stats };
  }

  // Same area, language, window and counts within 10 minutes: reuse the text.
  const cacheKey = [areaId, lang, opts.hours, opts.includeDemo, stats ? JSON.stringify(stats.byType) : 'none'].join('|');
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return { ...hit.summary, cached: true };

  if (!stats) {
    const summary: AreaSummary = { areaId, areaName: name, lang, text: fallbackText(null, name, lang, opts.hours), source: 'fallback', cached: false, generatedAt: now.toISOString(), stats };
    return summary;
  }

  const days = Math.round(opts.hours / 24);
  const input = {
    area: name,
    period: opts.hours % 24 === 0 ? `the last ${days} day${days === 1 ? '' : 's'}` : `the last ${opts.hours} hours`,
    totalReports: stats.count,
    reportsByType: Object.fromEntries(SAFETY_TYPES.map((t) => [TYPE_LABELS[t].en, stats.byType[t]])),
    shareBetween20and06: stats.nightShare,
    includesSimulatedDemoReports: demoCount > 0,
  };
  const language = lang === 'ro' ? 'Romanian' : 'English';

  let text: string;
  try {
    const response = await getClient(key).models.generateContent({
      model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
      contents: [{ role: 'user', parts: [{ text: `Write the summary in ${language}. Data:\n${JSON.stringify(input)}` }] }],
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.3 },
    });
    text = (response.text ?? '').trim();
  } catch (err) {
    const status = (err as { status?: number }).status;
    console.error(`[m03-safety] Gemini summary failed${status ? ` (HTTP ${status})` : ''}: ${safeMessage(err)}`);
    if (status === 429) throw new SummaryUnavailableError('The summary service is getting too many requests right now. Please wait a few seconds and try again.');
    throw new SummaryUnavailableError('The AI summary is unavailable right now. Please try again in a moment.');
  }
  if (!text) throw new SummaryUnavailableError('The AI summary came back empty. Please try again in a moment.');

  const summary: AreaSummary = { areaId, areaName: name, lang, text, source: 'gemini', cached: false, generatedAt: now.toISOString(), stats };
  cache.set(cacheKey, { summary, expires: Date.now() + CACHE_MS });
  return summary;
}
