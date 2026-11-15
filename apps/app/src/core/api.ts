// The app's one way to reach the API: where it is, who is asking, and the shared client built on both.
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
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
  return `${devServerOrigin() ?? 'http://localhost:8081'}/api`;
}

/** Which source gave the dev server's address, for the Connection row in Settings. */
export let apiBaseSource = 'default';

/**
 * The address the app was loaded from (the Expo dev server, over Wi-Fi or a tunnel). Several places know it, and which one
 * answers depends on the React Native architecture, so they are tried in turn:
 *  1. the script address, read the way React Native itself reads it (`getConstants()`; the old `.scriptURL` property
 *     does not exist with the new architecture, which is why the app used to fall back to localhost on a phone);
 *  2. the same value on the legacy module object;
 *  3. the host Expo Go reports (`hostUri`), which is the tunnel or LAN address.
 */
function devServerOrigin(): string | null {
  const fromUrl = (value: unknown): string | null => (typeof value === 'string' ? value.match(/^(https?:\/\/[^/]+)/)?.[1] ?? null : null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const native = require('react-native/Libraries/NativeModules/specs/NativeSourceCode').default;
    const url = fromUrl(native?.getConstants?.()?.scriptURL);
    if (url) {
      apiBaseSource = 'script address';
      return url;
    }
  } catch {
    /* not available in this build */
  }
  const legacy: any = NativeModules?.SourceCode;
  const legacyUrl = fromUrl(legacy?.scriptURL ?? legacy?.getConstants?.()?.scriptURL);
  if (legacyUrl) {
    apiBaseSource = 'script address (legacy)';
    return legacyUrl;
  }
  const host: string | undefined = Constants.expoConfig?.hostUri ?? (Constants as any).expoGoConfig?.debuggerHost;
  if (host) {
    const clean = host.replace(/^[a-z]+:\/\//, '').replace(/\/.*$/, '');
    // a tunnel (*.expo.app, *.exp.direct) is served over https, a LAN address over plain http
    const secure = /\.(expo\.app|exp\.direct)(:\d+)?$/.test(clean) || /:443$/.test(clean);
    apiBaseSource = 'Expo host';
    return `${secure ? 'https' : 'http'}://${clean.replace(/:443$/, '')}`;
  }
  return null;
}

// The session token, kept here (not in React state) so any module can attach it without being a component.
let sessionToken: string | null = null;
const sessionListeners = new Set<(token: string | null) => void>();
export const setSessionToken = (token: string | null) => {
  if (token === sessionToken) return;
  sessionToken = token;
  sessionListeners.forEach((fn) => fn(token));
};
/** Called whenever someone signs in or out (e.g. to load their wallet). Returns an unsubscribe. */
export const onSessionToken = (fn: (token: string | null) => void) => {
  sessionListeners.add(fn);
  return () => sessionListeners.delete(fn);
};
export const getSessionToken = () => sessionToken;

export const api = createApiClient({ baseUrl: apiBaseUrl, client: 'app', getToken: () => sessionToken });
