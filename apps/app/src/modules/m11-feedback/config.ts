/**
 * Where the app finds the API. Nothing else in the app defines this yet, so it lives here.
 * Set EXPO_PUBLIC_API_URL (e.g. in apps/app/.env) to http://<laptop-LAN-IP>:3001 when testing
 * on a phone; "localhost" only works in the web build or a simulator on the same machine.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

/** Google Form link for the Living Labs survey. Fill in once the form is published. */
export const SURVEY_URL = '';

/** Used only if the changelog can't be loaded. */
export const FALLBACK_APP_VERSION = 'v0';
