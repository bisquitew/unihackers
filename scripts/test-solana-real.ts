import 'dotenv/config';
import {
  getLiveDevnetStatus,
  broadcastRealTicket,
  broadcastRealPoap,
  ORGANIZER_WALLET_ADDRESS,
  getSolanaExplorerUrl,
} from '../packages/solana/src/index.ts';

async function main() {
  console.log('====================================================');
  console.log('⚡ TIMIȘOARA CITY HUB — SOLANA DEVNET TEST SUITE');
  console.log('====================================================');
  console.log(`📍 Cluster RPC: https://api.devnet.solana.com`);
  console.log(`🔑 Portofel Organizator: ${ORGANIZER_WALLET_ADDRESS}`);
  console.log('----------------------------------------------------');

  console.log('1. Interogare status cluster Solana Devnet...');
  const status = await getLiveDevnetStatus();
  console.log(`   Online: ${status.online ? '🟢 DA' : '🔴 NU'}`);
  console.log(`   Slot Curent: #${status.slot}`);
  console.log(`   Latest Blockhash: ${status.latestBlockhash || 'N/A'}`);
  console.log(`   Balanță Organizator: ${status.organizerBalanceSol} SOL`);
  console.log('----------------------------------------------------');

  if (status.organizerBalanceSol < 0.000005) {
    console.log('⚠️  BALANȚĂ INSUFICIENTĂ PENTRU TAXE DE TRANZACȚIE PE SOLANA!');
    console.log('');
    console.log('Pentru a trimite tranzacții 100% REALE pe blockchain-ul Solana Devnet:');
    console.log('1. Deschide în browser: https://faucet.solana.com');
    console.log(`2. Lipește adresa organizatorului:`);
    console.log(`   ${ORGANIZER_WALLET_ADDRESS}`);
    console.log('3. Selectează clusterul: "Devnet" și apasă "Confirm Airdrop" (1 SOL)');
    console.log('4. Rulează din nou acest script: npm run test:solana');
    console.log('');
    console.log(`Explorer Adresă: https://explorer.solana.com/address/${ORGANIZER_WALLET_ADDRESS}?cluster=devnet`);
    console.log('====================================================');
    return;
  }

  console.log('2. Trimitere tranzacție reală pe blockchain: Bilet Acces...');
  const testTicket = await broadcastRealTicket(
    'tkt-test-' + Date.now().toString(36),
    'EVT-TDD-2026',
    'Timișoara Design Days 2026',
    '7C4jsPZpht42Tw63WmCXFWGu298v3vN6Qp1u8F3K6aW'
  );

  if (testTicket.success && testTicket.onChainConfirmed) {
    console.log('   ✅ Bilet confirmat on-chain!');
    console.log(`   Semnătură Tranzacție: ${testTicket.signature}`);
    console.log(`   Solana Explorer: ${testTicket.explorerUrl}`);
  } else {
    console.error('   ❌ Eroare bilet:', testTicket.error);
  }

  console.log('----------------------------------------------------');
  console.log('3. Trimitere tranzacție reală pe blockchain: Ecuson POAP...');
  const testPoap = await broadcastRealPoap(
    'EVT-TDD-2026',
    'Timișoara Design Days 2026',
    '7C4jsPZpht42Tw63WmCXFWGu298v3vN6Qp1u8F3K6aW',
    'tkt-test-poap'
  );

  if (testPoap.success && testPoap.onChainConfirmed) {
    console.log('   ✅ POAP confirmat on-chain!');
    console.log(`   Semnătură Tranzacție: ${testPoap.signature}`);
    console.log(`   Solana Explorer: ${testPoap.explorerUrl}`);
  } else {
    console.error('   ❌ Eroare POAP:', testPoap.error);
  }

  console.log('====================================================');
}

main().catch(console.error);
