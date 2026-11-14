// Gives every user in the database a random profile picture (a seed, served as /v1/core/avatars/<seed>.svg).
// Safe to re-run: it only fills users that have none. Run: node --experimental-strip-types scripts/seed-avatars.mts
import { readFileSync } from 'node:fs';
import { db } from '../services/api/src/core/db.ts';
import { avatarPath, randomSeed } from '../services/api/src/core/avatars.ts';

await new Promise((r) => setTimeout(r, 4000));
if (!db.isTigerConnected()) { console.error('The database is not connected.'); process.exit(1); }

for (const stmt of readFileSync('db/core/migrations/003_user_avatars.sql', 'utf8').split(';').map((s) => s.replace(/--.*$/gm, '').trim()).filter(Boolean)) await db.query(stmt);

const byId = new Map<string, string>();
const users = await db.query<{ id: string; name: string; avatar_url: string | null }>('SELECT id, name, avatar_url FROM core_users');
for (const u of users) {
  const url = u.avatar_url || avatarPath(randomSeed());
  if (!u.avatar_url) await db.query('UPDATE core_users SET avatar_url = $1 WHERE id = $2', [url, u.id]);
  byId.set(u.id, url);
}
console.log(`users: ${users.length}`);

// the same person keeps the same picture wherever they appear; people without an account row get their own random one
const pictureFor = (id: string) => byId.get(id) ?? (byId.set(id, avatarPath(randomSeed())), byId.get(id)!);
const buddies = await db.query<{ id: string; user_id: string }>('SELECT id, user_id FROM m07_buddy_requests WHERE user_avatar IS NULL');
for (const b of buddies) await db.query('UPDATE m07_buddy_requests SET user_avatar = $1 WHERE id = $2', [pictureFor(b.user_id), b.id]);
const posts = await db.query<{ id: string; author_id: string }>('SELECT id, author_id FROM m08_forum_posts WHERE author_avatar IS NULL');
for (const p of posts) await db.query('UPDATE m08_forum_posts SET author_avatar = $1 WHERE id = $2', [pictureFor(p.author_id), p.id]);
console.log(`buddy requests: ${buddies.length}, forum posts: ${posts.length}`);
console.log(JSON.stringify(await db.query('SELECT name, avatar_url FROM core_users')));
process.exit(0);
