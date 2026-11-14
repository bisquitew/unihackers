import { API_URL } from './config';

const BASE = `${API_URL}/v1/m/visitor-info`;

export type VisitorLang = 'ro' | 'en';

export interface VisitorInfoEntry {
  id: string;
  category: string;
  /** Price or schedule that changes: show "check before you travel". */
  verify: boolean;
  /** URLs or plain-text sources. */
  sources: string[];
  checked: string;
  lang: VisitorLang;
  title: string;
  text: string;
}

export interface VisitorCategory {
  id: string;
  label: Record<VisitorLang, string>;
  count: number;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export async function fetchCategories(): Promise<VisitorCategory[]> {
  const { categories } = await request<{ categories: VisitorCategory[] }>('/categories');
  return categories;
}

export async function fetchEntries(lang: VisitorLang, category: string | null): Promise<VisitorInfoEntry[]> {
  const params = new URLSearchParams({ lang });
  if (category) params.set('category', category);
  const { entries } = await request<{ entries: VisitorInfoEntry[] }>(`?${params.toString()}`);
  return entries;
}
