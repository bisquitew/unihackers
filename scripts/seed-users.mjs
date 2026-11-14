import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const SEED_USERS = [
  {
    auth0_id: 'auth0|dev-resident-01',
    email: 'resident@timisoara-hub.ro',
    name: 'Andrei Timișan (Cetățean)',
    role: 'resident',
    neighbourhood: 'Cetate'
  },
  {
    auth0_id: 'auth0|dev-admin-01',
    email: 'admin@timisoara-hub.ro',
    name: 'Admin Primăria TM (Administrator)',
    role: 'admin',
    neighbourhood: 'Centru - Primărie'
  }
];

async function seed() {
  try {
    await client.connect();
    console.log('Connected to Tiger Cloud Database.');

    for (const u of SEED_USERS) {
      const res = await client.query(`
        INSERT INTO core_users (auth0_id, email, name, role, neighbourhood, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE 
        SET 
          auth0_id = EXCLUDED.auth0_id,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          neighbourhood = EXCLUDED.neighbourhood,
          updated_at = NOW()
        RETURNING id, email, name, role, neighbourhood;
      `, [u.auth0_id, u.email, u.name, u.role, u.neighbourhood]);

      console.log(`Seeded user:`, res.rows[0]);
    }

    const total = await client.query('SELECT id, email, name, role, neighbourhood FROM core_users;');
    console.log('\n--- Current core_users in Tiger Cloud ---');
    console.table(total.rows);
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await client.end();
  }
}

seed();
