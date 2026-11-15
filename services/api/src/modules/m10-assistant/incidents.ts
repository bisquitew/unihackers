import { createHash } from 'node:crypto';
import { getAreaBySlugOrName, TIMISOARA_AREAS } from '../../core/areas.ts';
import { safetyService, TYPE_LABELS as SAFETY_LABELS } from '../m03-safety/service.ts';
import { utilitiesService } from '../m04-utilities/service.ts';
import { smellService, TYPE_LABELS as SMELL_LABELS } from '../m06-smell/service.ts';
import { forumService } from '../m08-forum/service.ts';
import { callModel, getClient } from './service.ts';

/*
 * Incident radar for city staff.
 *
 * 1. Every resident signal of the last hours: smell and safety reports (grouped by type and area in code),
 *    forum posts about the neighbourhood, and the official utility outages.
 * 2. Gemini embeddings (gemini-embedding-001, SEMANTIC_SIMILARITY) link free text to report groups and outages
 *    in the same area: a forum post "miroase a plastic ars" joins the burnt-rubber reports of that area, a post about
 *    cold radiators joins Colterm's outage. The area is checked in code; the embedding only judges the topic.
 * 3. Gemini (structured JSON output) writes a short card per incident in Romanian and English, and can mark a
 *    linked text as unrelated, which removes it again.
 * Without Gemini the incidents still come back, with plain titles built from the counts.
 */

const EMBED_MODEL = 'gemini-embedding-001';
const EMBED_DIMENSIONS = 768;
/** Lowest topic similarity for a link. Tested on our data: true matches 0.83–0.92, the next best unrelated text lower. */
const LINK_MIN = 0.83;
/** A report group alone becomes an incident from this many reports. */
const MIN_REPORTS = 3;
const MAX_INCIDENTS = 8;
const CACHE_MS = 5 * 60_000;
const TZ = 'Europe/Bucharest';
/** Forum categories that are never about a problem in the city (all others can be: neighbourhood, help, environment…). */
const FORUM_SKIP = new Set(['lost_pets', 'buy_sell', 'cultural']);

export type SignalSource = 'smell' | 'safety' | 'forum' | 'outage';

interface Node {
  key: string;
  source: SignalSource;
  /** what the embedding sees: the topic only, without the area (areas are compared in code) */
  topic: string;
  areaIds: string[];
  /** report groups: how many reports, of which demo; text signals count as 1 */
  count: number;
  demo: number;
  first: number;
  last: number;
  intensitySum: number;
  /** for the card: a forum title, an outage title, residents' notes */
  label: string;
  texts: string[];
  /** report groups only: the report type (burnt_rubber, poor_lighting…) */
  type?: string;
}

export interface IncidentMember {
  key: string;
  source: SignalSource;
  label: string;
  count: number;
  /** topic similarity to what it was linked to (text signals only) */
  similarity?: number;
}

export interface Incident {
  id: string;
  title: { ro: string; en: string };
  summary: { ro: string; en: string };
  urgency: 'low' | 'medium' | 'high';
  action: { ro: string; en: string } | null;
  areas: string[];
  counts: Record<SignalSource, number>;
  demoReports: number;
  avgIntensity: number | null;
  firstAt: string;
  lastAt: string;
  members: IncidentMember[];
  /** true when Gemini wrote the card; false for the plain fallback */
  aiWritten: boolean;
}

export interface IncidentRadar {
  generatedAt: string;
  hours: number;
  incidents: Incident[];
  signals: Record<SignalSource, number>;
  links: Link[];
  embeddingModel: string;
  cardModel: string | null;
  note: string | null;
  cached: boolean;
}

// ---------------------------------------------------------------- helpers

const areaName = (id: string) => TIMISOARA_AREAS.find((a) => a.id === id)?.name ?? id;
const toAreaId = (raw: string): string | null => {
  if (!raw) return null;
  if (TIMISOARA_AREAS.some((a) => a.id === raw)) return raw;
  return getAreaBySlugOrName(raw)?.id ?? null;
};
const LOCAL = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

// ---------------------------------------------------------------- 1. signals

async function collectSignals(hours: number, now: Date): Promise<Node[]> {
  const nodes: Node[] = [];
  const since = now.getTime() - hours * 3_600_000;
  const groups = new Map<string, Node>();
  const addReport = (source: 'smell' | 'safety', type: string, areaId: string, at: number, isDemo: boolean, intensity: number, note: string | null) => {
    const key = `${source}:${type}:${areaId}`;
    let g = groups.get(key);
    if (!g) {
      const label = source === 'smell' ? `${SMELL_LABELS[type as keyof typeof SMELL_LABELS]?.en ?? type} smell` : SAFETY_LABELS[type as keyof typeof SAFETY_LABELS]?.en ?? type;
      g = { key, source, topic: '', areaIds: [areaId], count: 0, demo: 0, first: at, last: at, intensitySum: 0, label: label.charAt(0).toUpperCase() + label.slice(1), texts: [], type };
      groups.set(key, g);
    }
    g.count++;
    if (isDemo) g.demo++;
    g.first = Math.min(g.first, at);
    g.last = Math.max(g.last, at);
    g.intensitySum += intensity;
    if (note && !g.texts.includes(note) && g.texts.length < 3) g.texts.push(note);
  };

  const [smell, safety, posts] = await Promise.all([
    smellService.window({ hours, includeDemo: true }, now),
    safetyService.window({ hours, includeDemo: true }, now),
    forumService.listPosts().catch(() => []),
  ]);
  for (const r of smell.reports) addReport('smell', r.type, r.areaId, Date.parse(r.createdAt), r.isDemo, r.intensity, r.note);
  for (const r of safety.reports) addReport('safety', r.type, r.areaId, Date.parse(r.createdAt), r.isDemo, 0, r.note);
  for (const g of groups.values()) {
    g.topic = [g.label, ...g.texts].join('. ');
    nodes.push(g);
  }

  // forum posts: a week at least, since people post about a problem less often than they tap a report
  const forumSince = now.getTime() - Math.max(hours, 168) * 3_600_000;
  for (const p of posts) {
    const at = Date.parse(p.createdAt);
    if (FORUM_SKIP.has(p.category) || !(at >= forumSince)) continue;
    const text = `${p.title}. ${p.content}`;
    const areaIds = new Set<string>();
    const fromField = toAreaId(p.neighbourhood ?? '');
    if (fromField) areaIds.add(fromField);
    if (areaIds.size === 0) continue; // no place, nothing to link it to
    nodes.push({ key: `forum:${p.id}`, source: 'forum', topic: short(text, 500), areaIds: [...areaIds], count: 1, demo: 0, first: at, last: at, intensitySum: 0, label: p.title, texts: [] });
  }

  // official outages that are still open
  for (const o of utilitiesService.getAllOutages()) {
    if (o.resolved_at) continue;
    const areaIds = [...new Set((o.affected_areas ?? []).map(toAreaId).filter((a): a is string => !!a))];
    if (areaIds.length === 0) continue;
    const at = Date.parse(o.start_time) || now.getTime();
    nodes.push({
      key: `outage:${o.id}`, source: 'outage', topic: short(`${o.provider} outage: ${String(o.type).replace(/_/g, ' ')}. ${o.title}. ${o.description ?? ''}`, 500),
      areaIds, count: 1, demo: 0, first: at, last: at, intensitySum: 0, label: o.title, texts: [],
    });
  }
  return nodes.filter((n) => n.source === 'forum' || n.source === 'outage' || n.last >= since);
}

// ---------------------------------------------------------------- 2. embeddings

const embeddingCache = new Map<string, number[]>();

async function embed(texts: string[]): Promise<Map<string, number[]>> {
  const missing = [...new Set(texts)].filter((t) => !embeddingCache.has(t));
  const ai = getClient();
  for (let i = 0; i < missing.length; i += 100) {
    const batch = missing.slice(i, i + 100);
    const res = await ai.models.embedContent({ model: EMBED_MODEL, contents: batch, config: { taskType: 'SEMANTIC_SIMILARITY', outputDimensionality: EMBED_DIMENSIONS } });
    (res.embeddings ?? []).forEach((e, j) => {
      const v = e.values ?? [];
      const n = Math.hypot(...v) || 1;
      embeddingCache.set(batch[j], v.map((x) => x / n)); // normalised, so a dot product is the cosine
    });
  }
  if (embeddingCache.size > 5000) embeddingCache.clear();
  return new Map(texts.map((t) => [t, embeddingCache.get(t) ?? []]));
}

const cosine = (a: number[], b: number[]) => (a.length && a.length === b.length ? a.reduce((s, x, i) => s + x * b[i], 0) : 0);

/** Union-find over the nodes: each free-text signal links to its most similar node in a shared area. */
function link(nodes: Node[], vectors: Map<string, number[]>): { parent: number[]; similarity: Map<number, number>; links: Link[] } {
  const parent = nodes.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const similarity = new Map<number, number>();
  const links: Link[] = [];
  nodes.forEach((n, i) => {
    if (n.source !== 'forum' && n.source !== 'outage') return;
    let best = -1;
    let bestSim = 0;
    nodes.forEach((m, j) => {
      if (i === j || !m.areaIds.some((a) => n.areaIds.includes(a))) return;
      if (n.source === 'outage' && m.source === 'outage') return; // two official outages are separate incidents
      const s = cosine(vectors.get(n.topic) ?? [], vectors.get(m.topic) ?? []);
      if (s > bestSim) { bestSim = s; best = j; }
    });
    if (best >= 0 && bestSim >= LINK_MIN) {
      parent[find(i)] = find(best);
      const sim = Math.round(bestSim * 1000) / 1000;
      similarity.set(i, sim);
      // a forum post and an outage can each pick the other: list that pair once
      if (links.some((l) => l.fromKey === nodes[best].key && l.to === n.label)) return;
      links.push({ fromKey: n.key, from: n.label, fromSource: n.source, to: nodes[best].label, toSource: nodes[best].source, area: areaName(n.areaIds.find((a) => nodes[best].areaIds.includes(a)) ?? n.areaIds[0]), similarity: sim });
    }
  });
  nodes.forEach((_, i) => find(i));
  return { parent, similarity, links };
}

/** One link the embeddings made (shown on the dashboard so staff can judge it). */
export interface Link {
  from: string;
  fromKey: string;
  fromSource: SignalSource;
  /** Gemini's card writer judged this text to be about a different problem, so it was taken out again */
  rejected?: boolean;
  to: string;
  toSource: SignalSource;
  area: string;
  similarity: number;
}

// ---------------------------------------------------------------- 3. incidents + cards

interface Draft {
  id: string;
  nodes: { node: Node; similarity?: number }[];
}

function score(d: Draft): number {
  const reports = d.nodes.filter((x) => x.node.source === 'smell' || x.node.source === 'safety').reduce((s, x) => s + x.node.count, 0);
  const forum = d.nodes.filter((x) => x.node.source === 'forum').length;
  const outage = d.nodes.some((x) => x.node.source === 'outage') ? 1 : 0;
  return reports + 4 * forum + 6 * outage;
}

function isIncident(d: Draft): boolean {
  const reports = d.nodes.filter((x) => x.node.source === 'smell' || x.node.source === 'safety').reduce((s, x) => s + x.node.count, 0);
  const sources = new Set(d.nodes.map((x) => x.node.source));
  // enough reports, or residents' text confirming something (two kinds of signal)
  return reports >= MIN_REPORTS || sources.size >= 2;
}

function toIncident(d: Draft): Incident {
  const counts: Record<SignalSource, number> = { smell: 0, safety: 0, forum: 0, outage: 0 };
  let demo = 0;
  let intensitySum = 0;
  let smellCount = 0;
  for (const { node } of d.nodes) {
    counts[node.source] += node.count;
    demo += node.demo;
    if (node.source === 'smell') { intensitySum += node.intensitySum; smellCount += node.count; }
  }
  const areas = [...new Set(d.nodes.flatMap((x) => x.node.areaIds))];
  const main = [...d.nodes].sort((a, b) => b.node.count - a.node.count)[0].node;
  const title = `${main.label} · ${areas.map(areaName).join(', ')}`;
  const parts = Object.entries(counts).filter(([, n]) => n > 0).map(([s, n]) => `${n} ${s}`);
  return {
    id: d.id,
    title: { ro: title, en: title },
    summary: { ro: parts.join(', '), en: parts.join(', ') },
    urgency: counts.outage || counts.smell + counts.safety >= 10 ? 'high' : counts.smell + counts.safety >= 5 ? 'medium' : 'low',
    action: null,
    areas: areas.map(areaName),
    counts,
    demoReports: demo,
    avgIntensity: smellCount ? Math.round((intensitySum / smellCount) * 10) / 10 : null,
    firstAt: new Date(Math.min(...d.nodes.map((x) => x.node.first))).toISOString(),
    lastAt: new Date(Math.max(...d.nodes.map((x) => x.node.last))).toISOString(),
    members: d.nodes.map(({ node, similarity }) => ({ key: node.key, source: node.source, label: node.label, count: node.count, ...(similarity ? { similarity } : {}) })),
    aiWritten: false,
  };
}

const CARD_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      id: { type: 'STRING' },
      title_ro: { type: 'STRING', description: 'Max 60 characters: the problem and the place, e.g. "Miros de cauciuc ars în Fabric".' },
      title_en: { type: 'STRING', description: 'The same title in English.' },
      summary_ro: { type: 'STRING', description: 'One or two Romanian sentences for a city official: what, where, since when, how many signals, and if the official outage explains residents\' posts.' },
      summary_en: { type: 'STRING', description: 'The same summary in English.' },
      urgency: { type: 'STRING', enum: ['low', 'medium', 'high'] },
      action_ro: { type: 'STRING', description: 'One short suggested next step for city hall, in Romanian (e.g. "Verificați iluminatul public pe ..."). Cautious; no blame.' },
      action_en: { type: 'STRING', description: 'The same next step in English.' },
      unrelated_keys: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Keys of forum posts or outages in this incident that are clearly about a different problem.' },
    },
    required: ['id', 'title_ro', 'title_en', 'summary_ro', 'summary_en', 'urgency', 'action_ro', 'action_en', 'unrelated_keys'],
  },
};

const CARD_SYSTEM = `You write incident cards for Timișoara City Hall's staff dashboard.
Each incident groups residents' signals about one problem in one area: tapped smell or safety reports (unverified), forum posts, and official utility outages.
Rules:
- Use only the facts given. Never invent numbers, causes, companies or places.
- Describe places and problems, never people or groups. Safety reports are perceptions, not crime statistics.
- If some reports are demo sample data, say so briefly in the summary.
- Times are already in Timișoara local time.
- A forum post or outage that is clearly about a different problem goes in unrelated_keys.
- urgency: high for an outage affecting homes, or many recent reports; low for a handful of old reports.`;

async function writeCards(incidents: Incident[], drafts: Draft[]): Promise<{ model: string; rejected: Set<string> } | null> {
  const rejected = new Set<string>();
  if (!process.env.GEMINI_API_KEY?.trim() || incidents.length === 0) return null;
  const input = incidents.map((inc, i) => ({
    id: inc.id,
    areas: inc.areas,
    counts: inc.counts,
    demo_reports: inc.demoReports,
    avg_smell_intensity_1_to_5: inc.avgIntensity,
    from: LOCAL.format(new Date(inc.firstAt)),
    to: LOCAL.format(new Date(inc.lastAt)),
    signals: drafts[i].nodes.map(({ node }) => ({
      key: node.key,
      source: node.source,
      what: node.source === 'smell' || node.source === 'safety' ? `${node.count} × ${node.label}` : node.label,
      text: node.source === 'forum' || node.source === 'outage' ? short(node.topic, 300) : node.texts.join(' / ') || undefined,
    })),
  }));
  const ai = getClient();
  const response = await callModel(ai, [{ role: 'user', parts: [{ text: `Write one card per incident:\n${JSON.stringify(input)}` }] }], {
    systemInstruction: CARD_SYSTEM, responseMimeType: 'application/json', responseSchema: CARD_SCHEMA, temperature: 0.2,
  });
  const cards = JSON.parse(String(response.text ?? '[]')) as Record<string, unknown>[];
  const byId = new Map(cards.map((c) => [String(c.id), c]));
  incidents.forEach((inc, i) => {
    const c = byId.get(inc.id);
    if (!c) return;
    const text = (k: string) => (typeof c[k] === 'string' && (c[k] as string).trim() ? short((c[k] as string).trim(), k.startsWith('title') ? 80 : 400) : null);
    if (text('title_ro') && text('title_en')) inc.title = { ro: text('title_ro')!, en: text('title_en')! };
    if (text('summary_ro') && text('summary_en')) inc.summary = { ro: text('summary_ro')!, en: text('summary_en')! };
    if (c.urgency === 'low' || c.urgency === 'medium' || c.urgency === 'high') inc.urgency = c.urgency;
    if (text('action_ro') && text('action_en')) inc.action = { ro: text('action_ro')!, en: text('action_en')! };
    // Gemini's second opinion: drop linked texts it judged unrelated (report groups always stay)
    const unrelated = new Set(Array.isArray(c.unrelated_keys) ? c.unrelated_keys.map(String) : []);
    const removed = inc.members.filter((m) => (m.source === 'forum' || m.source === 'outage') && unrelated.has(m.key));
    if (removed.length && removed.length < inc.members.length) {
      inc.members = inc.members.filter((m) => !removed.includes(m));
      for (const m of removed) { inc.counts[m.source] -= m.count; rejected.add(m.key); }
    }
    inc.aiWritten = true;
  });
  return { model: String(response.modelVersion || process.env.GEMINI_MODEL || 'gemini'), rejected };
}

// ---------------------------------------------------------------- entry point

const cache = new Map<number, { at: number; value: IncidentRadar }>();

/** `fresh` skips the 5-minute cache (the dashboard's Refresh button; the route's rate limit still applies). */
export async function incidentRadar(hours: number, fresh = false, now = new Date()): Promise<IncidentRadar> {
  const hit = cache.get(hours);
  if (!fresh && hit && now.getTime() - hit.at < CACHE_MS) return { ...hit.value, cached: true };

  const nodes = await collectSignals(hours, now);
  const signals: Record<SignalSource, number> = { smell: 0, safety: 0, forum: 0, outage: 0 };
  for (const n of nodes) signals[n.source] += n.count;

  let note: string | null = null;
  let parent = nodes.map((_, i) => i);
  let similarity = new Map<number, number>();
  let links: Link[] = [];
  try {
    const vectors = await embed(nodes.map((n) => n.topic));
    ({ parent, similarity, links } = link(nodes, vectors));
  } catch (err) {
    note = 'Gemini embeddings are unavailable right now, so forum posts and outages are not linked to the reports.';
    console.warn(`[m10-incidents] Embeddings failed: ${err instanceof Error ? err.message.slice(0, 200) : 'error'}`);
  }

  const byRoot = new Map<number, Draft>();
  nodes.forEach((node, i) => {
    const root = parent[i];
    const d = byRoot.get(root) ?? { id: '', nodes: [] };
    d.nodes.push({ node, ...(similarity.has(i) ? { similarity: similarity.get(i) } : {}) });
    byRoot.set(root, d);
  });
  const drafts = [...byRoot.values()]
    .map((d) => ({ ...d, id: createHash('sha1').update(d.nodes.map((x) => x.node.key).sort().join('|')).digest('hex').slice(0, 10) }))
    .filter(isIncident)
    .sort((a, b) => score(b) - score(a))
    .slice(0, MAX_INCIDENTS);
  const incidents = drafts.map(toIncident);

  let cardModel: string | null = null;
  try {
    const written = await writeCards(incidents, drafts);
    cardModel = written?.model ?? null;
    for (const l of links) if (written?.rejected.has(l.fromKey)) l.rejected = true;
  } catch (err) {
    note = (note ? `${note} ` : '') + 'Gemini could not write the cards right now, so they show plain counts.';
    console.warn(`[m10-incidents] Cards failed: ${err instanceof Error ? err.message.slice(0, 200) : 'error'}`);
  }

  const value: IncidentRadar = {
    generatedAt: now.toISOString(), hours, incidents, signals, links, embeddingModel: EMBED_MODEL, cardModel, note, cached: false,
  };
  if (cardModel) cache.set(hours, { at: now.getTime(), value });
  return value;
}
