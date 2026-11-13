import { runColtermIngestion } from './ingestion/coltermIngestion.ts';
import { runTransitIngestion } from './ingestion/transitIngestion.ts';

console.log('⚡ [UNIHACK 2026] Netrom Glue Ingestion Engine Started');
console.log('   Target: Automated Ingestion of Colterm & STPT notices with Gemini structuring');

async function cycle() {
  console.log('\n--- Starting Ingestion Cycle ---');
  await runColtermIngestion();
  await runTransitIngestion();
  console.log('--- Ingestion Cycle Complete ---\n');
}

// Initial run
cycle();

// Run every 10 minutes in background
const INTERVAL_MS = 10 * 60 * 1000;
setInterval(cycle, INTERVAL_MS);
