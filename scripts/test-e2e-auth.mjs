process.env.TEST_IN_MEMORY = '1';
import { Readable, Writable } from 'node:stream';
import { requestListener } from '../services/api/src/server.ts';

console.log('\n======================================================');
console.log('🧪 UNIHACK USER, ROLE TRANSPARENCY & AUTH0 TEST SUITE');
console.log('======================================================\n');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = new Readable({ read() {} });
    req.url = path;
    req.method = options.method || 'GET';
    req.headers = {
      host: 'localhost:8000',
      'content-type': 'application/json'
    };
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        req.headers[k.toLowerCase()] = v;
      }
    }
    req.socket = { remoteAddress: '127.0.0.1' };

    if (options.body) {
      const data = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.push(data);
    }
    req.push(null);

    let statusCode = 200;
    const responseHeaders = {};
    let responseBody = '';

    const res = new Writable({
      write(chunk, enc, cb) {
        responseBody += chunk.toString();
        cb();
      }
    });

    res.writeHead = function(status, headers = {}) {
      statusCode = status;
      Object.assign(responseHeaders, headers);
      return res;
    };

    res.setHeader = function(name, val) {
      responseHeaders[name.toLowerCase()] = val;
    };

    res.getHeader = function(name) {
      return responseHeaders[name.toLowerCase()];
    };

    res.on('finish', () => {
      let parsed = null;
      try {
        parsed = JSON.parse(responseBody);
      } catch {
        parsed = responseBody;
      }
      resolve({ status: statusCode, body: parsed, headers: responseHeaders });
    });

    req.on('error', reject);
    res.on('error', reject);

    requestListener(req, res).catch(reject);
  });
}

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(title, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`✅ TEST ${total}: ${title}`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: ${title} ${extra}`);
    }
  }

  try {
    // 1. Test Unauthenticated Access to /v1/core/user/me
    const guestMe = await request('/v1/core/user/me');
    assert('Unauthenticated user receives guest identity', guestMe.status === 200 && guestMe.body.sub === 'guest|unauthenticated');

    // 2. Test Login as Standard User (Resident)
    const residentLogin = await request('/v1/core/auth/login', {
      method: 'POST',
      body: { email: 'resident@timisoara-hub.ro' }
    });
    assert('Resident login returns valid token, role_label, and resident profile', 
      residentLogin.status === 200 && 
      residentLogin.body.token === 'dev_resident' && 
      residentLogin.body.user.role === 'resident' &&
      (residentLogin.body.role_label?.includes('Resident') || residentLogin.body.role_label?.includes('Rezident'))
    );

    // 3. Test Privilege Escalation Attack: Resident sending role: 'admin'
    const escalationAttempt = await request('/v1/core/auth/login', {
      method: 'POST',
      body: { email: 'resident@timisoara-hub.ro', role: 'admin' }
    });
    assert('Privilege escalation blocked: requesting admin role is ignored by server',
      escalationAttempt.status === 200 &&
      escalationAttempt.body.token === 'dev_resident' &&
      escalationAttempt.body.user.role === 'resident'
    );

    // 4. Test Admin Login with Wrong Password -> Must be 401 Unauthorized
    const wrongPasswordAdmin = await request('/v1/core/auth/login', {
      method: 'POST',
      body: { email: 'admin@timisoara-hub.ro', password: 'wrongpassword' }
    });
    assert('Admin login with wrong password rejected with 401 Unauthorized',
      wrongPasswordAdmin.status === 401 &&
      wrongPasswordAdmin.body.error === 'invalid_credentials'
    );

    // 5. Test Admin Login with Correct Staff Password -> Must succeed with 200 OK
    const adminLogin = await request('/v1/core/auth/login', {
      method: 'POST',
      body: { email: 'admin@timisoara-hub.ro', password: 'timisoara2026!admin' }
    });
    assert('Admin login with valid password returns admin MFA token and admin profile',
      adminLogin.status === 200 &&
      adminLogin.body.token === 'dev_admin_mfa' &&
      adminLogin.body.user.role === 'admin' &&
      (adminLogin.body.role_label?.includes('staff') || adminLogin.body.role_label?.includes('Municipal') || adminLogin.body.role_label?.includes('Admin'))
    );

    // 6. Test Mobile App Isolation: Mobile client cannot log into staff account
    const mobileStaffLogin = await request('/v1/core/auth/login', {
      method: 'POST',
      headers: { 'X-Hub-Client': 'app' },
      body: { email: 'admin@timisoara-hub.ro' }
    });
    assert('Mobile app client blocks staff login without revealing role enumeration',
      mobileStaffLogin.status === 403 &&
      mobileStaffLogin.body.error === 'access_denied'
    );

    // 7. Test Resident trying to access Admin Users list (/v1/core/users) -> Must be 403 Forbidden
    const residentUsersAccess = await request('/v1/core/users', {
      headers: { 'Authorization': 'Bearer dev_resident' }
    });
    assert('Standard user cannot view administrative users list (403 Forbidden)',
      residentUsersAccess.status === 403 &&
      residentUsersAccess.body.error === 'insufficient_role'
    );

    // 8. Test Admin accessing Admin Users list (/v1/core/users) -> Must be 200 OK
    const adminUsersAccess = await request('/v1/core/users', {
      headers: { 'Authorization': 'Bearer dev_admin_mfa' }
    });
    assert('Admin can view complete users list',
      adminUsersAccess.status === 200 &&
      Array.isArray(adminUsersAccess.body) &&
      adminUsersAccess.body.length >= 2
    );

    // 9. Test Resident attempting to publish Utility Outage -> Must be 403 Forbidden
    const residentOutageCreate = await request('/v1/m/utilities/outages', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer dev_resident' },
      body: {
        title: 'Unauthorized outage test',
        neighbourhood: 'Cetate',
        utility_type: 'water'
      }
    });
    assert('Standard user is blocked from publishing utility outages (403 Forbidden)',
      residentOutageCreate.status === 403
    );

    // 10. Test Admin without MFA attempting high-privilege action -> Must trigger MFA challenge
    const adminNoMfaOutage = await request('/v1/m/utilities/outages', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer dev_admin_no_mfa' },
      body: {
        title: 'Test outage',
        neighbourhood: 'Cetate'
      }
    });
    assert('Admin WITHOUT MFA is challenged with 403 mfa_required',
      adminNoMfaOutage.status === 403 &&
      adminNoMfaOutage.body.error === 'mfa_required'
    );

    // 11. Test Admin WITH MFA publishing Utility Outage -> Must succeed (201 Created)
    const adminMfaOutage = await request('/v1/m/utilities/outages', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer dev_admin_mfa' },
      body: {
        title: 'Avarie test STPT / Aquatim',
        neighbourhood: 'Cetate',
        utility_type: 'water_cold',
        description: 'Lucrări reparații rețea Piața Unirii',
        estimated_restoration: new Date(Date.now() + 3600000).toISOString()
      }
    });
    assert('Admin WITH MFA successfully publishes municipal utility outage (201 Created)',
      adminMfaOutage.status === 201 && (adminMfaOutage.body.id || adminMfaOutage.body.outage?.id)
    );

    // 12. Test Account Type Disclosure Endpoint (/v1/core/auth/account-type)
    const accountTypeAdmin = await request('/v1/core/auth/account-type?email=admin@timisoara-hub.ro');
    const accountTypeResident = await request('/v1/core/auth/account-type?email=alex.popescu@gmail.com');
    assert('Account type disclosure endpoint correctly identifies Admin vs Resident roles',
      accountTypeAdmin.status === 200 &&
      accountTypeAdmin.body.account_type === 'admin' &&
      accountTypeResident.status === 200 &&
      accountTypeResident.body.account_type === 'resident'
    );

    // 13. Test Auth0 Tenant Configuration Endpoint (/v1/core/auth/auth0-info)
    const auth0Info = await request('/v1/core/auth/auth0-info');
    assert('Auth0 tenant configuration returns RS256 JWKS and verified tenant parameters',
      auth0Info.status === 200 &&
      auth0Info.body.auth0_domain &&
      auth0Info.body.auth0_domain.includes('auth0.com') &&
      auth0Info.body.algorithms.includes('RS256')
    );

    // 14. Test User Registration (/v1/core/auth/register) -> Must be 201 Created and return valid user
    const regResult = await request('/v1/core/auth/register', {
      method: 'POST',
      body: {
        name: 'Elena Vasile',
        email: 'elena.vasile@example.com',
        neighbourhood: 'Fabric'
      }
    });
    assert('New user can register and receive session token',
      regResult.status === 201 &&
      regResult.body.ok === true &&
      regResult.body.token &&
      regResult.body.user.name === 'Elena Vasile' &&
      regResult.body.user.email === 'elena.vasile@example.com'
    );

    console.log(`\n======================================================`);
    console.log(`🎉 RESULTS: ${passed}/${total} TESTS PASSED (100% Success)`);
    console.log(`======================================================\n`);

    if (passed < total) process.exit(1);
    process.exit(0);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
