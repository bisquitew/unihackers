import { fetchAuthMe } from './api.js';

let currentToken = localStorage.getItem('hub_auth_token') || 'dev_resident';
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

export function hasMfa() {
  return currentUser?.security_tier === 'tier_2_mfa_verified';
}

export async function switchToken(token) {
  currentToken = token;
  localStorage.setItem('hub_auth_token', token);
  currentUser = await fetchAuthMe(token);
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
