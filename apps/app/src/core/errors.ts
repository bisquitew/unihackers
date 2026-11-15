// What to tell a person when something fails. Raw error text ("Network request failed", "HTTP 502", a stack message) never reaches
// the screen: every failure becomes one plain sentence that says what to do. The server's own words are kept only when it
// answered 400, 404 or 409 with a short sentence meant for people (for example "That ticket is not in your wallet").
import { ApiError } from '@hub/api-client';

export const ERR = {
  offline: 'No connection. Check your internet and try again.',
  signIn: 'Please sign in again.',
  forbidden: 'You do not have access to this.',
  notFound: 'We could not find that.',
  busy: 'Too many tries. Wait a moment and try again.',
  server: 'Something went wrong on our side. Try again in a moment.',
  generic: 'Something went wrong. Try again.',
} as const;

const isPeopleText = (s: string) => s.length > 0 && s.length <= 140 && !/^HTTP \d+|^TypeError|^Network|undefined|\bat\b .*\(.*:\d+/.test(s);

/** `fallback` is the sentence for this screen ("Could not send. Try again.") when nothing more specific applies. */
export function friendlyError(error: unknown, fallback: string = ERR.generic): string {
  if (error instanceof ApiError) {
    if (error.offline) return ERR.offline;
    if (error.status === 401) return ERR.signIn;
    if (error.status === 403) return ERR.forbidden;
    if (error.status === 429) return ERR.busy;
    if (error.status >= 500) return ERR.server;
    if ((error.status === 400 || error.status === 404 || error.status === 409) && isPeopleText(error.message)) return error.message;
    if (error.status === 404) return ERR.notFound;
    return fallback;
  }
  if (error instanceof TypeError || (error instanceof Error && /network|fetch|timeout|abort/i.test(error.message))) return ERR.offline;
  return fallback;
}
