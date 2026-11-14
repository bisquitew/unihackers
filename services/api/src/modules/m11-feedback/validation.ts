import type { InAppFeedbackInput, SurveyPayload } from './types.ts';

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_TEXT = 2000;
const MODULE_ID = /^[a-z0-9-]{1,40}$/;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isScale = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5;
const isScaleOrNull = (v: unknown) => v === null || isScale(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isNonEmpty = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** POST /v1/m/feedback — { rating, moduleId?, text, appVersion } */
export function parseInAppInput(body: unknown): Parsed<InAppFeedbackInput> {
  if (!isObject(body)) return { ok: false, error: 'Body must be a JSON object' };
  const { rating, moduleId, text, appVersion } = body;

  if (!isScale(rating)) return { ok: false, error: 'rating must be an integer from 1 to 5' };
  if (typeof text !== 'string') return { ok: false, error: 'text is required (may be empty)' };
  if (text.length > MAX_TEXT) return { ok: false, error: `text must be at most ${MAX_TEXT} characters` };
  if (!isNonEmpty(appVersion, 40)) return { ok: false, error: 'appVersion is required' };
  if (moduleId !== undefined && moduleId !== null && !(typeof moduleId === 'string' && MODULE_ID.test(moduleId))) {
    return { ok: false, error: 'moduleId must be a module id like "m06-smell"' };
  }

  return {
    ok: true,
    value: { rating, text: text.trim(), appVersion: appVersion.trim(), moduleId: (moduleId as string | undefined) ?? null },
  };
}

/** POST /v1/m/feedback/ingest — the payload from feedback-sheet.gs toPayload_(). */
export function parseSurveyPayload(body: unknown): Parsed<SurveyPayload> {
  if (!isObject(body)) return { ok: false, error: 'Body must be a JSON object' };
  const b = body;
  const fail = (field: string, rule: string): Parsed<SurveyPayload> => ({ ok: false, error: `${field} ${rule}` });

  if (b.source !== 'survey') return fail('source', 'must be "survey"');
  if (!isNonEmpty(b.externalId, 100)) return fail('externalId', 'is required');
  if (typeof b.submittedAt !== 'string' || Number.isNaN(Date.parse(b.submittedAt))) {
    return fail('submittedAt', 'must be an ISO date string');
  }
  if (!isNonEmpty(b.appVersion, 40)) return fail('appVersion', 'is required');
  if (typeof b.role !== 'string') return fail('role', 'must be a string');
  if (!(b.ageRange === null || typeof b.ageRange === 'string')) return fail('ageRange', 'must be a string or null');
  if (!isScaleOrNull(b.installLikelihood)) return fail('installLikelihood', 'must be 1–5 or null');
  if (!(b.topFeature === null || typeof b.topFeature === 'string')) return fail('topFeature', 'must be a string or null');
  if (!isStringArray(b.wantedFeatures)) return fail('wantedFeatures', 'must be an array of strings');
  if (typeof b.triedApp !== 'boolean') return fail('triedApp', 'must be a boolean');
  if (!isStringArray(b.triedParts)) return fail('triedParts', 'must be an array of strings');
  if (!isScaleOrNull(b.appRating)) return fail('appRating', 'must be 1–5 or null');
  if (!isObject(b.problemScores) || !Object.values(b.problemScores).every(isScale)) {
    return fail('problemScores', 'must map module ids to 1–5');
  }
  if (!isObject(b.text) || typeof b.text.confusing !== 'string' || typeof b.text.missing !== 'string') {
    return fail('text', 'must be { confusing: string, missing: string }');
  }
  if (b.text.confusing.length > MAX_TEXT || b.text.missing.length > MAX_TEXT) {
    return fail('text', `fields must be at most ${MAX_TEXT} characters`);
  }

  return { ok: true, value: b as unknown as SurveyPayload };
}
