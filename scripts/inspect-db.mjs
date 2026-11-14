import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL is not set in .env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function main() {
  console.log('====================================================');
  console.log('🐅 TIGER DATA CLOUD (TIMESCALEDB) INSPECTOR');
  console.log('====================================================');

  try {
    // 1. Extension and Version
    const ext = await pool.query("SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';");
    console.log(`✅ TimescaleDB Cloud Extension: v${ext.rows[0]?.extversion || 'Not active'}`);

    // 2. Public Tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map((r) => r.table_name);
    console.log(`📋 Total Tables Found: ${tableNames.length}`);
    console.log('----------------------------------------------------');

    for (const table of tableNames) {
      const countRes = await pool.query(`SELECT COUNT(*) as count FROM "${table}";`);
      const count = parseInt(countRes.rows[0]?.count || '0', 10);

      console.log(`\n📦 TABLE: [${table}] (${count} rows)`);

      if (count > 0) {
        const sampleRes = await pool.query(`SELECT * FROM "${table}" LIMIT 2;`);
        sampleRes.rows.forEach((row, i) => {
          console.log(`   Row ${i + 1}:`, JSON.stringify(row));
        });
      } else {
        console.log('   (Empty - 0 records)');
      }
    }

    // 3. Hypertables & Continuous Aggregates
    console.log('\n====================================================');
    console.log('📊 TIMESCALEDB HYPERTABLES & AGGREGATES');
    console.log('====================================================');
    try {
      const hyper = await pool.query(`
        SELECT hypertable_name, num_chunks 
        FROM timescaledb_information.hypertables;
      `);
      console.log('Hypertables:', hyper.rows);

      const cagg = await pool.query(`
        SELECT view_name, materialized_only 
        FROM timescaledb_information.continuous_aggregates;
      `);
      console.log('Continuous Aggregates:', cagg.rows);
    } catch (e) {
      console.log('Timescale info note:', e.message);
    }

    console.log('\n====================================================');
    console.log('🎉 Database is healthy, connected, and operational!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Database error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
