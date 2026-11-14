// Tells the API which client a request comes from ("app"), so it can apply the access rule: staff accounts are for the
// web dashboard only, residents for the app only. Sent on every request to the API; installed once at start.
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

let installed = false;
export function installHubClientHeader() {
  if (installed || typeof fetch !== 'function') return;
  installed = true;
  const original = fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    if (!url.startsWith(API_URL)) return original(input as any, init);
    const headers = new Headers(init?.headers ?? (typeof input === 'object' && 'headers' in input ? (input as Request).headers : undefined));
    headers.set('X-Hub-Client', 'app');
    return original(input as any, { ...init, headers });
  }) as typeof fetch;
}
