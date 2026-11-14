import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('================================================================');
  console.log('🐅 TIGER CLOUD TIMESCALEDB — MIGRATION & REAL SEEDING SUITE');
  console.log('================================================================\n');

  await client.connect();
  console.log('✅ Connected to Tiger Cloud TimescaleDB!\n');

  // 1. CREATE TABLES FOR ALL MODULES IF NOT EXIST
  console.log('📦 Step 1: Creating missing tables...');

  // M01 Events
  await client.query(`
    CREATE TABLE IF NOT EXISTS m01_events (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(64) NOT NULL,
      location_name VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      neighbourhood VARCHAR(64) NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      date_time TIMESTAMPTZ NOT NULL,
      age_group VARCHAR(32) DEFAULT 'all',
      organizer_name VARCHAR(255) NOT NULL,
      organizer_contact VARCHAR(255),
      attendee_count INTEGER DEFAULT 1,
      is_free BOOLEAN DEFAULT true,
      ticket_price NUMERIC,
      photo_url TEXT,
      tags TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('   ✓ m01_events table ready');

  // M08 Forum Posts
  await client.query(`
    CREATE TABLE IF NOT EXISTS m08_forum_posts (
      id VARCHAR(64) PRIMARY KEY,
      category VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_id VARCHAR(64) NOT NULL,
      author_name VARCHAR(255) NOT NULL,
      author_avatar TEXT,
      neighbourhood VARCHAR(64) NOT NULL,
      photos TEXT[],
      upvotes INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      pinned BOOLEAN DEFAULT false,
      status VARCHAR(32) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('   ✓ m08_forum_posts table ready');

  // M07 Buddy Requests
  await client.query(`
    CREATE TABLE IF NOT EXISTS m07_buddy_requests (
      id VARCHAR(64) PRIMARY KEY,
      event_id VARCHAR(64) NOT NULL,
      event_title VARCHAR(255) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      bio TEXT,
      university VARCHAR(255),
      interests TEXT[],
      icebreaker_prompt TEXT,
      status VARCHAR(32) DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('   ✓ m07_buddy_requests table ready');

  // M11 Feedback
  await client.query(`
    CREATE TABLE IF NOT EXISTS m11_feedback (
      id VARCHAR(64) PRIMARY KEY,
      rating INTEGER NOT NULL,
      text TEXT,
      app_version VARCHAR(40),
      module_id VARCHAR(64),
      user_id VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('   ✓ m11_feedback table ready');

  // 2. CLEAN UP IRRELEVANT / TEST DUMMY DATA
  console.log('\n🧹 Step 2: Cleaning up obsolete / test dummy data...');
  await client.query(`DELETE FROM m04_utilities_outages WHERE title ILIKE '%test%';`);
  await client.query(`DELETE FROM m08_forum_posts WHERE title ILIKE '%test%';`);
  console.log('   ✓ Cleaned obsolete records.');

  // 3. SEED CORE AREAS (Official 13 Timișoara Neighborhoods)
  console.log('\n🌆 Step 3: Seeding core_areas...');
  const areas = [
    { id: 'area-cetate', name: 'Cetate', slug: 'cetate', lat: 45.7573, lng: 21.2290, radius: 900 },
    { id: 'area-fabric', name: 'Fabric', slug: 'fabric', lat: 45.7580, lng: 21.2500, radius: 1200 },
    { id: 'area-iosefin', name: 'Iosefin', slug: 'iosefin', lat: 45.7440, lng: 21.2080, radius: 1100 },
    { id: 'area-elisabetin', name: 'Elisabetin', slug: 'elisabetin', lat: 45.7410, lng: 21.2260, radius: 1000 },
    { id: 'area-circumvalatiunii', name: 'Circumvalațiunii', slug: 'circumvalatiunii', lat: 45.7645, lng: 21.2180, radius: 1200 },
    { id: 'area-complex', name: 'Complex Studențesc', slug: 'complex-studentesc', lat: 45.7485, lng: 21.2395, radius: 800 },
    { id: 'area-sagului', name: 'Calea Șagului', slug: 'calea-sagului', lat: 45.7330, lng: 21.2050, radius: 1300 },
    { id: 'area-aradului', name: 'Calea Aradului', slug: 'calea-aradului', lat: 45.7760, lng: 21.2260, radius: 1300 },
    { id: 'area-soarelui', name: 'Soarelui', slug: 'soarelui', lat: 45.7350, lng: 21.2480, radius: 1100 },
    { id: 'area-girocului', name: 'Girocului', slug: 'girocului', lat: 45.7320, lng: 21.2350, radius: 1100 },
    { id: 'area-mehala', name: 'Mehala', slug: 'mehala', lat: 45.7680, lng: 21.2020, radius: 1200 },
    { id: 'area-freidorf', name: 'Freidorf', slug: 'freidorf', lat: 45.7270, lng: 21.1780, radius: 1400 },
    { id: 'area-ronat', name: 'Ronaț', slug: 'ronat', lat: 45.7690, lng: 21.1850, radius: 1300 },
  ];

  for (const a of areas) {
    await client.query(`
      INSERT INTO core_areas (id, name, slug, center_lat, center_lng, radius_meters)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        center_lat = EXCLUDED.center_lat,
        center_lng = EXCLUDED.center_lng,
        radius_meters = EXCLUDED.radius_meters;
    `, [a.id, a.name, a.slug, a.lat, a.lng, a.radius]);
  }
  console.log(`   ✓ Seeded ${areas.length} core_areas in TimescaleDB.`);

  // 4. SEED CORE USERS
  console.log('\n👥 Step 4: Seeding core_users (Realistic personas)...');
  const users = [
    {
      id: '5121dd56-e1cc-42af-bd8e-5fe8c5126502',
      auth0_id: 'auth0|dev-resident-01',
      email: 'resident@timisoara-hub.ro',
      name: 'Andrei Timișan (Cetățean)',
      role: 'resident',
      neighbourhood: 'Cetate'
    },
    {
      id: '4002bf66-c6b0-4f8c-9e5e-300018deb27e',
      auth0_id: 'auth0|dev-admin-01',
      email: 'admin@timisoara-hub.ro',
      name: 'Admin Primăria TM (Administrator)',
      role: 'admin',
      neighbourhood: 'Centru - Primărie'
    },
    {
      id: '7b847d46-3317-40c0-af75-a45c74785e23',
      auth0_id: 'auth0|dev-student-01',
      email: 'student@timisoara-hub.ro',
      name: 'Elena Dumitrescu (Studentă UPT)',
      role: 'resident',
      neighbourhood: 'Complex Studențesc'
    },
    {
      id: '9c55b6a7-8822-4a01-9bfe-cc2341258901',
      auth0_id: 'auth0|dev-moderator-01',
      email: 'moderator@timisoara-hub.ro',
      name: 'Radu Vlăduț (Moderator Civic)',
      role: 'moderator',
      neighbourhood: 'Fabric'
    }
  ];

  for (const u of users) {
    await client.query(`
      INSERT INTO core_users (id, auth0_id, email, name, role, neighbourhood, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        neighbourhood = EXCLUDED.neighbourhood,
        updated_at = NOW();
    `, [u.id, u.auth0_id, u.email, u.name, u.role, u.neighbourhood]);
  }
  console.log(`   ✓ Seeded ${users.length} core_users in TimescaleDB.`);

  // 5. SEED M01 CULTURAL MICRO-EVENTS
  console.log('\n🎭 Step 5: Seeding m01_events...');
  const events = [
    {
      id: 'evt-plai-2026',
      title: 'Festivalul Plai 2026 — Muzică & Tradiții',
      description: 'Ediția aniversară Plai aduce concerte world music, ateliere meșteșugărești și spații de relaxare în aer liber.',
      category: 'music',
      locationName: 'Muzeul Satului Bănățean',
      address: 'Strada Avram Imbroane 31',
      neighbourhood: 'Pădurea Verde',
      lat: 45.7765,
      lng: 21.2652,
      dateTime: '2026-11-20T17:00:00Z',
      ageGroup: 'all',
      organizerName: 'Asociația Culturală Plai',
      organizerContact: 'contact@plai.ro',
      attendeeCount: 184,
      isFree: true,
      tags: ['muzică', 'festival', 'cultură', 'outdoor']
    },
    {
      id: 'evt-cinema-victoria-01',
      title: 'Noaptea Filmelor Europene Independente',
      description: 'Proiecție specială de scurtmetraje premiate la Berlin și Cannes, urmată de Q&A cu regizorii invitați.',
      category: 'cinema',
      locationName: 'Cinema Victoria',
      address: 'Strada Ciprian Porumbescu 2',
      neighbourhood: 'Elisabetin',
      lat: 45.7423,
      lng: 21.2285,
      dateTime: '2026-11-21T19:30:00Z',
      ageGroup: 'students',
      organizerName: 'Centrul de Proiecte Timișoara',
      organizerContact: 'cinema@victoria.tm.ro',
      attendeeCount: 78,
      isFree: true,
      tags: ['film', 'cinema', 'artă']
    },
    {
      id: 'evt-faber-hack-01',
      title: 'Atelier FABER: Design Urban & Comunități Reziliente',
      description: 'Workshop practic pentru studenți și tineri profesioniști despre regenerarea spațiilor industriale din cartierul Fabric.',
      category: 'workshop',
      locationName: 'FABER Community Hub',
      address: 'Splaiul Peneș Curcanul 4-5',
      neighbourhood: 'Fabric',
      lat: 45.7562,
      lng: 21.2486,
      dateTime: '2026-11-22T14:00:00Z',
      ageGroup: 'students',
      organizerName: 'Echipa FABER Timișoara',
      organizerContact: 'hello@faber.ro',
      attendeeCount: 42,
      isFree: true,
      tags: ['workshop', 'design', 'arhitectură', 'studenți']
    },
    {
      id: 'evt-jazztm-cetate',
      title: 'JazzTM Jam Session — Piața Sf. Gheorghe',
      description: 'Sesiune acustică live în aer liber în inima centrului istoric. Artiști locali și internaționali acompaniați de instrumentiști independenți.',
      category: 'music',
      locationName: 'Piața Sfântul Gheorghe',
      address: 'Piața Sfântul Gheorghe',
      neighbourhood: 'Cetate',
      lat: 45.7568,
      lng: 21.2289,
      dateTime: '2026-11-23T18:00:00Z',
      ageGroup: 'all',
      organizerName: 'Timișoara Jazz Collective',
      organizerContact: 'info@jazztm.ro',
      attendeeCount: 115,
      isFree: true,
      tags: ['jazz', 'live', 'cetate']
    },
    {
      id: 'evt-bega-run-2026',
      title: 'Alergarea Comunitară pe Malul Begăi (5km / 10km)',
      description: 'Eveniment sportiv deschis tuturor cetățenilor. Plecare de la Parcul Copiilor de-a lungul pistei de alergare Bega.',
      category: 'social',
      locationName: 'Parcul Copiilor Ion Creangă',
      address: 'Bulevardul Michelangelo',
      neighbourhood: 'Cetate',
      lat: 45.7521,
      lng: 21.2335,
      dateTime: '2026-11-24T09:00:00Z',
      ageGroup: 'all',
      organizerName: 'Timișoara Running Club',
      organizerContact: 'run@timisoara.ro',
      attendeeCount: 96,
      isFree: true,
      tags: ['sport', 'sănătate', 'bega', 'alergare']
    }
  ];

  for (const e of events) {
    await client.query(`
      INSERT INTO m01_events (
        id, title, description, category, location_name, address,
        neighbourhood, latitude, longitude, date_time, age_group,
        organizer_name, organizer_contact, attendee_count, is_free, tags, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        location_name = EXCLUDED.location_name,
        address = EXCLUDED.address,
        neighbourhood = EXCLUDED.neighbourhood,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        date_time = EXCLUDED.date_time,
        attendee_count = EXCLUDED.attendee_count,
        tags = EXCLUDED.tags,
        updated_at = NOW();
    `, [
      e.id, e.title, e.description, e.category, e.locationName, e.address,
      e.neighbourhood, e.lat, e.lng, e.dateTime, e.ageGroup,
      e.organizerName, e.organizerContact, e.attendeeCount, e.isFree, e.tags
    ]);
  }
  console.log(`   ✓ Seeded ${events.length} m01_events in TimescaleDB.`);

  // 6. SEED M08 FORUM POSTS
  console.log('\n💬 Step 6: Seeding m08_forum_posts...');
  const posts = [
    {
      id: 'post-piste-bega',
      category: 'transport',
      title: 'Extindere piste de biciclete pe malul Begăi spre Uzina de Apă',
      content: 'Tronsonul spre Uzina de Apă devine tot mai aglomerat în weekend. Propun instalarea de iluminat solar inteligent și separarea benzii pietonale de cea ciclistă.',
      authorId: '5121dd56-e1cc-42af-bd8e-5fe8c5126502',
      authorName: 'Andrei Timișan',
      neighbourhood: 'Fabric',
      upvotes: 34,
      commentsCount: 8,
      pinned: true
    },
    {
      id: 'post-piata-traian',
      category: 'community',
      title: 'Revitalizarea teraselor și spațiului cultural în Piața Traian',
      content: 'Clădirile istorice din Traian sunt minunate. Haideți să sprijinim micii artizani și cafenelele locale printr-un târg de weekend permanent!',
      authorId: '9c55b6a7-8822-4a01-9bfe-cc2341258901',
      authorName: 'Radu Vlăduț',
      neighbourhood: 'Fabric',
      upvotes: 27,
      commentsCount: 5,
      pinned: false
    },
    {
      id: 'post-parcare-complex',
      category: 'general',
      title: 'Propunere optimizare parcare în Complexul Studențesc pe timpul serii',
      content: 'Aleea Studenților este foarte blocată după ora 19:00. Dacă am integra senzorii Parkie la parcarea facultății de Mecanică am reduce traficul de căutare.',
      authorId: '7b847d46-3317-40c0-af75-a45c74785e23',
      authorName: 'Elena Dumitrescu',
      neighbourhood: 'Complex Studențesc',
      upvotes: 19,
      commentsCount: 4,
      pinned: false
    },
    {
      id: 'post-copaci-cetate',
      category: 'environment',
      title: 'Proiect de umbrire naturală cu arbori pe strada Alba Iulia',
      content: 'Vara temperatura la nivelul caldarâmului depășește 40°C. Propunem amplasarea de arbori mari în jardiniere speciale pe traseul pietonal Unirii - Victoriei.',
      authorId: '5121dd56-e1cc-42af-bd8e-5fe8c5126502',
      authorName: 'Andrei Timișan',
      neighbourhood: 'Cetate',
      upvotes: 41,
      commentsCount: 12,
      pinned: true
    }
  ];

  for (const p of posts) {
    await client.query(`
      INSERT INTO m08_forum_posts (
        id, category, title, content, author_id, author_name,
        neighbourhood, upvotes, comments_count, pinned, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        upvotes = EXCLUDED.upvotes,
        comments_count = EXCLUDED.comments_count,
        pinned = EXCLUDED.pinned,
        updated_at = NOW();
    `, [p.id, p.category, p.title, p.content, p.authorId, p.authorName, p.neighbourhood, p.upvotes, p.commentsCount, p.pinned]);
  }
  console.log(`   ✓ Seeded ${posts.length} m08_forum_posts in TimescaleDB.`);

  // 7. SEED M07 BUDDY REQUESTS
  console.log('\n🤝 Step 7: Seeding m07_buddy_requests...');
  const buddyRequests = [
    {
      id: 'bud-plai-01',
      eventId: 'evt-plai-2026',
      eventTitle: 'Festivalul Plai 2026 — Muzică & Tradiții',
      userId: '7b847d46-3317-40c0-af75-a45c74785e23',
      userName: 'Elena Dumitrescu',
      bio: 'Studentă la Arhitectură, pasionată de muzică acustică, fotografie și plimbări în natură.',
      university: 'Universitatea Politehnica Timișoara',
      interests: ['muzică', 'artă', 'natură', 'festival'],
      icebreakerPrompt: 'Ce trupe din programul de anul acesta vrei neapărat să asculți?'
    },
    {
      id: 'bud-faber-01',
      eventId: 'evt-faber-hack-01',
      eventTitle: 'Atelier FABER: Design Urban & Comunități Reziliente',
      userId: '5121dd56-e1cc-42af-bd8e-5fe8c5126502',
      userName: 'Andrei Timișan',
      bio: 'Inginer software și ciclist urban. Caut colegi de echipă pentru prototipare de idei smart city.',
      university: 'Resident Timișoara',
      interests: ['workshop', 'design', 'arhitectură', 'tehnologie'],
      icebreakerPrompt: 'Ai vreo idee de proiect urban pe care ai vrea să o dezvoltăm împreună?'
    },
    {
      id: 'bud-jazz-01',
      eventId: 'evt-jazztm-cetate',
      eventTitle: 'JazzTM Jam Session — Piața Sf. Gheorghe',
      userId: '9c55b6a7-8822-4a01-9bfe-cc2341258901',
      userName: 'Radu Vlăduț',
      bio: 'Pasionat de jazz, vinyl-uri și istoria cartierelor din Timișoara.',
      university: 'Universitatea de Vest din Timișoara',
      interests: ['jazz', 'cultură', 'social', 'artă'],
      icebreakerPrompt: 'Care este locul tău preferat pentru o cafea bună în Cetate?'
    }
  ];

  for (const b of buddyRequests) {
    await client.query(`
      INSERT INTO m07_buddy_requests (
        id, event_id, event_title, user_id, user_name, bio,
        university, interests, icebreaker_prompt, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', NOW())
      ON CONFLICT (id) DO UPDATE SET
        bio = EXCLUDED.bio,
        interests = EXCLUDED.interests,
        status = EXCLUDED.status;
    `, [b.id, b.eventId, b.eventTitle, b.userId, b.userName, b.bio, b.university, b.interests, b.icebreakerPrompt]);
  }
  console.log(`   ✓ Seeded ${buddyRequests.length} m07_buddy_requests in TimescaleDB.`);

  // 8. SEED M04 UTILITIES OUTAGES
  console.log('\n🚰 Step 8: Seeding m04_utilities_outages...');
  const outages = [
    {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      provider: 'Aquatim',
      type: 'water_cold',
      status: 'active',
      severity: 'medium',
      title: 'Intervenție rețea apă potabilă — Calea Aradului & Circumvalațiunii',
      description: 'Lucrări de remediere branșament avariat și modernizare vane de presiune. Echipele Aquatim sunt pe teren.',
      affectedAreas: ['Calea Aradului', 'Circumvalațiunii'],
      affectedStreets: ['Str. Liege', 'Str. Miresei', 'Calea Aradului nr. 12-48'],
      startTime: '2026-11-14T08:00:00Z',
      estimatedRestoreTime: '2026-11-15T16:00:00Z'
    },
    {
      id: '8cb3897b-99f5-4cf5-99d8-9fb1b4a92c01',
      provider: 'Colterm',
      type: 'heating',
      status: 'investigating',
      severity: 'high',
      title: 'Avarie magistrală termoficare PT 45 — Complex Studențesc',
      description: 'Parametri reduși de furnizare a apei calde și căldurii pentru căminele studențești. Se efectuează presurizarea tronsonului.',
      affectedAreas: ['Complex Studențesc'],
      affectedStreets: ['Aleea Studenților', 'Str. Daliei', 'Bulevardul Vasile Pârvan'],
      startTime: '2026-11-14T11:30:00Z',
      estimatedRestoreTime: '2026-11-15T18:00:00Z'
    },
    {
      id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
      provider: 'Rețele Electrice Banat',
      type: 'electricity',
      status: 'scheduled',
      severity: 'low',
      title: 'Revizie tehnică programată stație transformare — Soarelui',
      description: 'Întrerupere programată pentru mentenanță preventivă a transformatoarelor de medie tensiune.',
      affectedAreas: ['Soarelui', 'Girocului'],
      affectedStreets: ['Str. Sirius', 'Str. Orion', 'Bulevardul Sudului'],
      startTime: '2026-11-16T09:00:00Z',
      estimatedRestoreTime: '2026-11-16T14:00:00Z'
    }
  ];

  for (const o of outages) {
    await client.query(`
      INSERT INTO m04_utilities_outages (
        id, provider, type, status, severity, title, description,
        affected_areas, affected_streets, start_time, estimated_restore_time,
        crowd_confirmations_count, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 3, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        severity = EXCLUDED.severity,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        estimated_restore_time = EXCLUDED.estimated_restore_time,
        updated_at = NOW();
    `, [o.id, o.provider, o.type, o.status, o.severity, o.title, o.description, o.affectedAreas, o.affectedStreets, o.startTime, o.estimatedRestoreTime]);
  }
  console.log(`   ✓ Seeded ${outages.length} m04_utilities_outages in TimescaleDB.`);

  // 9. SEED M05 TRANSIT LINES & DETOURS
  console.log('\n🚊 Step 9: Seeding m05_transit_lines & detours...');
  const transitLines = [
    { id: 'stpt-tram-1', lineNumber: '1', type: 'tram', name: 'Gara de Nord — Piața Traian — Meteo', status: 'operational', summary: 'Leagă Gara de Nord de Cetate, Fabric și Pădurea Verde' },
    { id: 'stpt-tram-2', lineNumber: '2', type: 'tram', name: 'City Mall — Piața Libertății — Dâmbovița', status: 'operational', summary: 'Axa Nord-Sud prin centrul istoric' },
    { id: 'stpt-tram-4', lineNumber: '4', type: 'tram', name: 'Ciarda Roșie — Piața 700 — Torontalului', status: 'detoured', summary: 'Deviat din cauza modernizării căii de rulare pe Bulevardul Cetății' },
    { id: 'stpt-bus-33', lineNumber: '33', type: 'bus', name: 'Catedrala Mitropolitană — Pod Calea Șagului', status: 'detoured', summary: 'Linie de mare capacitate spre zona comercială Sud' },
    { id: 'stpt-expres-e2', lineNumber: 'E2', type: 'express', name: 'Continental — Piața Mărăști — Holdelor', status: 'operational', summary: 'Conexiune rapidă cartiere rezidențiale de Nord' }
  ];

  for (const l of transitLines) {
    await client.query(`
      INSERT INTO m05_transit_lines (id, line_number, type, name, status, current_route_summary, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        current_route_summary = EXCLUDED.current_route_summary,
        updated_at = NOW();
    `, [l.id, l.lineNumber, l.type, l.name, l.status, l.summary]);
  }
  console.log(`   ✓ Seeded ${transitLines.length} m05_transit_lines in TimescaleDB.`);

  const detours = [
    {
      id: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
      lineNumber: '4',
      title: 'Deviere temporară Linia 4: Lucrări Bulevardul Cetății',
      reason: 'Modernizare infrastructură cale de rulare și racord rețea tramvaie Bozankaya.',
      status: 'detoured',
      affectedStops: ['Balta Verde', 'Gheorghe Lazăr', 'Cetății'],
      instructions: 'Tramvaiele circulă deviat prin Calea Bogdăneștilor. Pentru Bulevardul Cetății folosiți linia 4B.',
      replacementLine: '4B (Autobuz)',
      validFrom: '2026-11-10T06:00:00Z',
      validUntil: '2026-11-28T22:00:00Z'
    },
    {
      id: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e',
      lineNumber: '33',
      title: 'Traseu modificat Linia 33: Asfaltare sens giratoriu Calea Șagului',
      reason: 'Lucrări de frezare și așernere covor asfaltic la intersecția cu Liviu Rebreanu.',
      status: 'detoured',
      affectedStops: ['Piața Iuliu Maniu', 'Brâncoveanu'],
      instructions: 'Autobuzele ocolesc pe Bulevardul 16 Decembrie 1989. Stația Brâncoveanu este relocată temporar.',
      replacementLine: null,
      validFrom: '2026-11-14T07:00:00Z',
      validUntil: '2026-11-17T20:00:00Z'
    }
  ];

  for (const d of detours) {
    await client.query(`
      INSERT INTO m05_detour_alerts (
        id, line_number, title, reason, status, affected_stops,
        alternative_instructions, replacement_line, valid_from, valid_until, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        reason = EXCLUDED.reason,
        status = EXCLUDED.status,
        affected_stops = EXCLUDED.affected_stops,
        alternative_instructions = EXCLUDED.alternative_instructions;
    `, [d.id, d.lineNumber, d.title, d.reason, d.status, d.affectedStops, d.instructions, d.replacementLine, d.validFrom, d.validUntil]);
  }
  console.log(`   ✓ Seeded ${detours.length} m05_detour_alerts in TimescaleDB.`);

  console.log('\n================================================================');
  console.log('🎉 TIGER CLOUD TIMESCALEDB MIGRATION & SEEDING COMPLETED!');
  console.log('================================================================');
  await client.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
