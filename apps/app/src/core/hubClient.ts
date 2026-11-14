// Every request the app makes to the API carries the same two headers, whichever module makes it: which client this is
// ("app", so the API applies the access rule: staff accounts are for the website only) and the signed-in token.
// Installed once at start. Modules that call fetch themselves (the P4 modules) get this for free; new code should use `api`.
import { apiBaseUrl, getSessionToken } from './api';

let installed = false;
export function installHubClientHeader() {
  if (installed || typeof fetch !== 'function') return;
  installed = true;
  const original = fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    if (!url.startsWith(apiBaseUrl())) return original(input as any, init);
    const headers = new Headers(init?.headers ?? (typeof input === 'object' && 'headers' in input ? (input as Request).headers : undefined));
    headers.set('X-Hub-Client', 'app');
    const token = getSessionToken();
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    return original(input as any, { ...init, headers });
  }) as typeof fetch;
}
