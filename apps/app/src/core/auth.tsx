import React, { createContext, useContext, useState, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '@hub/api-client';
import { api, setSessionToken, devServerOrigin } from './api';
import type { UserRole, AuthUser as ContractAuthUser, SecurityTier } from '@hub/contracts';

export interface AuthUser {
  id: string;
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  mfa_enabled: boolean;
  mfa_verified: boolean;
  amr: string[];
  idp: string;
  security_tier: SecurityTier;
  neighbourhood?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isResident: boolean;
  login: (tokenOrRole?: string) => Promise<void>;
  loginAsResident: () => Promise<void>;
  /** Signs in through the API. Resolves with an error message when refused. */
  signIn: (method: 'google' | 'email', email?: string, password?: string) => Promise<{ ok: boolean; error?: string }>;
  /** Signs in through real Auth0 Universal Login (Google, Email, Passkey). */
  loginWithAuth0: () => Promise<{ ok: boolean; error?: string }>;
  /** Direct login with an already acquired Auth0 token (e.g. from in-app WebView). */
  loginWithToken: (token: string, hint?: { name?: string; email?: string; picture?: string }) => Promise<{ ok: boolean; error?: string }>;
  /** Registers a new resident account in the database through the API. */
  register: (data: { name: string; email: string; password?: string; neighbourhood?: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  /** Set when a sign-in is refused. Cleared by the next attempt or `clearAuthError`. */
  authError: string | null;
  clearAuthError: () => void;
}

/** Staff sign in only on the web dashboard; the mobile app is strictly for residents. */
export const STAFF_ROLES = ['admin', 'moderator'];
export const STAFF_MESSAGE = 'This account cannot sign in to the mobile app.';

const STORAGE_KEY = '@hub_auth_token';

export const USER_RESIDENT: AuthUser = {
  id: '5121dd56-e1cc-42af-bd8e-5fe8c5126502',
  sub: 'auth0|dev-resident-01',
  email: 'resident@timisoara-hub.ro',
  name: 'Andrei Timișan',
  role: 'resident',
  neighbourhood: 'Cetate',
  permissions: ['read:city-alerts', 'read:parking', 'read:transit', 'create:reports', 'rsvp:events'],
  mfa_enabled: false,
  mfa_verified: false,
  amr: ['email-passwordless'],
  idp: 'email-passwordless',
  security_tier: 'tier_1_standard'
};

export const TOKEN_PROFILES: Record<string, { user: AuthUser; token: string }> = {
  dev_resident: {
    user: USER_RESIDENT,
    token: 'dev_resident'
  },
  dev_organizer: {
    user: {
      id: 'usr-organizer-01',
      sub: 'auth0|dev-org-01',
      email: 'organizer@timisoara-hub.ro',
      name: 'Ioana Popa',
      role: 'organizer',
      neighbourhood: 'Fabric',
      permissions: ['read:city-alerts', 'create:events', 'manage:tickets', 'rsvp:events'],
      mfa_enabled: false,
      mfa_verified: false,
      amr: ['google-oauth2'],
      idp: 'google-oauth2',
      security_tier: 'tier_1_standard'
    },
    token: 'dev_organizer'
  }
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoggedIn: false,
  isAdmin: false,
  isResident: false,
  login: async () => {},
  loginAsResident: async () => {},
  signIn: async () => ({ ok: false }),
  loginWithAuth0: async () => ({ ok: false }),
  loginWithToken: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: () => {},
  isLoading: true,
  authError: null,
  clearAuthError: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Restore saved authentication token on app mount or capture deep link redirect
  useEffect(() => {
    let mounted = true;

    const handleAuthUrl = async (url: string) => {
      if (!url || (!url.includes('access_token=') && !url.includes('id_token='))) return false;
      const hash = url.split('#')[1] || url.split('?')[1] || '';
      const params = new URLSearchParams(hash);
      const token = params.get('id_token') || params.get('access_token');
      if (token) {
        setSessionToken(token);
        try {
          const me = await api.get<any>('/v1/core/auth/me');
          if (me?.sub && me.sub !== 'guest|unauthenticated' && !STAFF_ROLES.includes(me.role)) {
            if (mounted) {
              setUser({ ...me, id: me.id ?? me.sub });
              setToken(token);
              await AsyncStorage.setItem(STORAGE_KEY, token);
              setIsLoading(false);
            }
            return true;
          }
        } catch (e) {
          console.warn('Failed to resolve user from auth redirect token:', e);
          setSessionToken(null);
        }
      }
      return false;
    };

    async function restoreSession() {
      try {
        // 1. Web hash check if redirected
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
          const handled = await handleAuthUrl(window.location.href);
          if (handled) {
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        }

        // 2. Native deep link check
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && (initialUrl.includes('access_token=') || initialUrl.includes('id_token='))) {
          const handled = await handleAuthUrl(initialUrl);
          if (handled) return;
        }

        // 3. Saved token restore
        const savedToken = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && savedToken) {
          setSessionToken(savedToken);
          try {
            const me = await api.get<any>('/v1/core/auth/me');
            if (me?.sub && me.sub !== 'guest|unauthenticated' && !STAFF_ROLES.includes(me.role)) {
              setUser({ ...me, id: me.id ?? me.sub });
              setToken(savedToken);
            } else {
              setSessionToken(null);
            }
          } catch (err) {
            const profile = TOKEN_PROFILES[savedToken];
            if (err instanceof ApiError && err.offline && profile && !STAFF_ROLES.includes(profile.user.role)) {
              setUser(profile.user);
              setToken(profile.token);
            } else {
              setSessionToken(null);
            }
          }
        }
      } catch (err) {
        console.warn('Could not restore auth token from storage:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    const sub = Linking.addEventListener('url', ({ url }) => {
      handleAuthUrl(url);
    });

    restoreSession();
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const login = async (tokenOrRole: string = 'dev_resident') => {
    setIsLoading(true);

    const key = TOKEN_PROFILES[tokenOrRole]
      ? tokenOrRole
      : (`dev_${tokenOrRole}_mfa` in TOKEN_PROFILES ? `dev_${tokenOrRole}_mfa` : `dev_${tokenOrRole}`);
    
    const selected = TOKEN_PROFILES[key] || TOKEN_PROFILES.dev_resident;

    if (STAFF_ROLES.includes(selected.user.role)) {
      setAuthError(STAFF_MESSAGE);
      setIsLoading(false);
      return;
    }
    setAuthError(null);
    setSessionToken(selected.token);
    setUser(selected.user);
    setToken(selected.token);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, selected.token);
    } catch {}
    setIsLoading(false);
  };

  const signIn = async (method: 'google' | 'email', email?: string, password?: string): Promise<{ ok: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const path = method === 'google' ? '/v1/core/auth/google-login' : '/v1/core/auth/login';
      const result = await api.post<{ token: string; user: any }>(
        path,
        method === 'google'
          ? { email: email || 'alex.popescu@gmail.com', name: 'Alex Popescu' }
          : { email, password }
      );
      if (STAFF_ROLES.includes(result.user?.role)) {
        setAuthError(STAFF_MESSAGE);
        return { ok: false, error: STAFF_MESSAGE };
      }
      setSessionToken(result.token);
      setUser({ ...result.user, id: result.user.id ?? result.user.sub });
      setToken(result.token);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, result.token);
      } catch {}
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError && err.offline) {
        // the demo still opens without the server: a local resident profile, whose token the API accepts once it is back
        await login('dev_resident');
        return { ok: true };
      }
      const message = err instanceof ApiError && err.code === 'use_web_dashboard' ? STAFF_MESSAGE : err instanceof Error ? err.message : 'Could not sign in.';
      setAuthError(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password?: string; neighbourhood?: string }): Promise<{ ok: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await api.post<{ token: string; user: any }>('/v1/core/auth/register', data);
      if (STAFF_ROLES.includes(result.user?.role)) {
        setAuthError(STAFF_MESSAGE);
        return { ok: false, error: STAFF_MESSAGE };
      }
      setSessionToken(result.token);
      setUser({ ...result.user, id: result.user.id ?? result.user.sub });
      setToken(result.token);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, result.token);
      } catch {}
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      setAuthError(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithAuth0 = async (): Promise<{ ok: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const domain = 'dev-77qb7o5o5lzcrtxa.us.auth0.com';
      const clientId = 'nX2Hf4pmmdeTk73ydXFmg2S632Bh966D';
      const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
      let redirectUri: string;
      if (isWeb) {
        redirectUri = window.location.origin;
      } else {
        const origin = devServerOrigin();
        redirectUri = origin || 'http://10.109.24.138:8081';
      }
      const nonce = Math.random().toString(36).substring(2, 15);
      const state = Math.random().toString(36).substring(2, 15);

      const authUrl = `https://${domain}/authorize?client_id=${clientId}&response_type=token%20id_token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&state=${state}&nonce=${nonce}`;

      if (isWeb) {
        const width = 500;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          authUrl,
          'auth0_login_popup',
          `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0`
        );

        if (!popup) {
          window.location.href = authUrl;
          return { ok: true };
        }

        const auth0Token = await new Promise<string>((resolve, reject) => {
          let resolved = false;
          const timer = setInterval(() => {
            try {
              if (!popup || popup.closed) {
                clearInterval(timer);
                if (!resolved) reject(new Error('Auth0 login window was closed.'));
                return;
              }

              const currentUrl = popup.location.href;
              if (currentUrl && (currentUrl.includes('access_token=') || currentUrl.includes('id_token=') || currentUrl.includes('error='))) {
                clearInterval(timer);
                resolved = true;
                popup.close();

                const hash = currentUrl.split('#')[1] || '';
                const params = new URLSearchParams(hash || currentUrl.split('?')[1]);
                const error = params.get('error_description') || params.get('error');
                if (error) {
                  reject(new Error(error));
                  return;
                }

                const idToken = params.get('id_token');
                const accessToken = params.get('access_token');
                const token = idToken || accessToken;
                if (token) {
                  resolve(token);
                } else {
                  reject(new Error('No token returned from Auth0.'));
                }
              }
            } catch {
              // Cross-origin access expected while on dev-77qb7o5o5lzcrtxa.us.auth0.com
            }
          }, 350);
        });

        setSessionToken(auth0Token);
        const me = await api.get<any>('/v1/core/auth/me');
        if (me && me.sub && me.sub !== 'guest|unauthenticated') {
          if (STAFF_ROLES.includes(me.role)) {
            setSessionToken(null);
            setAuthError(STAFF_MESSAGE);
            return { ok: false, error: STAFF_MESSAGE };
          }
          setUser({ ...me, id: me.id ?? me.sub });
          setToken(auth0Token);
          try {
            await AsyncStorage.setItem(STORAGE_KEY, auth0Token);
          } catch {}
          return { ok: true };
        }
        throw new Error('Could not verify Auth0 identity.');
      } else {
        await Linking.openURL(authUrl);
        return { ok: true };
      }
    } catch (err: any) {
      const msg = err.message || 'Auth0 login failed.';
      setAuthError(msg);
      return { ok: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithToken = async (
    authToken: string,
    userHint?: { name?: string; email?: string; picture?: string }
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      setSessionToken(authToken);
      const me = await api.get<any>('/v1/core/auth/me');
      if (me && me.sub && me.sub !== 'guest|unauthenticated') {
        if (STAFF_ROLES.includes(me.role)) {
          setSessionToken(null);
          setAuthError(STAFF_MESSAGE);
          return { ok: false, error: STAFF_MESSAGE };
        }
        const resolvedName = (userHint?.name && (!me.name || me.name.startsWith('Auth0'))) 
          ? userHint.name 
          : me.name;
        const resolvedEmail = (userHint?.email && (!me.email || !me.email.includes('@'))) 
          ? userHint.email 
          : me.email;
        const resolvedPicture = userHint?.picture || me.picture;

        setUser({ ...me, id: me.id ?? me.sub, name: resolvedName, email: resolvedEmail, picture: resolvedPicture });
        setToken(authToken);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, authToken);
        } catch {}

        // Sync Google profile with backend
        if (userHint && (userHint.name || userHint.email)) {
          api.post('/v1/core/auth/sync-profile', {
            name: resolvedName,
            email: resolvedEmail,
            picture: resolvedPicture
          }).catch(() => {});
        }

        return { ok: true };
      }
      throw new Error('Could not verify Auth0 identity.');
    } catch (err: any) {
      setSessionToken(null);
      const msg = err.message || 'Auth0 token verification failed.';
      setAuthError(msg);
      return { ok: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsResident = async () => {
    await login('dev_resident');
  };

  const logout = () => {
    setSessionToken(null);
    setUser(null);
    setToken(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  };

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === 'admin';
  const isResident = user?.role === 'resident';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        isAdmin,
        isResident,
        login,
        loginAsResident,
        signIn,
        loginWithAuth0,
        loginWithToken,
        register,
        logout,
        isLoading,
        authError,
        clearAuthError: () => setAuthError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
