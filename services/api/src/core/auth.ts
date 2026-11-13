import { Context, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { UserRole } from '@hub/contracts';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'timisoara-hub.eu.auth0.com';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://api.timisoara-hub.ro';

const JWKS = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));

export interface AuthContextUser {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

// Dev mock users for zero-blocking development
const DEV_USERS: Record<string, AuthContextUser> = {
  dev_resident: {
    sub: 'auth0|dev-resident-01',
    email: 'resident@timisoara-hub.ro',
    role: 'resident',
    name: 'Andrei Timișan'
  },
  dev_admin: {
    sub: 'auth0|dev-admin-01',
    email: 'admin@timisoara-hub.ro',
    role: 'admin',
    name: 'Admin Primăria TM'
  },
  dev_moderator: {
    sub: 'auth0|dev-mod-01',
    email: 'moderator@timisoara-hub.ro',
    role: 'moderator',
    name: 'Moderator Comunitar'
  },
  dev_organizer: {
    sub: 'auth0|dev-org-01',
    email: 'organizer@timisoara-hub.ro',
    role: 'organizer',
    name: 'Organizator Evenimente'
  }
};

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Guest access or proceed without user
    return next();
  }

  const token = authHeader.replace('Bearer ', '').trim();

  // 1. Dev token check (allows team to work offline / without Auth0 keys configured)
  if (DEV_USERS[token]) {
    c.set('user', DEV_USERS[token]);
    return next();
  }

  // 2. Real Auth0 JWT Verification
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${AUTH0_DOMAIN}/`,
      audience: AUTH0_AUDIENCE
    });

    const user: AuthContextUser = {
      sub: payload.sub as string,
      email: (payload['https://timisoara-hub.ro/email'] as string) || (payload.email as string) || '',
      role: (payload['https://timisoara-hub.ro/role'] as UserRole) || 'resident',
      name: (payload['https://timisoara-hub.ro/name'] as string) || (payload.name as string) || 'User'
    };

    c.set('user', user);
    return next();
  } catch (err) {
    // If invalid token provided, return 401
    return c.json({ error: 'Unauthorized: Invalid Auth0 token' }, 401);
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthContextUser | undefined;

    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: `Forbidden: requires one of [${allowedRoles.join(', ')}] role` }, 403);
    }

    return next();
  };
}
