// One small typed client for the hop API, used by the app and the website's JS (same behaviour on both).
// It adds the two headers the API expects (which client this is, and the signed-in token), unwraps JSON, and turns every
// failure into an ApiError carrying the HTTP status and the API's own error code, so screens can say something useful.

export type ClientKind = 'app' | 'web';

export interface ApiClientOptions {
  /** Where the API is. A function so it can be worked out late (the app learns it from its dev server address). */
  baseUrl: () => string;
  client: ClientKind;
  /** The signed-in session token, if any. */
  getToken?: () => string | null;
  /** Milliseconds before a request gives up. */
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  /** The API says the person has to sign in (or the session is no longer valid). */
  get needsLogin() {
    return this.status === 401;
  }
  /** The network failed or the API did not answer (not an answer with an error status). */
  get offline() {
    return this.status === 0;
  }
}

export interface ApiClient {
  get<T = unknown>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T>;
  post<T = unknown>(path: string, body?: unknown): Promise<T>;
  put<T = unknown>(path: string, body?: unknown): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown): Promise<T>;
  del<T = unknown>(path: string): Promise<T>;
  /** The address requests go to, for places that need a full URL (images, event streams). */
  url(path: string): string;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const timeoutMs = options.timeoutMs ?? 15000;

  const url = (path: string, query?: Record<string, string | number | boolean | undefined>) => {
    const base = options.baseUrl().replace(/\/+$/, '');
    const qs = query
      ? Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    return `${base}${path.startsWith('/') ? path : `/${path}`}${qs ? `?${qs}` : ''}`;
  };

  async function request<T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const headers: Record<string, string> = { 'X-Hub-Client': options.client };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = options.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(url(path, query), { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
    } catch {
      throw new ApiError(0, 'offline', 'Could not reach the server. Check your connection.');
    } finally {
      clearTimeout(timer);
    }

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      /* an empty or non-JSON answer */
    }
    if (!res.ok) {
      throw new ApiError(res.status, data?.error ?? 'error', data?.error_description ?? data?.message ?? `The server answered ${res.status}.`);
    }
    return data as T;
  }

  return {
    get: (path, query) => request('GET', path, undefined, query),
    post: (path, body) => request('POST', path, body ?? {}),
    put: (path, body) => request('PUT', path, body ?? {}),
    patch: (path, body) => request('PATCH', path, body ?? {}),
    del: (path) => request('DELETE', path),
    url: (path) => url(path),
  };
}

export * from './hub.ts';

