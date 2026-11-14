// Place-name matching that tolerates diacritics, case and Romanian articles,
// so "Complexul Studențesc", "Complex Studențesc" and "complex studentesc" are the same place.

/** Lowercase, strip diacritics (ă â î ș ş ț ţ), turn punctuation into spaces. */
export function normalizePlace(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Generic words that would make every street or square match each other.
const GENERIC = new Set(['strada', 'str', 'calea', 'bulevardul', 'bd', 'bdul', 'piata', 'aleea', 'zona', 'cartierul', 'de', 'din', 'la', 'si', 'nr', 'timisoara']);

// Equal words ("700"), or "complex" ~ "complexul": one word is a prefix of the other (min 4 letters).
const sameWord = (a: string, b: string) =>
  a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));

/** True if a stored place name (area, street, stop) and a user query refer to the same place. */
export function placeMatches(stored: string, query: string): boolean {
  const a = normalizePlace(stored);
  const b = normalizePlace(query);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  // House numbers ("Str. Văcărescu nr. 1–40") only count when the question has numbers too.
  const queryHasNumbers = /\d/.test(b);
  const storedWords = a.split(' ').filter((w) => !GENERIC.has(w) && (queryHasNumbers || !/^\d+$/.test(w)));
  const queryWords = b.split(' ').filter((w) => !GENERIC.has(w));
  if (storedWords.length === 0 || queryWords.length === 0) return false;
  return storedWords.every((w) => queryWords.some((q) => sameWord(w, q)));
}
