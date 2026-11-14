import { VISITOR_CATEGORIES, VISITOR_LANGS, type VisitorCategory, type VisitorLang } from './types.ts';

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Missing → 'ro' (the app's default language). */
export function parseLang(raw: string | undefined): Result<VisitorLang> {
  if (raw === undefined || raw === '') return { ok: true, value: 'ro' };
  const lang = raw.toLowerCase();
  return (VISITOR_LANGS as readonly string[]).includes(lang)
    ? { ok: true, value: lang as VisitorLang }
    : { ok: false, error: `lang must be one of: ${VISITOR_LANGS.join(', ')}` };
}

/** Missing → no filter. */
export function parseCategory(raw: string | undefined): Result<VisitorCategory | undefined> {
  if (raw === undefined || raw === '') return { ok: true, value: undefined };
  return (VISITOR_CATEGORIES as readonly string[]).includes(raw)
    ? { ok: true, value: raw as VisitorCategory }
    : { ok: false, error: `category must be one of: ${VISITOR_CATEGORIES.join(', ')}` };
}
