export const VISITOR_CATEGORIES = ['emergency', 'transport', 'arrival', 'tourist-info', 'money', 'city-alerts'] as const;
export type VisitorCategory = (typeof VISITOR_CATEGORIES)[number];

export const VISITOR_LANGS = ['ro', 'en'] as const;
export type VisitorLang = (typeof VISITOR_LANGS)[number];

/** One entry of docs/visitor-info/content.md, in both languages. */
export interface VisitorInfoEntry {
  id: string;
  category: VisitorCategory;
  /** True when the entry has a price or schedule that changes: show "check before you travel". */
  verify: boolean;
  /** URLs or plain-text sources, in the order they appear in content.md. */
  sources: string[];
  /** Date the entry was last checked (YYYY-MM-DD). */
  checked: string;
  ro: { title: string; text: string };
  en: { title: string; text: string };
}

/** An entry in one language, as returned by the API. */
export interface LocalizedVisitorInfo {
  id: string;
  category: VisitorCategory;
  verify: boolean;
  sources: string[];
  checked: string;
  lang: VisitorLang;
  title: string;
  text: string;
}

export interface VisitorCategoryInfo {
  id: VisitorCategory;
  label: Record<VisitorLang, string>;
  count: number;
}
