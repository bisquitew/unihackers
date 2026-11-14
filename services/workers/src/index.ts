import { runColtermIngestion } from './ingestion/coltermIngestion.ts';
import { runTransitIngestion } from './ingestion/transitIngestion.ts';
import { runSensorIngestion } from './ingestion/sensorIngestion.ts';
import { config } from './config.ts';

const isOnce = process.argv.includes('--once');

console.log('============================================================');
console.log('⚡ [UNIHACK 2026] Netrom Glue Ingestion Engine');
console.log('   Target: Automated Ingestion of Public Data, Gemini AI & Timescale');
console.log(`   Mode: ${isOnce ? 'Single Run (--once)' : `Scheduled Cron (every ${config.ingestionIntervalMs / 1000}s)`}`);
console.log(`   Auth0 M2M Principal: ${config.authToken}`);
console.log('============================================================');

async function cycle() {
  const start = Date.now();
  console.log(`\n🕒 [CYCLE START] ${new Date().toISOString()}`);

  const colterm = await runColtermIngestion();
  const transit = await runTransitIngestion();
  const sensors = await runSensorIngestion();

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n🏁 [CYCLE SUMMARY] Finished in ${elapsed}s:`);
  console.log(`   🔥 Outages Ingested: ${colterm.ingested} (Errors: ${colterm.errors})`);
  console.log(`   🚊 Transit Detours Ingested: ${transit.ingested} (Errors: ${transit.errors})`);
  console.log(`   🌿 Sensor Metrics Ingested: ${sensors.ingested} (Errors: ${sensors.errors})`);
  console.log('============================================================\n');

  if (isOnce) {
    process.exit(0);
  }
}

// First execution
cycle();

// Scheduled loop
if (!isOnce) {
  setInterval(cycle, config.ingestionIntervalMs);
}
