// Demo community activity for the Timișoara City Hub (P4). Run against a running API:
//   node scripts/seed-demo-activity.mjs [http://localhost:8000]
// Everything goes through the public API, exactly like the app and website do (same validation, same tables), so it
// never bypasses anyone's code. People are fictional (…@example.com). It never creates feedback, survey answers or
// safety/smell reports (those must stay real; the modules show their own labelled demo data).
// Safe to run twice: posts, buddy requests, tickets and pins that already exist are skipped.
// Every created id is printed at the end (and written to $SEED_MANIFEST if set) so it can be removed again.
import fs from 'node:fs';

const API = (process.argv[2] || process.env.API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const created = { users: [], posts: [], comments: [], upvotes: 0, buddyRequests: [], chats: [], messages: 0, tickets: [], pins: [] };

async function call(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

// --- fictional neighbours (simulated Google sign-in creates each one with its own session) ---
const NEIGHBOURS = {
  ioana: { name: 'Ioana Mureșan', email: 'ioana.muresan@example.com', area: 'Iosefin' },
  mihai: { name: 'Mihai Stoica', email: 'mihai.stoica@example.com', area: 'Fabric' },
  bianca: { name: 'Bianca Toma', email: 'bianca.toma@example.com', area: 'Complex Studențesc' },
  vlad: { name: 'Vlad Popa', email: 'vlad.popa@example.com', area: 'Cetate' },
  carmen: { name: 'Carmen Ilie', email: 'carmen.ilie@example.com', area: 'Elisabetin' },
  sorin: { name: 'Sorin Dragomir', email: 'sorin.dragomir@example.com', area: 'Circumvalațiunii' },
};
const ANDREI = 'dev_resident'; // the demo resident the app's email login and the website's "Resident" button use

const NEW_POSTS = [
  { by: 'mihai', category: 'lost_pets', neighbourhood: 'Fabric', title: 'Pisică tigrată pierdută lângă Piața Traian',
    content: 'Motanul nostru, Ghimbir, tigrat cu zgardă verde, a ieșit ieri seară pe Str. Ștefan cel Mare și nu s-a mai întors. Este blând dar fricos. Dacă îl vedeți, vă rog scrieți aici. Mulțumim!' },
  { by: 'ioana', category: 'neighbourhood', neighbourhood: 'Iosefin', title: 'Șantierul de pe Văcărescu lucrează și după ora 22',
    content: 'De trei seri utilajele merg până aproape de miezul nopții. Știe cineva dacă au aprobare pentru program prelungit? Aș vrea să sesizez la primărie, dar mai întâi să văd dacă și alți vecini sunt deranjați.' },
  { by: 'bianca', category: 'help', neighbourhood: 'Complex Studențesc', title: 'Unde pot recicla electronice vechi în Timișoara?',
    content: 'Am un laptop stricat, un router și câteva încărcătoare. Există un punct de colectare aproape de Complex, sau zile speciale de colectare?' },
  { by: 'carmen', category: 'buy_sell', neighbourhood: 'Elisabetin', title: 'Dau gratuit o bicicletă de copil (16 inch)',
    content: 'Bicicletă roșie, roți ajutătoare incluse, frânele merg bine. Pentru un copil de 4–6 ani. Se ridică din zona Pieței Bălcescu.' },
  { by: 'vlad', category: 'cultural', neighbourhood: 'Cetate', title: 'Mergem în grup la JazzTM Jam Session?',
    content: 'Merg la sesiunea de jazz din Piața Sf. Gheorghe și caut 2–3 oameni cu care să stăm împreună. Ne putem vedea înainte la o cafea în Unirii.' },
];

const COMMENTS = {
  'Pisică tigrată pierdută lângă Piața Traian': [['carmen', 'Am văzut ieri o pisică tigrată în curtea de pe Str. Dacilor, nr. 5. Merită verificat!'], ['vlad', 'Distribui și pe grupul blocului. Sper să-l găsiți repede.']],
  'Șantierul de pe Văcărescu lucrează și după ora 22': [['sorin', 'Și noi îi auzim. Programul legal e până la 22, merită sesizare.'], ['bianca', 'Poți face o sesizare de „zgomot noaptea” din secțiunea Siguranță, apare pe hartă pentru toți.']],
  'Unde pot recicla electronice vechi în Timișoara?': [['ioana', 'Magazinele mari de electronice preiau electronice vechi, inclusiv cele de la Iulius Town.'], ['mihai', 'Primăria anunță periodic zile de colectare a deșeurilor voluminoase, urmărește alertele din aplicație.']],
  'Dau gratuit o bicicletă de copil (16 inch)': [['sorin', 'Dacă mai e disponibilă, aș lua-o pentru nepotul meu. Pot trece mâine după 17:00.']],
  'Mergem în grup la JazzTM Jam Session?': [['ioana', 'Vin și eu! Pot ajunge pe la 19:30.'], ['mihai', 'Sună bine, scrie-ne unde ne vedem.']],
};
// comments on the posts the team already seeded
const EXISTING_POST_COMMENTS = {
  'post-copaci-cetate': [['ioana', 'Foarte bună idee, vara pe Alba Iulia e greu de mers pe jos la prânz.'], ['vlad', 'Aș propune și bănci la umbră lângă copaci.']],
  'post-piste-bega': [['mihai', 'Merg zilnic cu bicicleta pe acolo, o pistă separată ar ajuta mult.'], ['carmen', 'Și iluminat pe porțiunea de lângă Uzina, seara e foarte întuneric.']],
  'post-parcare-complex': [['bianca', 'Seara nu găsești loc deloc pe Aleea Studenților.']],
  'post-piata-traian': [['sorin', 'Piața Traian are potențial uriaș, susțin!'], ['bianca', 'Un târg de weekend ar aduce lumea înapoi în zonă.']],
};

const BUDDY = [
  { by: 'ioana', eventId: 'evt-cinema-victoria-01', bio: 'Studentă la Litere, iubesc filmul european.', university: 'UVT', interests: ['film', 'fotografie', 'cafea'] },
  { by: 'sorin', eventId: 'evt-bega-run-2026', bio: 'Alerg de 2 ani, ritm relaxat, caut partener de alergare.', university: 'Resident', interests: ['alergare', 'natură'] },
];

const ANDREI_TICKETS = ['evt-jazztm-cetate', 'evt-plai-2026'];
const ANDREI_PINS = [
  { kind: 'home', title: 'Acasă', latitude: 45.7466, longitude: 21.2105, subtitle: 'Iosefin' },
  { kind: 'work', title: 'Birou', latitude: 45.7537, longitude: 21.2257, subtitle: 'Piața Victoriei' },
  { kind: 'favourite', title: 'Parcul Rozelor', latitude: 45.7489, longitude: 21.2347, subtitle: 'Plimbare de seară' },
];

const idOf = (r) => r?.id ?? r?.post?.id ?? r?.comment?.id ?? r?.request?.id ?? r?.buddyRequest?.id ?? r?.chat?.id ?? null;

async function main() {
  console.log(`Seeding demo community activity into ${API}`);
  const health = await call('GET', '/v1/core/tiger/status').catch(() => null);
  console.log(`Database: ${health?.status === 'connected' ? 'Tiger Cloud (saved)' : 'not connected — data will only live in this API process'}`);

  // 1. neighbours
  const token = {};
  for (const [key, n] of Object.entries(NEIGHBOURS)) {
    const r = await call('POST', '/v1/core/auth/google-login', undefined, { email: n.email, name: n.name });
    token[key] = r.token;
    created.users.push(n.name);
  }
  token.andrei = ANDREI;

  // 2. forum posts (skip titles that already exist)
  const existing = (await call('GET', '/v1/m/forum', ANDREI)).posts ?? [];
  const byTitle = new Map(existing.map((p) => [p.title, p.id]));
  for (const p of NEW_POSTS) {
    if (byTitle.has(p.title)) continue;
    const r = await call('POST', '/v1/m/forum', token[p.by], { category: p.category, neighbourhood: p.neighbourhood, title: p.title, content: p.content });
    const id = idOf(r);
    byTitle.set(p.title, id);
    created.posts.push({ id, title: p.title });
  }

  // 3. comments (only on posts this run created, plus the seeded posts that have no comments yet) and upvotes
  const fresh = new Set(created.posts.map((p) => p.id));
  const targets = [
    ...Object.entries(COMMENTS).map(([title, list]) => [byTitle.get(title), list]).filter(([id]) => fresh.has(id)),
    ...Object.entries(EXISTING_POST_COMMENTS).filter(([id]) => existing.some((p) => p.id === id && !(p.comments || []).length)),
  ];
  for (const [postId, list] of targets) {
    for (const [by, content] of list) {
      const r = await call('POST', `/v1/m/forum/${encodeURIComponent(postId)}/comments`, token[by], { content });
      created.comments.push({ postId, id: idOf(r) });
    }
  }
  const voters = Object.keys(NEIGHBOURS);
  for (const [i, postId] of [...fresh].entries()) {
    for (const v of voters.slice(0, 2 + (i % 4))) {
      await call('POST', `/v1/m/forum/${encodeURIComponent(postId)}/upvote`, token[v]).catch(() => {});
      created.upvotes += 1;
    }
  }

  // 4. buddy requests and one chat between Andrei and Ioana about the jazz evening
  const events = (await call('GET', '/v1/m/events')).events ?? [];
  const titleOf = (id) => events.find((e) => e.id === id)?.title ?? id;
  const buddyNow = (await call('GET', '/v1/m/buddy')).buddyRequests ?? [];
  for (const b of BUDDY) {
    const n = NEIGHBOURS[b.by];
    if (buddyNow.some((x) => x.userName === n.name && x.eventId === b.eventId)) continue;
    const r = await call('POST', '/v1/m/buddy', token[b.by], { eventId: b.eventId, eventTitle: titleOf(b.eventId), userName: n.name, bio: b.bio, university: b.university, interests: b.interests });
    created.buddyRequests.push({ id: idOf(r), event: b.eventId });
  }
  const ioanaSub = (await call('GET', '/v1/core/auth/me', token.ioana)).sub;
  const chat = await call('POST', '/v1/m/buddy/chats', ANDREI, {
    eventId: 'evt-jazztm-cetate', eventTitle: titleOf('evt-jazztm-cetate'), participantIds: [ioanaSub], participantNames: [NEIGHBOURS.ioana.name],
  });
  const chatId = idOf(chat);
  const already = (chat.messages ?? chat.chat?.messages ?? []).length > 0;
  if (chatId && !already) {
    created.chats.push(chatId);
    for (const [who, content] of [
      [ANDREI, 'Salut! Am văzut că mergi și tu la JazzTM. Ne vedem acolo?'],
      [token.ioana, 'Salut! Da, ajung pe la 19:30. Stăm lângă scenă?'],
      [ANDREI, 'Perfect, te aștept la intrarea dinspre Piața Unirii.'],
    ]) {
      await call('POST', `/v1/m/buddy/chats/${encodeURIComponent(chatId)}/messages`, who, { content });
      created.messages += 1;
    }
  }

  // 5. Andrei's tickets: RSVP + a real ticket on Solana devnet, like "Get a ticket" in the app
  const wallet = await call('GET', '/v1/m/solana/tickets/mine', ANDREI);
  // SEED_SKIP_TICKETS=1 for a dry run: minting sends a real transaction to Solana devnet
  for (const eventId of process.env.SEED_SKIP_TICKETS ? [] : ANDREI_TICKETS) {
    if ((wallet.tickets ?? []).some((t) => t.eventId === eventId)) continue;
    await call('POST', `/v1/m/events/${encodeURIComponent(eventId)}/rsvp`, ANDREI, { userName: 'Andrei Timișan', lookingForBuddy: false }).catch(() => {});
    const t = await call('POST', '/v1/m/solana/tickets/mint', ANDREI, { eventId, eventTitle: titleOf(eventId), attendeeName: 'Andrei Timișan' });
    created.tickets.push({ ticketId: t.ticketId, eventId, signature: t.txSignature, onChain: t.onChainConfirmed });
  }

  // 6. Andrei's own map pins (private: home, work, a favourite place)
  const pins = (await call('GET', '/v1/core/user/pins', ANDREI)).pins ?? [];
  const missing = ANDREI_PINS.filter((p) => !pins.some((x) => x.kind === p.kind && x.title === p.title));
  if (missing.length) {
    const now = new Date().toISOString();
    const add = missing.map((p, i) => ({
      id: `pin-demo-${p.kind}-${i}`, kind: p.kind, layerId: 'mine', coordinate: { latitude: p.latitude, longitude: p.longitude },
      title: p.title, subtitle: p.subtitle, visibility: 'private', owner: 'me', createdAt: now,
    }));
    await call('PUT', '/v1/core/user/pins', ANDREI, { pins: [...add, ...pins] });
    created.pins.push(...add.map((p) => p.id));
  }

  console.log(JSON.stringify(created, null, 2));
  if (process.env.SEED_MANIFEST) fs.writeFileSync(process.env.SEED_MANIFEST, JSON.stringify(created, null, 2));
}

main().catch((err) => {
  console.error('Seed stopped:', err.message);
  console.log('Created before the error:', JSON.stringify(created));
  process.exit(1);
});
