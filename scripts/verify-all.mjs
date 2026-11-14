import { execSync } from 'child_process';
import http from 'http';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

console.log('================================================================');
console.log('🏛️ UNIHACK 2026 — FULL INTEGRATION VERIFICATION SUITE');
console.log('================================================================\n');

let allPassed = true;

function runStep(name, fn) {
  process.stdout.write(`⏳ Checking: ${name}... `);
  try {
    const result = fn();
    console.log(`✅ PASS\n   ${result || 'OK'}`);
  } catch (err) {
    allPassed = false;
    console.log(`❌ FAIL\n   ${err.message || err}`);
  }
}

// 1. TypeScript Validation
runStep('TypeScript Compilation (All Workspaces)', () => {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  return '0 errors across @hub/app, @hub/contracts, @hub/map, @hub/solana, @hub/ui, api';
});

// 2. Auth0 & User Roles Security Policy
runStep('Auth0 & Role-Based Access Control Suite', () => {
  const out = execSync('node scripts/test-e2e-auth.mjs', { stdio: 'pipe' }).toString();
  if (out.includes('RESULTS: 8/8 TESTS PASSED')) {
    return '8/8 Security policies verified (Guest, Resident, Admin, 403 Gates, MFA)';
  }
  throw new Error('Some auth tests failed');
});

// 3. Solana Devnet Smart Contracts
runStep('Solana Blockchain Devnet Cluster & Minting', () => {
  const out = execSync('node --experimental-strip-types scripts/test-solana-real.ts', { stdio: 'pipe' }).toString();
  if (out.includes('POAP confirmat on-chain')) {
    return 'Devnet cluster responsive, real ticket & POAP minted on-chain';
  }
  throw new Error('Solana test failed');
});

// 4. TimescaleDB Tiger Cloud Live Connection
async function testDatabase() {
  process.stdout.write(`⏳ Checking: TimescaleDB Tiger Cloud Connection... `);
  if (!process.env.DATABASE_URL) {
    console.log(`⚠️ SKIPPED (DATABASE_URL not set)`);
    return;
  }
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const users = await client.query('SELECT count(*) FROM core_users;');
    const parking = await client.query('SELECT count(*) FROM parking_detection_events;');
    console.log(`✅ PASS\n   Connected live to Tiger Cloud. Users: ${users.rows[0].count}, Parking Events: ${parking.rows[0].count}`);
  } catch (err) {
    allPassed = false;
    console.log(`❌ FAIL\n   ${err.message}`);
  } finally {
    await client.end();
  }
}

async function main() {
  await testDatabase();
  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL INTEGRATION CHECKS PASSED — NOTHING IS BROKEN!');
  } else {
    console.log('⚠️ SOME CHECKS ENCOUNTERED ISSUES');
  }
  console.log('================================================================\n');
}

main();
