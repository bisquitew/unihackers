// HubApiClient: every module of the hop API as named methods, built on the shared client (index.ts).
//   const hub = new HubApiClient({ baseUrl: 'http://localhost:8000' });
//   const { token } = await hub.auth.login('resident@example.com');   // demo sign-in
//   hub.setAuthToken(token);
//   const { events } = await hub.events.list();
// Return types are loose on purpose (the API is the source of truth); add precise types as screens need them.
import { createApiClient, type ApiClient, type ClientKind } from './client.ts';

export interface HubApiClientOptions {
  baseUrl: string;
  client?: ClientKind;
  token?: string | null;
}

type Json = Record<string, any>;

export class HubApiClient {
  private token: string | null;
  readonly http: ApiClient;

  constructor(options: HubApiClientOptions) {
    this.token = options.token ?? null;
    this.http = createApiClient({ baseUrl: () => options.baseUrl, client: options.client ?? 'web', getToken: () => this.token });
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  core = {
    getHealth: () => this.http.get<Json>('/health'),
    getAreas: () => this.http.get<any[]>('/v1/core/areas'),
    getHeatmap: () => this.http.get<Json>('/v1/core/analytics/heatmap'),
    getFlags: () => this.http.get<Json>('/v1/core/flags'),
    /** Place name or address to coordinates (signed-in only). */
    geocode: (q: string) => this.http.get<{ found: boolean; latitude?: number; longitude?: number; displayName?: string }>('/v1/core/geocode', { q }),
  };

  auth = {
    /** The demo sign-in (DEMO_AUTH). The server decides the role from the email. */
    login: (email: string) => this.http.post<{ token: string; user: Json }>('/v1/core/auth/login', { email }),
    googleLogin: (email: string, name?: string) => this.http.post<{ token: string; user: Json }>('/v1/core/auth/google-login', { email, name }),
    getMe: () => this.http.get<Json>('/v1/core/auth/me'),
  };

  events = {
    list: (filters: { category?: string; neighbourhood?: string; ageGroup?: string; search?: string } = {}) => this.http.get<{ events: any[] }>('/v1/m/events', filters),
    get: (id: string) => this.http.get<{ event: any }>(`/v1/m/events/${encodeURIComponent(id)}`),
    create: (event: Json) => this.http.post<{ event: any }>('/v1/m/events', event),
    rsvp: (id: string, body: { userName: string; lookingForBuddy?: boolean; userWallet?: string }) => this.http.post<{ rsvp: any }>(`/v1/m/events/${encodeURIComponent(id)}/rsvp`, body),
  };

  visitorInfo = {
    getCategories: () => this.http.get<{ categories: any[] }>('/v1/m/visitor-info/categories'),
    list: (query: Record<string, string> = {}) => this.http.get<Json>('/v1/m/visitor-info', query),
    get: (id: string) => this.http.get<Json>(`/v1/m/visitor-info/${encodeURIComponent(id)}`),
  };

  safety = {
    getHealth: () => this.http.get<Json>('/v1/m/safety/health'),
    listReports: () => this.http.get<Json>('/v1/m/safety/reports'),
    report: (body: Json) => this.http.post<Json>('/v1/m/safety/reports', body),
    getSummary: () => this.http.get<Json>('/v1/m/safety/summary'),
  };

  utilities = {
    getOutages: () => this.http.get<any[]>('/v1/m/utilities/outages'),
    checkAddress: (address: string) => this.http.post<Json>('/v1/m/utilities/check-address', { address }),
    /** Staff only, with the second check (MFA). */
    createOutage: (outage: Json) => this.http.post<Json>('/v1/m/utilities/outages', outage),
  };

  transit = {
    getLines: () => this.http.get<any[]>('/v1/m/transit/lines'),
    getDetours: () => this.http.get<any[]>('/v1/m/transit/detours'),
    checkStop: (stopName: string) => this.http.post<Json>('/v1/m/transit/check-stop', { stopName }),
  };

  areaAlerts = {
    list: (filters: { type?: string; status?: string; neighbourhood?: string } = {}) => this.http.get<any[]>('/v1/core/area-alerts', filters),
    checkProximity: (where: { latitude?: number; longitude?: number; address?: string; neighbourhood?: string }) => this.http.post<Json>('/v1/core/area-alerts/check-proximity', where),
  };

  smell = {
    getPins: (hours = 24) => this.http.get<Json>('/v1/m/smell/pins', { hours }),
    getAreas: (hours = 24) => this.http.get<Json>('/v1/m/smell/areas', { hours }),
    report: (body: Json) => this.http.post<Json>('/v1/m/smell/reports', body),
  };

  buddy = {
    listRequests: (eventId?: string) => this.http.get<{ buddyRequests: any[] }>('/v1/m/buddy', { eventId }),
    createRequest: (body: Json) => this.http.post<{ buddyRequest: any }>('/v1/m/buddy', body),
    findMatches: (eventId: string, interests: string[]) => this.http.post<{ matches: any[] }>('/v1/m/buddy/match', { eventId, interests }),
  };

  forum = {
    listPosts: (filters: { category?: string; neighbourhood?: string } = {}) => this.http.get<{ posts: any[] }>('/v1/m/forum', filters),
    createPost: (body: Json) => this.http.post<{ post: any }>('/v1/m/forum', body),
    comment: (postId: string, content: string) => this.http.post<{ comment: any }>(`/v1/m/forum/${encodeURIComponent(postId)}/comments`, { content }),
    upvote: (postId: string) => this.http.post<{ upvotes: number; upvoted: boolean }>(`/v1/m/forum/${encodeURIComponent(postId)}/upvote`),
    report: (postId: string, reason = 'inappropriate') => this.http.post<Json>(`/v1/m/forum/${encodeURIComponent(postId)}/report`, { reason }),
  };

  solana = {
    getStatus: () => this.http.get<Json>('/v1/m/solana/status'),
    mintTicket: (body: { eventId: string; eventTitle: string; attendeeName?: string; attendeeWallet?: string }) => this.http.post<Json>('/v1/m/solana/tickets/mint', body),
    mintPoap: (body: Json) => this.http.post<Json>('/v1/m/solana/poap/mint', body),
  };

  assistant = {
    chat: (message: string, history: { role: 'user' | 'model'; text: string }[] = []) => this.http.post<{ reply: string; toolsUsed?: any[] }>('/v1/m/assistant/chat', { message, history }),
    getTools: () => this.http.get<{ count: number; tools: any[] }>('/v1/m/assistant/tools'),
    getVoiceStatus: () => this.http.get<{ available: boolean }>('/v1/m/assistant/voice'),
    getTour: () => this.http.get<Json>('/v1/m/assistant/tour'),
  };

  feedback = {
    submitInApp: (body: { rating: number; text?: string; appVersion: string; moduleId?: string | null }) => this.http.post<{ feedback?: { id: string } }>('/v1/m/feedback', body),
    getSummary: () => this.http.get<Json>('/v1/m/feedback/summary'),
    getChangelog: () => this.http.get<any[]>('/v1/m/feedback/changelog'),
  };

  dashboard = {
    getOverview: () => this.http.get<Json>('/v1/m/dashboard/overview'),
  };

  parkie = {
    getLots: () => this.http.get<any[]>('/v1/m/parkie/lots'),
    findNearest: (latitude: number, longitude: number, limit = 5) => this.http.get<any[]>('/v1/m/parkie/nearest', { lat: latitude, lng: longitude, limit }),
  };
}
