import { fetchAuthMe, loginWithGoogle, loginWithEmail, registerUser, fetchAuth0Info } from './api.js';

// no saved sign-in means a guest: the website then shows the public preview
let currentToken = localStorage.getItem('hub_auth_token') || '';
let currentUser = null;
const listeners = new Set();
let auth0ClientInstance = null;

export const AUTH0_DOMAIN = 'dev-77qb7o5o5lzcrtxa.us.auth0.com';
export const AUTH0_CLIENT_ID = 'nX2Hf4pmmdeTk73ydXFmg2S632Bh966D';
export const AUTH0_AUDIENCE = 'https://api.timisoara-hub.ro';

export async function getAuth0Client() {
  if (auth0ClientInstance) return auth0ClientInstance;
  const createClient = window.auth0?.createAuth0Client || window.createAuth0Client;
  if (!createClient) return null;

  try {
    const domain = AUTH0_DOMAIN;
    const clientId = AUTH0_CLIENT_ID;
    const audience = AUTH0_AUDIENCE;

    console.log('[Auth0 V5] Initializing client with:', { domain, clientId, audience, origin: window.location.origin });

    auth0ClientInstance = await createClient({
      domain,
      clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience,
        scope: 'openid profile email'
      },
      cacheLocation: 'memory'
    });
    return auth0ClientInstance;
  } catch (err) {
    console.warn('[Auth0] Could not initialize Auth0 client:', err);
    return null;
  }
}

export async function initAuth() {
  // Check if returning from an Auth0 redirect
  try {
    const client = await getAuth0Client();
    if (client) {
      if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
        await client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
        const token = await client.getTokenSilently().catch(() => null);
        if (token) {
          await switchToken(token);
          return;
        }
      } else if (await client.isAuthenticated().catch(() => false)) {
        const token = await client.getTokenSilently().catch(() => null);
        if (token) {
          await switchToken(token);
          return;
        }
      }
    }
  } catch (err) {
    console.warn('[Auth0] Redirect handling skipped:', err);
  }

  await switchToken(currentToken);
}

export function getCurrentToken() {
  return currentToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function isAdmin() {
  return currentUser?.role === 'admin';
}

export function isResident() {
  return currentUser?.role === 'resident';
}

export function isLoggedIn() {
  return Boolean(currentToken && currentUser && currentUser.sub !== 'guest|unauthenticated');
}

export function hasMfa() {
  return currentUser?.security_tier === 'tier_2_mfa_verified' || currentUser?.mfa_verified;
}

export function getAccountTypeLabel(user = currentUser) {
  if (!user || user.sub === 'guest|unauthenticated') return 'Vizitator Anonim';
  if (user.role === 'admin') return 'Administrator Municipal';
  if (user.role === 'moderator') return 'Moderator Forum';
  return 'Cetățean Rezident';
}

export async function switchToken(token) {
  currentToken = token || '';
  if (token) {
    localStorage.setItem('hub_auth_token', token);
  } else {
    localStorage.removeItem('hub_auth_token');
  }
  currentUser = await fetchAuthMe(token);
  notifyListeners();
  return currentUser;
}

export async function loginWithAuth0(options = {}) {
  const client = await getAuth0Client();
  if (!client) {
    throw new Error('Auth0 SDK is not available or blocked by browser.');
  }

  try {
    // Try popup login first for smooth in-page UX
    await client.loginWithPopup(options);
    const token = await client.getTokenSilently();
    await switchToken(token);
    return currentUser;
  } catch (err) {
    // If popup blocked by browser or closed, and redirect is requested/needed:
    if (options.useRedirect || err.message?.includes('popup')) {
      console.log('[Auth0] Switching to loginWithRedirect...');
      await client.loginWithRedirect(options);
      return null;
    }
    throw err;
  }
}

export async function loginGoogleUser({ email, name } = {}) {
  // Try real Auth0 Google connection first if client is available
  try {
    const client = await getAuth0Client();
    if (client) {
      await client.loginWithPopup({
        authorizationParams: {
          connection: 'google-oauth2'
        }
      });
      const token = await client.getTokenSilently();
      if (token) {
        await switchToken(token);
        return currentUser;
      }
    }
  } catch (err) {
    console.warn('[Auth0] Google popup login failed or cancelled; falling back to demo login:', err);
  }

  // Fallback to local Google demo login
  const result = await loginWithGoogle({ email, name });
  currentToken = result.token;
  currentUser = result.user;
  localStorage.setItem('hub_auth_token', result.token);
  notifyListeners();
  return currentUser;
}

export async function loginEmailUser({ email, password, token } = {}) {
  const result = await loginWithEmail({ email, password, token });
  currentToken = result.token;
  currentUser = result.user;
  localStorage.setItem('hub_auth_token', result.token);
  notifyListeners();
  return currentUser;
}

export async function registerAccount({ name, email, password, neighbourhood } = {}) {
  const result = await registerUser({ name, email, password, neighbourhood });
  currentToken = result.token;
  currentUser = result.user;
  localStorage.setItem('hub_auth_token', result.token);
  notifyListeners();
  return currentUser;
}

export async function logout() {
  currentToken = '';
  localStorage.removeItem('hub_auth_token');
  try {
    const client = await getAuth0Client();
    if (client && await client.isAuthenticated().catch(() => false)) {
      await client.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    }
  } catch (e) {
    console.warn('[Auth0] Logout notice:', e);
  }
  currentUser = await fetchAuthMe('');
  notifyListeners();
  return currentUser;
}

export function onAuthChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener(currentUser, currentToken);
    } catch (err) {
      console.error('[Auth] Error in listener:', err);
    }
  }
}
