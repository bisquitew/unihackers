import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
const res = await client.query(`
  SELECT table_name, column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  ORDER BY table_name, ordinal_position;
`);

const byTable = {};
res.rows.forEach(r => {
  byTable[r.table_name] = byTable[r.table_name] || [];
  byTable[r.table_name].push(`${r.column_name} (${r.data_type})`);
});

console.log(JSON.stringify(byTable, null, 2));
await client.end();
