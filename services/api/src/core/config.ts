// Runtime switches shared by the API.
//
// DEMO_AUTH: the hackathon demo sign-in (dev tokens like `dev_admin_mfa`, the simulated Google/email login, the
// simulate-* endpoints). It is ON by default for local work and OFF when NODE_ENV=production, where only real Auth0
// tokens are accepted. Force it with DEMO_AUTH=1 or DEMO_AUTH=0.
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const DEMO_AUTH = process.env.DEMO_AUTH !== undefined ? process.env.DEMO_AUTH !== '0' && process.env.DEMO_AUTH !== 'false' : !IS_PRODUCTION;

/** Staff accounts: the demo treats the city's mail domain as staff; with real Auth0 the role comes from the token instead. */
const STAFF_DOMAIN = '@timisoara-hub.ro';
const STAFF_EMAILS = (process.env.STAFF_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
export const isStaffEmail = (email: string): boolean => {
  const e = String(email || '').trim().toLowerCase();
  if (e.startsWith('resident') || e.includes('citizen') || e.startsWith('student')) return false;
  return STAFF_EMAILS.includes(e) || (DEMO_AUTH && (e.includes('admin') || e.includes('staff') || e.includes('primaria')));
};

/** An error that carries the HTTP status to answer with. */
export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message?: string) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}
