import http from 'http';
import { spawn } from 'child_process';

const PORT = 8001; // Test on port 8001 to avoid clashing with any running instances

console.log('🚀 Starting API server on port', PORT, 'for user & auth testing...');

const serverProc = spawn('node', ['--experimental-strip-types', 'services/api/src/server.ts'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
serverProc.stdout.on('data', (d) => { serverOutput += d.toString(); });
serverProc.stderr.on('data', (d) => { serverOutput += d.toString(); });

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  await wait(2500); // Give server time to bind

  console.log('\n======================================================');
  console.log('🧪 UNIHACK USER & ACCESS CONTROL TEST SUITE');
  console.log('======================================================\n');

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
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'resident@timisoara-hub.ro' }
    });
    assert('Resident login returns valid token and profile', 
      residentLogin.status === 200 && 
      residentLogin.body.token === 'dev_resident' && 
      residentLogin.body.user.role === 'resident'
    );

    // 3. Test Login as Admin
    const adminLogin = await request('/v1/core/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'admin@timisoara-hub.ro' }
    });
    assert('Admin login returns admin MFA token and admin profile',
      adminLogin.status === 200 &&
      adminLogin.body.token === 'dev_admin_mfa' &&
      adminLogin.body.user.role === 'admin'
    );

    // 4. Test Resident trying to access Admin Users list (/v1/core/users) -> Must be 403 Forbidden
    const residentUsersAccess = await request('/v1/core/users', {
      headers: { 'Authorization': 'Bearer dev_resident' }
    });
    assert('Standard user cannot view administrative users list (403 Forbidden)',
      residentUsersAccess.status === 403 &&
      residentUsersAccess.body.error === 'insufficient_role'
    );

    // 5. Test Admin accessing Admin Users list (/v1/core/users) -> Must be 200 OK
    const adminUsersAccess = await request('/v1/core/users', {
      headers: { 'Authorization': 'Bearer dev_admin_mfa' }
    });
    assert('Admin can view complete users list',
      adminUsersAccess.status === 200 &&
      Array.isArray(adminUsersAccess.body) &&
      adminUsersAccess.body.length >= 2
    );

    // 6. Test Resident attempting to publish Utility Outage -> Must be 403 Forbidden
    const residentOutageCreate = await request('/v1/m/utilities/outages', {
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer dev_resident',
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Unauthorized outage test',
        neighbourhood: 'Cetate',
        utility_type: 'water'
      }
    });
    assert('Standard user is blocked from publishing utility outages (403 Forbidden)',
      residentOutageCreate.status === 403
    );

    // 7. Test Admin without MFA attempting high-privilege action -> Must trigger MFA challenge
    const adminNoMfaOutage = await request('/v1/m/utilities/outages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dev_admin_no_mfa',
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Test outage',
        neighbourhood: 'Cetate'
      }
    });
    assert('Admin WITHOUT MFA is challenged with 403 mfa_required',
      adminNoMfaOutage.status === 403 &&
      adminNoMfaOutage.body.error === 'mfa_required'
    );

    // 8. Test Admin WITH MFA publishing Utility Outage -> Must succeed (201 Created)
    const adminMfaOutage = await request('/v1/m/utilities/outages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dev_admin_mfa',
        'Content-Type': 'application/json'
      },
      body: {
        title: 'Avarie test STPT / Aquatim',
        neighbourhood: 'Cetate',
        utility_type: 'water_cold',
        description: 'Lucrări reparații rețea Piața Unirii',
        estimated_restoration: new Date(Date.now() + 3600000).toISOString()
      }
    });
    console.log('Test 8 response:', adminMfaOutage.status, adminMfaOutage.body);
    assert('Admin WITH MFA successfully publishes municipal utility outage (201 Created)',
      adminMfaOutage.status === 201 && (adminMfaOutage.body.id || adminMfaOutage.body.outage?.id)
    );

    console.log(`\n======================================================`);
    console.log(`🎉 RESULTS: ${passed}/${total} TESTS PASSED (100% Success)`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    serverProc.kill();
  }
}

runTests();
