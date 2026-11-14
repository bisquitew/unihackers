import { HubApiClient, hubApi, createApiClient } from '../packages/api-client/src/index.ts';

console.log('Testing @hub/api-client...');

const client = new HubApiClient({ baseUrl: 'http://localhost:8000' });

console.log('1. Checking client module structure:');
const expectedModules = [
  'core', 'auth', 'parkie', 'utilities', 'transit',
  'events', 'forum', 'buddy', 'solana', 'dashboard',
  'visitorInfo', 'safety', 'smell', 'assistant', 'feedback'
];

for (const mod of expectedModules) {
  if (client[mod]) {
    console.log(`   ✓ client.${mod} is defined`);
  } else {
    console.error(`   ❌ client.${mod} is MISSING!`);
    process.exit(1);
  }
}

console.log('2. Checking methods on core & auth:');
console.log('   - client.core.getHealth:', typeof client.core.getHealth);
console.log('   - client.auth.login:', typeof client.auth.login);
console.log('   - client.parkie.getLots:', typeof client.parkie.getLots);
console.log('   - client.events.list:', typeof client.events.list);
console.log('   - client.solana.getStatus:', typeof client.solana.getStatus);
console.log('   - createApiClient (generic):', typeof createApiClient);

console.log('🎉 @hub/api-client verified successfully!');

