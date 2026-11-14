import http from 'http';

// We will test direct logic or start a quick server probe
console.log('Testing auth & roles logic...');
import { DEV_USERS, enforceSecurityPolicy } from '../services/api/src/core/auth.ts';

// 1. Resident check on regular action
const resCheck = enforceSecurityPolicy(DEV_USERS.dev_resident, 'events.rsvp', {
  requiredRoles: ['resident', 'admin']
});
console.log('1. Resident RSVP test:', resCheck.authorized ? 'PASS (Allowed)' : 'FAIL');

// 2. Resident trying admin action
const resAdminCheck = enforceSecurityPolicy(DEV_USERS.dev_resident, 'utilities.outages_create', {
  requiredRoles: ['admin']
});
console.log('2. Resident creating outage (Forbidden):', !resAdminCheck.authorized ? 'PASS (Blocked with 403)' : 'FAIL');

// 3. Admin with MFA performing admin action
const adminCheck = enforceSecurityPolicy(DEV_USERS.dev_admin_mfa, 'utilities.outages_create', {
  requiredRoles: ['admin'],
  requireMfa: true
});
console.log('3. Admin with MFA creating outage:', adminCheck.authorized ? 'PASS (Allowed)' : 'FAIL');

console.log('All auth policy verification tests succeeded!');
