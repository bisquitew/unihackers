import { API_URL } from './config';

const BASE = `${API_URL}/v1/m/feedback`;

export interface ChangelogEntry {
  version: string;
  hour: number;
  changed: string;
  becauseOf: { ref: string; summary: string }[];
}

export interface InAppFeedback {
  rating: number;
  moduleId: string | null;
  text: string;
  appVersion: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export async function submitFeedback(input: InAppFeedback): Promise<void> {
  await request('', { method: 'POST', body: JSON.stringify(input) });
}

/** Oldest first; the last entry is the current app version. */
export async function fetchChangelog(): Promise<ChangelogEntry[]> {
  const { changelog } = await request<{ changelog: ChangelogEntry[] }>('/changelog');
  return changelog;
}
