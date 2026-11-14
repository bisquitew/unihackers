import { normalizePlace } from '../../core/text.ts';
import { seedVisitorInfo } from './seed.ts';
import {
  VISITOR_CATEGORIES,
  type LocalizedVisitorInfo,
  type VisitorCategory,
  type VisitorCategoryInfo,
  type VisitorInfoEntry,
  type VisitorLang,
} from './types.ts';

const CATEGORY_LABELS: Record<VisitorCategory, Record<VisitorLang, string>> = {
  emergency: { ro: 'Urgențe', en: 'Emergencies' },
  transport: { ro: 'Transport', en: 'Transport' },
  arrival: { ro: 'Sosire', en: 'Arriving' },
  'tourist-info': { ro: 'Info turistic', en: 'Tourist info' },
  money: { ro: 'Bani', en: 'Money' },
  'city-alerts': { ro: 'Alerte în oraș', en: 'City alerts' },
};

// Question words that would match almost every entry.
const STOPWORDS = new Set([
  // English
  'the', 'and', 'for', 'how', 'what', 'where', 'when', 'who', 'can', 'does', 'from', 'with', 'get', 'into', 'this',
  'that', 'there', 'about', 'which', 'you', 'your', 'are', 'need', 'any', 'timisoara',
  // Romanian
  'cum', 'cat', 'cate', 'care', 'unde', 'cand', 'din', 'pentru', 'este', 'sunt', 'ce', 'pot', 'un', 'una', 'mai', 'sau',
  'iar', 'prin', 'spre', 'catre',
]);

/** "emergency" ~ "emergencies", "tramvai" ~ "tramvaie": equal, prefix (4+ letters), or a long common stem. */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const min = Math.min(a.length, b.length);
  if (min < 4) return false;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  let common = 0;
  while (common < min && a[common] === b[common]) common++;
  return common >= 5 && common >= min - 2;
}

const words = (s: string) => normalizePlace(s).split(' ').filter((w) => w && !STOPWORDS.has(w) && (w.length >= 3 || /\d/.test(w)));

interface IndexedEntry {
  entry: VisitorInfoEntry;
  title: string[];
  text: string[];
  category: string[];
}

export class VisitorInfoService {
  private readonly entries: VisitorInfoEntry[];
  private readonly index: IndexedEntry[];

  constructor(entries: VisitorInfoEntry[] = seedVisitorInfo) {
    this.entries = entries;
    // Search both languages, so an English question still finds the entry if the model sends Romanian words.
    this.index = entries.map((entry) => ({
      entry,
      title: words(`${entry.ro.title} ${entry.en.title}`),
      text: words(`${entry.ro.text} ${entry.en.text}`),
      category: words(`${entry.category} ${CATEGORY_LABELS[entry.category].ro} ${CATEGORY_LABELS[entry.category].en}`),
    }));
  }

  localize(entry: VisitorInfoEntry, lang: VisitorLang): LocalizedVisitorInfo {
    const { title, text } = entry[lang];
    return { id: entry.id, category: entry.category, verify: entry.verify, sources: entry.sources, checked: entry.checked, lang, title, text };
  }

  list(lang: VisitorLang, category?: VisitorCategory): LocalizedVisitorInfo[] {
    return this.entries.filter((e) => !category || e.category === category).map((e) => this.localize(e, lang));
  }

  get(id: string, lang: VisitorLang): LocalizedVisitorInfo | null {
    const entry = this.entries.find((e) => e.id === id);
    return entry ? this.localize(entry, lang) : null;
  }

  categories(): VisitorCategoryInfo[] {
    return VISITOR_CATEGORIES.map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      count: this.entries.filter((e) => e.category === id).length,
    }));
  }

  /** Best matches first. Title hits weigh most, then category, then body text. */
  search(query: string, lang: VisitorLang, limit = 3): LocalizedVisitorInfo[] {
    const q = words(query);
    if (q.length === 0) return [];
    const scored = this.index
      .map(({ entry, title, text, category }) => {
        let score = 0;
        for (const w of q) {
          if (title.some((t) => wordsMatch(t, w))) score += 3;
          if (category.some((c) => wordsMatch(c, w))) score += 2;
          if (text.some((t) => wordsMatch(t, w))) score += 1;
        }
        return { entry, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => this.localize(s.entry, lang));
  }
}

export const visitorInfoService = new VisitorInfoService();
