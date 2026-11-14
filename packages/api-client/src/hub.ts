/**
 * @hub/api-client - Typed Module Namespaces
 * 
 * High-level typed client methods for all 13 modules + core services.
 */

export interface HubApiClientOptions {
  baseUrl?: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

export class HubApiClient {
  private baseUrl: string;
  private getToken?: () => string | null | Promise<string | null>;
  private staticToken: string | null = null;
  private onUnauthorized?: () => void;

  constructor(options: HubApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'http://localhost:8000').replace(/\/$/, '');
    this.getToken = options.getToken;
    this.onUnauthorized = options.onUnauthorized;
  }

  public setAuthToken(token: string | null) {
    this.staticToken = token;
  }

  private async resolveToken(): Promise<string | null> {
    if (this.staticToken) return this.staticToken;
    if (this.getToken) return await this.getToken();
    return null;
  }

  public async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const token = await this.resolveToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Hub-Client': 'app',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 && this.onUnauthorized) {
      this.onUnauthorized();
    }

    if (!res.ok) {
      let errBody: any;
      try {
        errBody = await res.json();
      } catch {
        errBody = { error: res.statusText };
      }
      const error: any = new Error(errBody.error || errBody.message || `API error ${res.status}`);
      error.status = res.status;
      error.data = errBody;
      throw error;
    }

    if (res.status === 204) return {} as T;

    return (await res.json()) as T;
  }

  // 1. CORE SYSTEM & AUTH0
  public core = {
    getHealth: () => this.request<{ status: string; project: string; version: string; timestamp: string }>('/health'),
    getAreas: () => this.request<any[]>('/v1/core/areas'),
    getFlags: () => this.request<Record<string, boolean>>('/v1/core/flags'),
    getTigerStatus: () => this.request<any>('/v1/core/tiger/status'),
    getTigerCompression: () => this.request<any>('/v1/core/tiger/compression'),
    getHeatmap: () => this.request<any>('/v1/core/analytics/heatmap'),
    getCityMetrics: (params?: { metric_type?: string; area_id?: string; hours?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<any[]>(`/v1/core/analytics/city-metrics${q ? `?${q}` : ''}`);
    },
    ingestMetric: (payload: { metric_type: string; area_id: string; value: number; metadata?: any }) =>
      this.request('/v1/core/metrics/ingest', { method: 'POST', body: JSON.stringify(payload) }),
    getOpenDataExport: (format?: 'json' | 'csv') => {
      if (format === 'csv') return `${this.baseUrl}/v1/core/open-data/export?format=csv`;
      return this.request<any>('/v1/core/open-data/export');
    },
    getSignedUploadUrl: (filename: string, content_type: string) =>
      this.request<{ upload_url: string; public_url: string; key: string }>('/v1/core/upload/signed-url', {
        method: 'POST',
        body: JSON.stringify({ filename, content_type })
      }),
    getUserPlaces: () => this.request<any[]>('/v1/core/user/places'),
    addUserPlace: (place: { name: string; address: string; latitude: number; longitude: number }) =>
      this.request('/v1/core/user/places', { method: 'POST', body: JSON.stringify(place) }),
  };

  public auth = {
    getMe: () => this.request<any>('/v1/core/auth/me'),
    login: (email: string, role?: 'resident' | 'admin' | 'moderator') =>
      this.request<{ ok: boolean; token: string; user: any; example_header: string }>('/v1/core/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, role })
      }),
    googleLogin: (payload: { email: string; name?: string; role?: string; picture?: string }) =>
      this.request<{ ok: boolean; token: string; user: any }>('/v1/core/auth/google-login', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    getDevTokens: () => this.request<any[]>('/v1/core/auth/dev-tokens'),
    getUsers: () => this.request<any[]>('/v1/core/users'),
    getAuditLog: () => this.request<any[]>('/v1/core/auth/audit-log'),
    getSecurityEmails: (email?: string) =>
      this.request<{ ok: boolean; count: number; emails: any[] }>(`/v1/core/auth/security-emails${email ? `?email=${encodeURIComponent(email)}` : ''}`),
    simulateLogin: (payload: { token?: string; city?: string; country?: string; ip?: string; device?: string }) =>
      this.request<any>('/v1/core/auth/simulate-login', { method: 'POST', body: JSON.stringify(payload) }),
    simulateMfa: (role?: string, factor?: string) =>
      this.request<any>('/v1/core/auth/simulate-mfa', { method: 'POST', body: JSON.stringify({ role, factor }) }),
    trustLocation: (sub: string, city: string, country: string, ip: string) =>
      this.request<any>('/v1/core/auth/trust-location', { method: 'POST', body: JSON.stringify({ sub, city, country, ip }) }),
    blockSession: (sub: string, alertId: string) =>
      this.request<any>(`/v1/core/auth/block-session?sub=${encodeURIComponent(sub)}&alert_id=${encodeURIComponent(alertId)}`, { method: 'POST' }),
  };

  // 2. PARKIE
  public parkie = {
    getLots: (params?: { status_color?: string; min_available?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<any[]>(`/v1/m/parkie/lots${q ? `?${q}` : ''}`);
    },
    getLot: (id: string) => this.request<any>(`/v1/m/parkie/lots/${id}`),
    getLotColors: () => this.request<any[]>('/v1/m/parkie/lots/colors'),
    findNearest: (lat: number, lng: number, limit: number = 5) =>
      this.request<any[]>(`/v1/m/parkie/nearest?lat=${lat}&lng=${lng}&limit=${limit}`),
    getPlots: (lotId: string) => this.request<any>(`/v1/m/parkie/lots/${lotId}/plots`),
    updatePlots: (lotId: string, plotData: any) =>
      this.request(`/v1/m/parkie/lots/${lotId}/plots`, { method: 'PUT', body: JSON.stringify(plotData) }),
    updateDetections: (lotId: string, detectedCars: number) =>
      this.request('/v1/m/parkie/detections', { method: 'POST', body: JSON.stringify({ lot_id: lotId, detected_cars: detectedCars }) }),
    getHourlyAnalytics: (lotId?: string, hours: number = 24) => {
      const q = new URLSearchParams({ ...(lotId ? { lot_id: lotId } : {}), hours: String(hours) }).toString();
      return this.request<any[]>(`/v1/m/parkie/analytics/hourly?${q}`);
    },
    getStreamUrl: () => `${this.baseUrl}/v1/m/parkie/stream`,
  };

  // 3. UTILITIES (M04)
  public utilities = {
    getOutages: (params?: { provider?: string; status?: string; area?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<any[]>(`/v1/m/utilities/outages${q ? `?${q}` : ''}`);
    },
    checkAddress: (address: string) =>
      this.request<any>('/v1/m/utilities/check-address', { method: 'POST', body: JSON.stringify({ address }) }),
    createOutage: (payload: any) =>
      this.request('/v1/m/utilities/outages', { method: 'POST', body: JSON.stringify(payload) }),
  };

  // 4. TRANSIT (M05)
  public transit = {
    getLines: () => this.request<any[]>('/v1/m/transit/lines'),
    getDetours: () => this.request<any[]>('/v1/m/transit/detours'),
    checkStop: (stopName: string) =>
      this.request<any>('/v1/m/transit/check-stop', { method: 'POST', body: JSON.stringify({ stop_name: stopName }) }),
    createDetour: (payload: any) =>
      this.request('/v1/m/transit/detours', { method: 'POST', body: JSON.stringify(payload) }),
  };

  // 5. EVENTS (M01)
  public events = {
    list: (params?: { category?: string; neighbourhood?: string; ageGroup?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<{ events: any[] }>(`/v1/m/events${q ? `?${q}` : ''}`);
    },
    create: (payload: any) =>
      this.request<{ event: any }>('/v1/m/events', { method: 'POST', body: JSON.stringify(payload) }),
  };

  // 6. FORUM (M08)
  public forum = {
    listPosts: (params?: { category?: string; neighbourhood?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<{ posts: any[] }>(`/v1/m/forum${q ? `?${q}` : ''}`);
    },
    createPost: (payload: any) =>
      this.request<{ post: any }>('/v1/m/forum', { method: 'POST', body: JSON.stringify(payload) }),
  };

  // 7. BUDDY (M07)
  public buddy = {
    listRequests: (eventId?: string) =>
      this.request<{ buddyRequests: any[] }>(`/v1/m/buddy${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`),
    createRequest: (payload: any) =>
      this.request<{ buddyRequest: any }>('/v1/m/buddy', { method: 'POST', body: JSON.stringify(payload) }),
    findMatches: (eventId: string, interests: string[] = []) =>
      this.request<{ matches: any[] }>('/v1/m/buddy/match', { method: 'POST', body: JSON.stringify({ eventId, interests }) }),
  };

  // 8. SOLANA & WALLET (M09 / M01)
  public solana = {
    getStatus: () => this.request<any>('/v1/m/solana/status'),
    mintTicket: (payload: { eventId: string; eventTitle: string; attendeeName?: string; attendeeWallet?: string }) =>
      this.request<any>('/v1/m/solana/tickets/mint', { method: 'POST', body: JSON.stringify(payload) }),
    mintPoap: (payload: { eventId: string; eventTitle?: string; attendeeWallet?: string; ticketId?: string }) =>
      this.request<any>('/v1/m/solana/poap/mint', { method: 'POST', body: JSON.stringify(payload) }),
  };

  // 9. DASHBOARD (M12)
  public dashboard = {
    getOverview: () => this.request<any>('/v1/m/dashboard/overview'),
  };

  // 10. VISITOR INFO (M02)
  public visitorInfo = {
    list: (params?: { category?: string; lang?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<any>(`/v1/m/visitor-info${q ? `?${q}` : ''}`);
    },
    getCategories: () => this.request<{ categories: string[] }>('/v1/m/visitor-info/categories'),
    getEntry: (id: string, lang?: string) =>
      this.request<any>(`/v1/m/visitor-info/${id}${lang ? `?lang=${lang}` : ''}`),
  };

  // 11. URBAN SAFETY (M03)
  public safety = {
    getHealth: () => this.request<any>('/v1/m/safety/health'),
    listReports: (params?: { hours?: number; area?: string; type?: string; limit?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<any>(`/v1/m/safety/reports${q ? `?${q}` : ''}`);
    },
    submitReport: (payload: any) =>
      this.request<any>('/v1/m/safety/reports', { method: 'POST', body: JSON.stringify(payload) }),
  };

  // 12. SMELL (M06)
  public smell = {
    getHealth: () => this.request<any>('/v1/m/smell/health'),
    getPins: (hours: number = 24) => this.request<any>(`/v1/m/smell/pins?hours=${hours}`),
    getAreas: (hours: number = 24) => this.request<any>(`/v1/m/smell/areas?hours=${hours}`),
    getTimeseries: (hours: number = 48) => this.request<any>(`/v1/m/smell/timeseries?hours=${hours}`),
    submitReport: (payload: any) =>
      this.request<any>('/v1/m/smell/reports', { method: 'POST', body: JSON.stringify(payload) }),
  };

  // 13. ASSISTANT (M10)
  public assistant = {
    chat: (input: { message: string; history?: any[]; context?: any }) =>
      this.request<any>('/v1/m/assistant/chat', { method: 'POST', body: JSON.stringify(input) }),
    getTools: () => this.request<any>('/v1/m/assistant/tools'),
    getVoiceStatus: () => this.request<any>('/v1/m/assistant/voice'),
  };

  // 14. FEEDBACK (M11)
  public feedback = {
    submitInApp: (payload: any) =>
      this.request<any>('/v1/m/feedback', { method: 'POST', body: JSON.stringify(payload) }),
    ingestSurvey: (payload: any, ingestToken?: string) =>
      this.request<any>('/v1/m/feedback/ingest', {
        method: 'POST',
        headers: ingestToken ? { 'X-Ingest-Token': ingestToken } : {},
        body: JSON.stringify(payload),
      }),
  };
}

export const hubApi = new HubApiClient({
  baseUrl: typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL 
    ? process.env.EXPO_PUBLIC_API_URL 
    : 'http://localhost:8000'
});
