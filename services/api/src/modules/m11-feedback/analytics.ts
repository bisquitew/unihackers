import type { FeedbackEntry } from './types.ts';

// The numbers behind the staff dashboard's Analytics page: the feedback summed up into averages and shares.
// By design nothing here says how many people answered: only averages, percentages and the people's own words.

export interface Share { id: string; share: number }
export interface Average { id: string; avg: number }

export interface FeedbackAnalytics {
  generatedAt: string;
  /** false until anyone has sent feedback; the page then shows its empty state */
  hasData: boolean;
  headline: {
    avgAppRating: number | null;
    avgInstallLikelihood: number | null;
    mostWantedFeature: Share | null;
    biggestProblem: Average | null;
  };
  /** "Which ONE would you use most?", as shares that add up to 100 */
  topPick: Share[];
  /** "Which features would you use?", each as the share of people who picked it */
  wanted: Share[];
  /** "How much does each problem affect you?", average 1–5 */
  problems: Average[];
  /** how the app is rated: the share of 1, 2, 3, 4 and 5 star ratings */
  ratingSpread: { stars: number; share: number }[];
  /** average in-app rating per part of the app */
  ratingByModule: Average[];
  roles: Share[];
  ages: Share[];
  /** average rating per app version, oldest first */
  versions: { appVersion: string; avgAppRating: number | null; avgInstallLikelihood: number | null }[];
  /** what people wrote, newest first (no names are collected) */
  comments: { kind: 'in-app' | 'confusing' | 'missing'; moduleId: string | null; text: string; at: string }[];
}

const round = (n: number, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;
const avg = (nums: number[]) => (nums.length ? round(nums.reduce((a, b) => a + b, 0) / nums.length, 2) : null);

/** counts -> shares in percent that add up to exactly 100 (largest remainder), biggest first */
function shares(counts: Map<string, number>): Share[] {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  const rows = [...counts.entries()].map(([id, n]) => ({ id, exact: (n / total) * 100 }));
  const out = rows.map((r) => ({ id: r.id, share: Math.floor(r.exact), rest: r.exact - Math.floor(r.exact) }));
  let left = 100 - out.reduce((a, r) => a + r.share, 0);
  [...out].sort((a, b) => b.rest - a.rest).forEach((r) => { if (left > 0) { r.share += 1; left -= 1; } });
  return out.map(({ id, share }) => ({ id, share })).sort((a, b) => b.share - a.share);
}

const tally = (values: (string | null | undefined)[]) => {
  const m = new Map<string, number>();
  values.forEach((v) => { const k = (v ?? '').trim(); if (k) m.set(k, (m.get(k) ?? 0) + 1); });
  return m;
};

/** The English half of a survey option such as "Timișoara resident / Locuitor al Timișoarei". */
const english = (s: string) => s.split(' / ')[0].trim();

export function buildAnalytics(entries: FeedbackEntry[]): FeedbackAnalytics {
  const surveys = entries.filter((e) => e.source === 'survey');
  const inApp = entries.filter((e) => e.source === 'in-app');
  const ratings = entries.map((e) => e.appRating).filter((v): v is number => typeof v === 'number');

  // how many surveys picked each feature, as a share of the surveys that answered that question
  const wantedCounts = new Map<string, number>();
  let wantedAnswers = 0;
  surveys.forEach((e) => {
    if (e.wantedFeatures.length) wantedAnswers += 1;
    e.wantedFeatures.forEach((id) => wantedCounts.set(id, (wantedCounts.get(id) ?? 0) + 1));
  });
  const wanted = [...wantedCounts.entries()]
    .map(([id, n]) => ({ id, share: Math.round((n / Math.max(1, wantedAnswers)) * 100) }))
    .sort((a, b) => b.share - a.share);

  const topPick = shares(tally(surveys.map((e) => e.topFeature)));

  const problemSums = new Map<string, number[]>();
  surveys.forEach((e) => Object.entries(e.problemScores).forEach(([id, v]) => problemSums.set(id, [...(problemSums.get(id) ?? []), v])));
  const problems = [...problemSums.entries()]
    .map(([id, vs]) => ({ id, avg: avg(vs) as number }))
    .sort((a, b) => b.avg - a.avg);

  const spread = [1, 2, 3, 4, 5].map((stars) => ({ stars, count: ratings.filter((r) => Math.round(r) === stars).length }));
  const spreadShares = shares(new Map(spread.map((s) => [String(s.stars), s.count])));
  const ratingSpread = spread.map((s) => ({ stars: s.stars, share: spreadShares.find((x) => x.id === String(s.stars))?.share ?? 0 }));

  const byModule = new Map<string, number[]>();
  inApp.forEach((e) => { if (e.moduleId && typeof e.appRating === 'number') byModule.set(e.moduleId, [...(byModule.get(e.moduleId) ?? []), e.appRating]); });
  const ratingByModule = [...byModule.entries()].map(([id, vs]) => ({ id, avg: avg(vs) as number })).sort((a, b) => b.avg - a.avg);

  const versionOrder: string[] = [];
  [...entries].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)).forEach((e) => { if (!versionOrder.includes(e.appVersion)) versionOrder.push(e.appVersion); });
  const versions = versionOrder.map((v) => {
    const list = entries.filter((e) => e.appVersion === v);
    return {
      appVersion: v,
      avgAppRating: avg(list.map((e) => e.appRating).filter((x): x is number => typeof x === 'number')),
      avgInstallLikelihood: avg(list.map((e) => e.installLikelihood).filter((x): x is number => typeof x === 'number')),
    };
  });

  const comments: FeedbackAnalytics['comments'] = [];
  entries.forEach((e) => {
    if (e.text?.trim()) comments.push({ kind: 'in-app', moduleId: e.moduleId, text: e.text.trim(), at: e.submittedAt });
    if (e.surveyComments?.confusing?.trim()) comments.push({ kind: 'confusing', moduleId: null, text: e.surveyComments.confusing.trim(), at: e.submittedAt });
    if (e.surveyComments?.missing?.trim()) comments.push({ kind: 'missing', moduleId: null, text: e.surveyComments.missing.trim(), at: e.submittedAt });
  });
  comments.sort((a, b) => b.at.localeCompare(a.at));

  return {
    generatedAt: new Date().toISOString(),
    hasData: entries.length > 0,
    headline: {
      avgAppRating: avg(ratings),
      avgInstallLikelihood: avg(entries.map((e) => e.installLikelihood).filter((v): v is number => typeof v === 'number')),
      mostWantedFeature: wanted[0] ?? null,
      biggestProblem: problems[0] ?? null,
    },
    topPick,
    wanted,
    problems,
    ratingSpread,
    ratingByModule,
    roles: shares(tally(surveys.map((e) => (e.role ? english(e.role) : null)))),
    ages: shares(tally(surveys.map((e) => (e.ageRange ? english(e.ageRange) : null)))),
    versions,
    comments: comments.slice(0, 12),
  };
}
