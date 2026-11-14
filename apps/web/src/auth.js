import { fetchAuthMe, loginWithGoogle } from './api.js';

// no saved sign-in means a guest: the website then shows the public preview
let currentToken = localStorage.getItem('hub_auth_token') || '';
let currentUser = null;
const listeners = new Set();

export async function initAuth() {
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

export function isLoggedIn() {
  return Boolean(currentToken && currentUser && currentUser.sub !== 'guest|unauthenticated');
}

export function hasMfa() {
  return currentUser?.security_tier === 'tier_2_mfa_verified';
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

export async function loginGoogleUser({ email, name, role } = {}) {
  const result = await loginWithGoogle({ email, name, role });
  currentToken = result.token;
  currentUser = result.user;
  localStorage.setItem('hub_auth_token', result.token);
  notifyListeners();
  return currentUser;
}

export async function logout() {
  currentToken = '';
  localStorage.removeItem('hub_auth_token');
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
