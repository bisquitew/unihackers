import { TIMISOARA_AREAS } from '../../core/areas.ts';
import { db } from '../../core/db.ts';
import { safetyService } from '../m03-safety/service.ts';
import { smellService } from '../m06-smell/service.ts';
import { compassPoint } from '../m06-smell/wind.ts';
import { parkieService } from '../parkie/service.ts';
import { AssistantUnavailableError, callModel, FALLBACK_MODEL, GeminiBusyError, getClient } from './service.ts';
import type { AssistantLanguage } from './types.ts';

/*
 * "Ask the data" for city staff (website dashboard).
 *
 * One Gemini request mixes our own data tools (function calling) with Gemini's built-in code execution
 * (`includeServerSideToolInvocations`): Gemini fetches real numbers from Tiger Cloud and the modules,
 * writes Python, runs it on Google's side and can return a matplotlib chart. We send back the answer,
 * the charts, the Python it ran and where each number came from, so nothing looks more certain than it is.
 */

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const MAX_ROUNDS = 6;
const MAX_CHARTS = 2;
const TZ = 'Europe/Bucharest';
export const ANALYST_MAX_QUESTION = 500;

type Part = any;
type Content = any;

export interface AnalystStep {
  kind: 'tool' | 'code';
  /** tool: the data tool's name; code: "python" */
  name: string;
  /** tool: where the numbers came from ("tiger", "memory", "open-meteo", "unavailable"…) */
  source?: string;
  /** tool: arguments Gemini chose */
  args?: Record<string, unknown>;
  /** code: the Python Gemini wrote */
  code?: string;
  /** code: what the code printed, and whether it ran */
  output?: string;
  outcome?: string;
}

export interface AnalystResult {
  answer: string;
  charts: { mimeType: string; data: string }[];
  steps: AnalystStep[];
  model: string;
  ms: number;
}

// ---------------------------------------------------------------- helpers

const HOUR_FORMAT = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
/** "2026-11-15 04:00" in Timișoara local time. */
const localHour = (d: Date | string) => HOUR_FORMAT.format(new Date(typeof d === 'string' ? Date.parse(d) : d.getTime())).slice(0, 13) + ':00';
const localDay = (d: Date | string) => localHour(d).slice(0, 10);
const round1 = (n: number) => Math.round(n * 10) / 10;
const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const areaName = (id: string) => TIMISOARA_AREAS.find((a) => a.id === id)?.name ?? id;
const AREA_IDS = TIMISOARA_AREAS.map((a) => a.id);
const TIGER_OFF = {
  available: false,
  source: 'unavailable',
  reason: 'Tiger Cloud is not connected on this server, so this history is unavailable. Do not estimate it.',
};

// ---------------------------------------------------------------- data tools

interface DataTool {
  declaration: { name: string; description: string; parameters: Record<string, unknown> };
  run(args: Record<string, unknown>): Promise<Record<string, unknown>>;
}

const granularityParam = { type: 'string', enum: ['hour', 'day'], description: 'Bucket size. Default hour.' };

const TOOLS: DataTool[] = [
  {
    declaration: {
      name: 'get_parking_occupancy',
      description:
        'Parking occupancy history of the city\'s camera-monitored lots, from Tiger Cloud (TimescaleDB continuous aggregate parking_hourly_stats, re-bucketed with time_bucket in Timișoara time). ' +
        'Returns rows [bucket, avg occupied cars, peak occupied cars, avg occupancy %] summed over the chosen lots, plus per-lot averages. Hourly up to 7 days, daily up to 31 days.',
      parameters: {
        type: 'object',
        properties: {
          granularity: granularityParam,
          days: { type: 'integer', description: 'How many days back from the newest data. Default 7.' },
          lotId: { type: 'string', description: 'Only this lot (an id from byLot). Omit for all lots.' },
        },
      },
    },
    async run(args) {
      if (!db.isTigerConnected()) return TIGER_OFF;
      const day = args.granularity === 'day';
      const days = clampInt(args.days, 1, day ? 31 : 7, 7);
      const lotId = typeof args.lotId === 'string' && args.lotId.trim() ? args.lotId.trim() : null;
      const window = `WITH latest AS (SELECT MAX(bucket) AS mx FROM parking_hourly_stats)`;
      const rows = await db.query<{ b: Date; occ: string; peak: string; pct: string }>(
        `${window},
         hourly AS (
           SELECT bucket, SUM(avg_occupied) AS occ, SUM(avg_occupied + avg_available) AS cap
           FROM parking_hourly_stats, latest
           WHERE bucket > latest.mx - make_interval(days => $1) AND ($2::text IS NULL OR lot_id = $2)
           GROUP BY bucket)
         SELECT time_bucket($3::interval, bucket, '${TZ}') AS b,
                ROUND(AVG(occ), 1) AS occ, ROUND(MAX(occ), 1) AS peak, ROUND(AVG(occ / NULLIF(cap, 0)) * 100, 1) AS pct
         FROM hourly GROUP BY 1 ORDER BY 1`,
        [days, lotId, day ? '1 day' : '1 hour'],
      );
      // capacity comes from the same history (occupied + available), so it always matches the counts
      const byLot = await db.query<{ lot_id: string; pct: string; peak: number; cap: string }>(
        `${window}
         SELECT lot_id, ROUND(AVG(avg_occupied / NULLIF(avg_occupied + avg_available, 0)) * 100, 1) AS pct, MAX(peak_occupied) AS peak,
                ROUND(MAX(avg_occupied + avg_available)) AS cap
         FROM parking_hourly_stats, latest WHERE bucket > latest.mx - make_interval(days => $1)
         GROUP BY lot_id ORDER BY pct DESC NULLS LAST`,
        [days],
      );
      const names = new Map(parkieService.getAllLots().map((l) => [l.id, l.name]));
      return {
        available: true,
        source: 'tiger',
        table: 'parking_hourly_stats (continuous aggregate)',
        timezone: 'Timișoara local time',
        columns: [day ? 'day' : 'hour', 'avg_occupied_cars', 'peak_occupied_cars', 'avg_occupancy_pct'],
        rows: rows.map((r) => [day ? localDay(r.b) : localHour(r.b), Number(r.occ), Number(r.peak), Number(r.pct)]),
        byLot: byLot.map((r) => ({ lotId: r.lot_id, name: names.get(r.lot_id) ?? r.lot_id, spots: Number(r.cap), avgOccupancyPct: Number(r.pct), peakOccupied: r.peak })),
      };
    },
  },
  {
    declaration: {
      name: 'get_city_metrics',
      description:
        'Environmental sensor history per Timișoara area, from Tiger Cloud (continuous aggregate city_metrics_hourly_stats): air_quality_pm25 (µg/m³), noise_db (dB) or smell_intensity (0–5). ' +
        'Returns rows [bucket, area, avg, max] in Timișoara time. Hourly up to 7 days, daily up to 14 days. The window ends at the newest reading.',
      parameters: {
        type: 'object',
        properties: {
          metric: { type: 'string', enum: ['air_quality_pm25', 'noise_db', 'smell_intensity'] },
          granularity: granularityParam,
          days: { type: 'integer', description: 'Days back from the newest reading. Default 3.' },
          areaId: { type: 'string', enum: AREA_IDS, description: 'Only this area. Omit for all areas.' },
        },
        required: ['metric'],
      },
    },
    async run(args) {
      if (!db.isTigerConnected()) return TIGER_OFF;
      const metric = ['air_quality_pm25', 'noise_db', 'smell_intensity'].includes(String(args.metric)) ? String(args.metric) : 'air_quality_pm25';
      const day = args.granularity === 'day';
      const days = clampInt(args.days, 1, day ? 14 : 7, 3);
      const areaId = typeof args.areaId === 'string' && AREA_IDS.includes(args.areaId) ? args.areaId : null;
      const rows = await db.query<{ b: Date; area_id: string; avg: string; max: string }>(
        `WITH latest AS (SELECT MAX(bucket) AS mx FROM city_metrics_hourly_stats WHERE metric_type = $1)
         SELECT time_bucket($4::interval, bucket, '${TZ}') AS b, area_id, ROUND(AVG(avg_value), 1) AS avg, ROUND(MAX(max_value), 1) AS max
         FROM city_metrics_hourly_stats, latest
         WHERE metric_type = $1 AND bucket > latest.mx - make_interval(days => $2) AND ($3::text IS NULL OR area_id = $3)
         GROUP BY 1, 2 ORDER BY 1, 2`,
        [metric, days, areaId, day ? '1 day' : '1 hour'],
      );
      return {
        available: true,
        source: 'tiger',
        table: 'city_metrics_hourly_stats (continuous aggregate)',
        metric,
        timezone: 'Timișoara local time',
        columns: [day ? 'day' : 'hour', 'area', 'avg', 'max'],
        rows: rows.map((r) => [day ? localDay(r.b) : localHour(r.b), areaName(r.area_id), Number(r.avg), Number(r.max)]),
      };
    },
  },
  {
    declaration: {
      name: 'get_smell_reports',
      description:
        'Bad-smell reports sent by residents in the app (unverified; some are labelled demo sample data). ' +
        'Returns hourly counts [hour, reports, avg intensity 1–5] in Timișoara time and per-area totals with the most common smell type.',
      parameters: { type: 'object', properties: { hours: { type: 'integer', description: 'Hours back from now, 1–168. Default 24.' } } },
    },
    async run(args) {
      const hours = clampInt(args.hours, 1, 168, 24);
      const { reports, demoCount } = await smellService.window({ hours, includeDemo: true });
      const byHour = new Map<string, { n: number; sum: number }>();
      const byArea = new Map<string, { n: number; sum: number; types: Map<string, number> }>();
      for (const r of reports) {
        const h = byHour.get(localHour(r.createdAt)) ?? { n: 0, sum: 0 };
        h.n++; h.sum += r.intensity;
        byHour.set(localHour(r.createdAt), h);
        const a = byArea.get(r.areaId) ?? { n: 0, sum: 0, types: new Map() };
        a.n++; a.sum += r.intensity; a.types.set(r.type, (a.types.get(r.type) ?? 0) + 1);
        byArea.set(r.areaId, a);
      }
      return {
        available: true,
        source: smellService.status().active,
        total: reports.length,
        demo: demoCount,
        real: reports.length - demoCount,
        timezone: 'Timișoara local time',
        columns: ['hour', 'reports', 'avg_intensity'],
        rows: [...byHour.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([h, v]) => [h, v.n, round1(v.sum / v.n)]),
        byArea: [...byArea.entries()].sort(([, a], [, b]) => b.n - a.n).map(([id, v]) => ({
          area: areaName(id), reports: v.n, avgIntensity: round1(v.sum / v.n),
          mostCommon: [...v.types.entries()].sort(([, a], [, b]) => b - a)[0]?.[0] ?? null,
        })),
      };
    },
  },
  {
    declaration: {
      name: 'get_safety_reports',
      description:
        'Residents\' reports about places that feel unsafe (poor lighting, noise at night, abandoned buildings…). Unverified perceptions, not crime statistics; some are demo sample data. ' +
        'Returns counts per area and type, and per hour of day (0–23, Timișoara time).',
      parameters: { type: 'object', properties: { hours: { type: 'integer', description: 'Hours back from now, 1–168. Default 168.' } } },
    },
    async run(args) {
      const hours = clampInt(args.hours, 1, 168, 168);
      const { reports, demoCount } = await safetyService.window({ hours, includeDemo: true });
      const hourOfDay = Array.from({ length: 24 }, () => 0);
      const byArea = new Map<string, Record<string, number>>();
      for (const r of reports) {
        hourOfDay[Number(localHour(r.createdAt).slice(11, 13))]++;
        const a = byArea.get(r.areaId) ?? {};
        a[r.type] = (a[r.type] ?? 0) + 1;
        byArea.set(r.areaId, a);
      }
      return {
        available: true,
        source: safetyService.status().active,
        total: reports.length,
        demo: demoCount,
        real: reports.length - demoCount,
        byHourOfDay: hourOfDay.map((n, h) => [h, n]),
        byArea: [...byArea.entries()].map(([id, types]) => ({ area: areaName(id), total: Object.values(types).reduce((s, n) => s + n, 0), byType: types }))
          .sort((a, b) => b.total - a.total),
      };
    },
  },
  {
    declaration: {
      name: 'get_wind_history',
      description:
        'Measured hourly wind in central Timișoara from Open-Meteo: rows [hour, speed km/h, direction degrees the wind comes FROM] in Timișoara time, up to the last 7 days. ' +
        'Use it to check whether smell reports line up with the wind (e.g. smell in an area east of a source when the wind blows from the west).',
      parameters: { type: 'object', properties: { days: { type: 'integer', description: '1–7. Default 2.' } } },
    },
    async run(args) {
      const days = clampInt(args.days, 1, 7, 2);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=45.7489&longitude=21.2087&hourly=wind_speed_10m,wind_direction_10m` +
        `&wind_speed_unit=kmh&past_days=${days}&forecast_days=1&timezone=${encodeURIComponent(TZ)}`;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
        const data = (await res.json()) as { hourly?: { time: string[]; wind_speed_10m: number[]; wind_direction_10m: number[] } };
        const h = data.hourly;
        if (!h?.time?.length) throw new Error('no hourly data');
        const nowLocal = localHour(new Date());
        const rows = h.time
          .map((t, i) => [t.replace('T', ' '), h.wind_speed_10m[i], h.wind_direction_10m[i], compassPoint(h.wind_direction_10m[i])])
          .filter((r) => String(r[0]) <= nowLocal);
        return {
          available: true,
          source: 'open-meteo',
          timezone: 'Timișoara local time',
          note: 'Direction is where the wind comes FROM (meteorological convention): 270 / W means it blows from west to east.',
          columns: ['hour', 'speed_kmh', 'from_direction_deg', 'from_compass'],
          rows,
        };
      } catch (err) {
        return { available: false, source: 'unavailable', reason: `Wind history could not be loaded (${err instanceof Error ? err.message : 'error'}).` };
      }
    },
  },
];

const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.declaration.name, t]));

// ---------------------------------------------------------------- prompt

function systemInstruction(language: AssistantLanguage | null): string {
  const now = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, dateStyle: 'full', timeStyle: 'short' }).format(new Date());
  const areas = TIMISOARA_AREAS.map((a) => `${a.name} (${a.id}, ${a.center_lat.toFixed(3)}, ${a.center_lng.toFixed(3)})`).join('; ');
  return `You are the data analyst of Timișoara City Hall. City staff ask you questions about the city's data.

How to work:
1. First fetch the data you need with the tools. Never invent, estimate or simulate numbers. If a tool says available: false, say that data is unavailable.
2. Then use code execution (Python) to calculate the answer: peaks, averages, comparisons, correlations, trends. Each code block must be complete on its own: import what it uses (pandas, matplotlib) and define the data in it, copying the fetched rows exactly. print() every number you will mention.
3. When a chart makes the answer clearer, draw exactly one matplotlib chart: clear title, labelled axes with units, Timișoara local time on the time axis, readable tick labels, plt.tight_layout(). Labels in the answer's language. Never draw wind direction as a line (it jumps between 359° and 0°): use its compass labels, arrows or a separate bar chart.
4. Then answer in plain words for a busy official: one or two sentences with the key finding and its numbers, then at most 4 short bullet points. No code in the answer.

Accuracy rules:
- Only mention numbers that a tool returned or that your code printed. Copy dates and hours exactly as the data shows them (with the correct year).
- Wind direction is where the wind comes FROM. A smell source lies UPWIND of the people who smell it: with wind from the west (W), a source would be west of the reporting area. Use the areas' coordinates below for what lies east or west of what. Only say the wind "lines up" if this geometry really fits; otherwise say it does not, or that the data is too thin.
- With fewer than about 10 reports, say the sample is small.

Honesty rules:
- Say where the numbers come from (Tiger Cloud history, residents' reports, Open-Meteo wind). If reports include demo sample data, say how many.
- Residents' smell and safety reports are unverified. Safety reports are perceptions about places, not crime statistics; never blame or speculate about people or groups.
- A correlation is not proof of a cause: say "lines up with", not "is caused by".
- Times are Timișoara local time.

Areas (name, id, lat, lng): ${areas}.
Current date and time in Timișoara: ${now}.
Language: write the answer and the chart labels in the same language as the staff member's question (an English question gets an English answer, a Romanian one a Romanian answer), even though area names and data labels are Romanian.${language ? ` If the question's language is unclear, use ${language === 'ro' ? 'Romanian' : 'English'}.` : ''}`;
}

// ---------------------------------------------------------------- the loop

const RO_WORDS = new Set(['și', 'si', 'care', 'unde', 'când', 'cand', 'cum', 'câte', 'cate', 'cele', 'mai', 'din', 'în', 'ultimele', 'zile', 'ore', 'ora', 'parcări', 'parcari', 'miros', 'sesizări', 'sesizari', 'este', 'sunt', 'pe', 'cu', 'la', 'de', 'zona', 'vântul', 'vantul']);
const EN_WORDS = new Set(['the', 'which', 'what', 'when', 'where', 'how', 'is', 'are', 'last', 'days', 'hours', 'and', 'of', 'does', 'do', 'with', 'most', 'in', 'at', 'over', 'compare', 'area', 'areas', 'wind', 'reports', 'parking', 'city']);

/** The question's own language, by counting common words of each (plus Romanian letters); a tie gives the fallback. */
export function questionLanguage(question: string, fallback: AssistantLanguage | null): AssistantLanguage | null {
  const words = question.toLowerCase().match(/\p{L}+/gu) ?? [];
  let ro = (question.match(/[ăâîșşțţ]/gi) ?? []).length;
  let en = 0;
  for (const w of words) {
    if (RO_WORDS.has(w)) ro++;
    if (EN_WORDS.has(w)) en++;
  }
  return ro > en ? 'ro' : en > ro ? 'en' : fallback;
}

export async function askAnalyst(question: string, language: AssistantLanguage | null): Promise<AnalystResult> {
  const started = Date.now();
  const model = process.env.GEMINI_ANALYST_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  try {
    return await analyse(question, language, model, started);
  } catch (err) {
    // Google's "high demand" can hit any round; a fresh start with the fallback model is safe (no half-finished turns).
    if (!(err instanceof GeminiBusyError) || model === FALLBACK_MODEL) throw err;
    console.warn(`[m10-analyst] ${model} stayed busy, starting over with ${FALLBACK_MODEL}`);
    return analyse(question, language, FALLBACK_MODEL, started);
  }
}

async function analyse(question: string, language: AssistantLanguage | null, model: string, started: number): Promise<AnalystResult> {
  const ai = getClient();
  const config = {
    systemInstruction: systemInstruction(questionLanguage(question, language)),
    tools: [{ codeExecution: {} }, { functionDeclarations: TOOLS.map((t) => t.declaration) }],
    // lets Gemini mix its own code execution with our function calls in one conversation
    toolConfig: { includeServerSideToolInvocations: true },
  };
  // Flash-Lite sometimes answers in Romanian because the data is Romanian, so the language is also stated next to the question.
  const lang = questionLanguage(question, language);
  const reminder = lang ? `\n\n(Answer and label the chart in ${lang === 'ro' ? 'Romanian' : 'English'}.)` : '';
  const contents: Content[] = [{ role: 'user', parts: [{ text: question + reminder }] }];
  const steps: AnalystStep[] = [];
  const charts: AnalystResult['charts'] = [];
  let answer = '';
  let usedModel = model;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const last = round === MAX_ROUNDS - 1;
    const response = await callModel(ai, contents, last ? { ...config, toolConfig: { ...config.toolConfig, functionCallingConfig: { mode: 'NONE' } } } : config, model);
    if (typeof response.modelVersion === 'string' && response.modelVersion) usedModel = response.modelVersion; // shows the fallback if one answered
    const content = response.candidates?.[0]?.content;
    const parts: Part[] = content?.parts ?? [];

    let text = '';
    for (const p of parts) {
      if (p.executableCode?.code) steps.push({ kind: 'code', name: 'python', code: String(p.executableCode.code) });
      if (p.codeExecutionResult) {
        const open = [...steps].reverse().find((s) => s.kind === 'code' && s.outcome === undefined);
        const output = String(p.codeExecutionResult.output ?? '').slice(0, 4000);
        const outcome = String(p.codeExecutionResult.outcome ?? 'OUTCOME_OK');
        if (open) { open.output = output; open.outcome = outcome; } else steps.push({ kind: 'code', name: 'python', output, outcome });
      }
      if (p.inlineData?.data && String(p.inlineData.mimeType).startsWith('image/') && charts.length < MAX_CHARTS) {
        charts.push({ mimeType: String(p.inlineData.mimeType), data: String(p.inlineData.data) });
      }
      if (typeof p.text === 'string' && !p.thought) text += p.text;
    }
    if (text.trim()) answer = text.trim();

    const calls = (response.functionCalls ?? []) as { id?: string; name?: string; args?: Record<string, unknown> }[];
    if (calls.length === 0 || last) break;

    // Send the model's turn back unchanged (thought signatures, code parts), then our tool results.
    contents.push(content ?? { role: 'model', parts: calls.map((functionCall) => ({ functionCall })) });
    const results = await Promise.all(calls.map(async (call) => {
      const name = call.name ?? 'unknown';
      const tool = TOOL_BY_NAME.get(name);
      let output: Record<string, unknown>;
      try {
        output = tool ? await tool.run(call.args ?? {}) : { error: `Unknown tool "${name}".` };
      } catch (err) {
        console.warn(`[m10-analyst] Tool "${name}" failed: ${err instanceof Error ? err.message : 'error'}`);
        output = { available: false, source: 'unavailable', reason: 'This data source failed right now.' };
      }
      steps.push({ kind: 'tool', name, source: String(output.source ?? 'unknown'), args: call.args ?? {} });
      return { functionResponse: { id: call.id, name, response: { output } } };
    }));
    contents.push({ role: 'user', parts: results });
  }

  if (!answer) throw new AssistantUnavailableError('The analyst could not finish the answer. Please try again or ask a simpler question.');
  return { answer, charts, steps, model: usedModel, ms: Date.now() - started };
}
