import { spawn } from 'child_process';
import http from 'http';
import { HubApiClient } from '../packages/api-client/src/index.ts';

const TEST_PORT = 8000;
const BASE_URL = `http://localhost:${TEST_PORT}`;

console.log('================================================================');
console.log('🏛️ UNIHACK 2026 — ALL 13 MODULES LIVE INTEGRATION TEST SUITE');
console.log('================================================================\n');

// Helper to wait for server
async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return true;
    } catch {
      // wait 300ms
      await new Promise(r => setTimeout(r, 300));
    }
  }
  return false;
}

async function run() {
  let serverProcess = null;

  // Check if server is already running on port 8000
  let isAlreadyRunning = false;
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.ok) {
      isAlreadyRunning = true;
      console.log('⚡ API server is already running on port 8000.');
    }
  } catch {}

  if (!isAlreadyRunning) {
    console.log('🚀 Spawning API server (node services/api/src/server.ts)...');
    serverProcess = spawn('node', ['--experimental-strip-types', 'services/api/src/server.ts'], {
      env: { ...process.env, PORT: String(TEST_PORT) },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('running on') || msg.includes('Connected to Tiger')) {
        process.stdout.write(`   [server] ${msg.trim()}\n`);
      }
    });

    serverProcess.stderr.on('data', (d) => {
      // process.stderr.write(`   [server err] ${d.toString()}`);
    });

    const ready = await waitForServer(BASE_URL, 15000);
    if (!ready) {
      console.error('❌ Failed to start server in time.');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
    console.log('✅ Server is ready and listening!\n');
  }

  const client = new HubApiClient({ baseUrl: BASE_URL });
  const results = [];

  async function testModule(modId, name, testFn) {
    process.stdout.write(`⏳ Testing Module [${modId}] ${name}... `);
    try {
      const res = await testFn();
      console.log(`✅ PASS`);
      results.push({ id: modId, name, status: 'PASS', detail: res });
    } catch (err) {
      console.log(`❌ FAIL (${err.message})`);
      results.push({ id: modId, name, status: 'FAIL', error: err.message });
    }
  }

  try {
    // 0. CORE & AUTH
    await testModule('core', 'Core Health & Areas', async () => {
      const health = await client.core.getHealth();
      const areas = await client.core.getAreas();
      return `${health.project} (${areas.length} areas)`;
    });

    await testModule('auth', 'Auth0 & Role-Based Access', async () => {
      const loginRes = await client.auth.login('resident@timisoara-hub.ro');
      client.setAuthToken(loginRes.token);
      const me = await client.auth.getMe();
      return `User: ${me.email} (${me.role})`;
    });

    // 1. M01 - EVENTS
    await testModule('m01', 'Cultural Micro-Events', async () => {
      const list = await client.events.list();
      return `${list.events.length} events loaded`;
    });

    // 2. M02 - VISITOR INFO
    await testModule('m02', 'Visitor Info & Smart Tourism', async () => {
      const cats = await client.visitorInfo.getCategories();
      const list = await client.visitorInfo.list();
      return `${cats.categories.length} categories, ${list.count || list.entries?.length || 0} entries`;
    });

    // 3. M03 - SAFETY
    await testModule('m03', 'Urban Safety & Incident Reports', async () => {
      const health = await client.safety.getHealth();
      const reports = await client.safety.listReports();
      return `Status: ${health.status}, Storage: ${health.storage?.active}`;
    });

    // 4. M04 - UTILITIES
    await testModule('m04', 'Utilities & Outage Check', async () => {
      const outages = await client.utilities.getOutages();
      const impact = await client.utilities.checkAddress('Cetate');
      return `${outages.length} outages, impact checked`;
    });

    // 5. M05 - TRANSIT
    await testModule('m05', 'Public Transit Lines & Detours', async () => {
      const lines = await client.transit.getLines();
      const detours = await client.transit.getDetours();
      return `${lines.length} lines, ${detours.length} detours active`;
    });

    // 6. M06 - SMELL
    await testModule('m06', 'Odor & Environmental Monitoring', async () => {
      const pins = await client.smell.getPins(48);
      const areas = await client.smell.getAreas(48);
      return `${pins.count || pins.pins?.length || 0} smell pins tracked`;
    });

    // 7. M07 - BUDDY
    await testModule('m07', 'Event Buddies & Matchmaking', async () => {
      const reqs = await client.buddy.listRequests();
      const match = await client.buddy.findMatches('evt-1', ['music', 'cinema']);
      return `${reqs.buddyRequests.length} buddy requests, match computed`;
    });

    // 8. M08 - FORUM
    await testModule('m08', 'Civic Forum & Discussions', async () => {
      const posts = await client.forum.listPosts();
      return `${posts.posts.length} forum discussions active`;
    });

    // 9. M09 - WALLET & SOLANA
    await testModule('m09', 'Solana Devnet NFT Tickets & POAPs', async () => {
      const status = await client.solana.getStatus();
      return `Cluster: ${status.cluster}, Devnet: ${status.connected ? 'Connected' : 'Simulation Mode'}`;
    });

    // 10. M10 - ASSISTANT
    await testModule('m10', 'AI Assistant "Hop" & Voice Tools', async () => {
      const tools = await client.assistant.getTools();
      const voice = await client.assistant.getVoiceStatus();
      return `${tools.count} AI function tools, Voice: ${voice.available ? 'Ready' : 'Text-only'}`;
    });

    // 11. M11 - FEEDBACK
    await testModule('m11', 'Citizen Feedback & Survey System', async () => {
      const res = await client.feedback.submitInApp({
        rating: 5,
        text: 'Traseul liniei 4 a fost foarte rapid azi!',
        appVersion: '1.0.0',
        moduleId: 'm05-transit'
      });
      return `Feedback submitted (ID: ${res.feedback?.id || 'ok'})`;
    });

    // 12. M12 - DASHBOARD
    await testModule('m12', 'City Officials Dashboard & Heatmap', async () => {
      const overview = await client.dashboard.getOverview();
      const heatmap = await client.core.getHeatmap();
      const heatCount = (heatmap.parking_heatpoints?.length || 0) + (heatmap.environmental_heatpoints?.length || 0);
      return `Overview generated, ${heatCount} heatmap points`;
    });

    // 13. PARKIE
    await testModule('parkie', 'Parkie Smart Parking & Camera Plots', async () => {
      const lots = await client.parkie.getLots();
      const nearest = await client.parkie.findNearest(45.7578, 21.2290, 3);
      return `${lots.length} lots online, nearest located (${nearest.length})`;
    });

  } finally {
    if (serverProcess) {
      console.log('\n🛑 Shutting down test server process...');
      serverProcess.kill('SIGTERM');
    }
  }

  console.log('\n================================================================');
  console.log('📊 FINAL TEST RESULTS: ALL 13 MODULES');
  console.log('================================================================');
  const allPass = results.every(r => r.status === 'PASS');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.id.padEnd(6)}] ${r.name.padEnd(35)} : ${r.detail || r.error}`);
  }
  console.log('================================================================');
  if (allPass) {
    console.log(`🎉 ALL ${results.length} MODULES & SUB-SYSTEMS VERIFIED 100% OPERATIONAL!`);
  } else {
    console.log(`⚠️ Some modules failed tests.`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Unhandled run error:', err);
  process.exit(1);
});
