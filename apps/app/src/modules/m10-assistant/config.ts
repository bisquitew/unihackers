/**
 * Where the app finds the API. Set EXPO_PUBLIC_API_URL (e.g. in apps/app/.env) to
 * http://<laptop-LAN-IP>:3001 when testing on a phone; "localhost" only works on web/simulator.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
