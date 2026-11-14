// The app's one way to reach the API: where it is, who is asking, and the shared client built on both.
import { NativeModules, Platform } from 'react-native';
import { createApiClient } from '@hub/api-client';

/**
 * Where the API is.
 *  1. EXPO_PUBLIC_API_URL when set (a deployed API, or a LAN address).
 *  2. On the web: the same machine as the page, port 8000.
 *  3. On a phone in development: the dev server's own address plus /api. Metro forwards /api to the API (see
 *     apps/app/metro.config.js), so it works over a tunnel or Wi-Fi without exposing the API separately.
 */
export function apiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (Platform.OS === 'web') {
    // the web build also renders pages on the server first, where there is no window: use localhost there
    if (typeof window === 'undefined' || !window.location) return 'http://localhost:8000';
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8000`;
  }
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  const origin = scriptURL?.match(/^(https?:\/\/[^/]+)/)?.[1];
  return `${origin ?? 'http://localhost:8081'}/api`;
}

// The session token, kept here (not in React state) so any module can attach it without being a component.
let sessionToken: string | null = null;
export const setSessionToken = (token: string | null) => {
  sessionToken = token;
};
export const getSessionToken = () => sessionToken;

export const api = createApiClient({ baseUrl: apiBaseUrl, client: 'app', getToken: () => sessionToken });
