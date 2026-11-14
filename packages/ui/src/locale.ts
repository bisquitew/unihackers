// The app's language: Romanian or English. English is what the code is written in; Romanian comes from a dictionary
// keyed by the English text (apps/app/src/core/i18n/ro.ts registers it). `Text`, `Field` and the other shared components
// translate what they draw, so most screens need no changes. A dictionary key containing `{}` is a template: the parts
// matching `{}` are carried over into the translation in order ("{} free spots" -> "{} locuri libere").
//
// The choice is saved on the device and read once at start. Changing it re-creates the screens (like the theme).
import { readSetting, remountApp, writeSetting } from './theme';

export type Lang = 'en' | 'ro';
const FILE = 'hop-lang.txt';
const KEY = 'hop_lang_v1';

function deviceLang(): Lang {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('ro') ? 'ro' : 'en';
  } catch {
    return 'en';
  }
}
const saved = readSetting(FILE, KEY);
/** The language in use. Live: other modules read it through the import binding. */
export let lang: Lang = saved === 'ro' || saved === 'en' ? saved : deviceLang();

type Template = { re: RegExp; to: string };
const exact: Record<Lang, Map<string, string>> = { en: new Map(), ro: new Map() };
const templates: Record<Lang, Template[]> = { en: [], ro: [] };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Adds translations for a language (English text -> text in that language). */
export function registerDictionary(target: Lang, entries: Record<string, string>) {
  for (const [from, to] of Object.entries(entries)) {
    if (from.includes('{}')) {
      const source = from.split('{}').map(escapeRegExp).join('(.+?)');
      templates[target].push({ re: new RegExp(`^${source}$`), to });
    } else {
      exact[target].set(from, to);
    }
  }
}

/** The text in the current language. Unknown text comes back unchanged. */
export function tr(text: string): string {
  if (lang === 'en' || !text) return text;
  const hit = exact[lang].get(text);
  if (hit !== undefined) return hit;
  const trimmed = text.trim();
  if (trimmed !== text) {
    const inner = exact[lang].get(trimmed);
    if (inner !== undefined) return text.replace(trimmed, inner);
  }
  for (const { re, to } of templates[lang]) {
    const m = re.exec(text);
    if (m) {
      let i = 1;
      return to.replace(/\{\}/g, () => m[i++] ?? '');
    }
  }
  return text;
}

/** Translates a sentence with values: t('Hello {name}', { name }) . The template is translated first, then filled. */
export function t(template: string, values: Record<string, string | number> = {}): string {
  return tr(template).replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
}

/** The locale for dates and numbers. */
export const dateLocale = () => (lang === 'ro' ? 'ro-RO' : 'en-GB');

/** Saves the language and re-creates the screens. `comeBackTo` is the screen to reopen afterwards. */
export function setLang(next: Lang, comeBackTo?: string) {
  if (next === lang) return;
  lang = next;
  writeSetting(FILE, KEY, next);
  remountApp(comeBackTo);
}
