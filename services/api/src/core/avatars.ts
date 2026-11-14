// Profile pictures. Each one is a small flat illustration drawn from a seed (any text), so the same seed always gives the same picture
// and nothing is loaded from outside. Colours come from the hop palette: soft tints for the background, ink for the face.
const BACKGROUNDS = ['#E4DEF0', '#D6DEFF', '#C9F1E0', '#FFE0CC', '#FDE1EC', '#FFF0C2'];
const SKINS = ['#FFD9BF', '#F3B98F', '#D99A6C', '#B97A4F', '#8A5A3A', '#FFE7D1'];
const HAIR = ['#1A1033', '#3A2F5C', '#6B3E26', '#C98A3D', '#9B2D5C', '#2438C9'];
const SHIRTS = ['#3D5BFF', '#FF9A5C', '#35C99A', '#1A1033', '#FF6FA5', '#8FA3FF'];

// A small deterministic random generator (mulberry32) seeded from the text
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The picture for a seed, as an SVG string (a 128 x 128 circle). */
export function avatarSvg(seed: string): string {
  const r = rng(seed || 'hop');
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const bg = pick(BACKGROUNDS);
  const skin = pick(SKINS);
  const hair = pick(HAIR);
  const shirt = pick(SHIRTS);
  const hairStyle = Math.floor(r() * 4); // 0 short, 1 long, 2 bun, 3 none
  const eyes = Math.floor(r() * 3); // 0 dots, 1 happy arcs, 2 wide
  const mouth = Math.floor(r() * 3); // 0 smile, 1 grin, 2 small
  const glasses = r() < 0.25;

  const hairBack = hairStyle === 1 ? `<path d="M34 70c-6-34 12-46 30-46s36 12 30 46v22H34z" fill="${hair}"/>` : '';
  const hairTop =
    hairStyle === 0 ? `<path d="M40 56c0-18 10-24 24-24s24 6 24 24c-8-8-16-10-24-10s-16 2-24 10z" fill="${hair}"/>`
    : hairStyle === 1 ? `<path d="M38 58c0-20 11-26 26-26s26 6 26 26c-9-9-17-11-26-11s-17 2-26 11z" fill="${hair}"/>`
    : hairStyle === 2 ? `<circle cx="64" cy="26" r="11" fill="${hair}"/><path d="M40 56c0-17 10-22 24-22s24 5 24 22c-8-7-16-9-24-9s-16 2-24 9z" fill="${hair}"/>`
    : '';
  const eyeSvg =
    eyes === 0 ? `<circle cx="53" cy="66" r="3.2" fill="#1A1033"/><circle cx="75" cy="66" r="3.2" fill="#1A1033"/>`
    : eyes === 1 ? `<path d="M48 67q5-6 10 0M70 67q5-6 10 0" fill="none" stroke="#1A1033" stroke-width="3" stroke-linecap="round"/>`
    : `<circle cx="53" cy="66" r="4.5" fill="#fff"/><circle cx="75" cy="66" r="4.5" fill="#fff"/><circle cx="53" cy="66" r="2.4" fill="#1A1033"/><circle cx="75" cy="66" r="2.4" fill="#1A1033"/>`;
  const mouthSvg =
    mouth === 0 ? `<path d="M54 80q10 9 20 0" fill="none" stroke="#1A1033" stroke-width="3" stroke-linecap="round"/>`
    : mouth === 1 ? `<path d="M52 79h24q-2 12-12 12t-12-12z" fill="#1A1033"/><path d="M56 79h16v4H56z" fill="#fff"/>`
    : `<path d="M58 82q6 4 12 0" fill="none" stroke="#1A1033" stroke-width="3" stroke-linecap="round"/>`;
  const glassesSvg = glasses
    ? `<g fill="none" stroke="#1A1033" stroke-width="2.4"><circle cx="53" cy="66" r="8.5"/><circle cx="75" cy="66" r="8.5"/><path d="M61.5 66h5"/></g>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="Profile picture">
<defs><clipPath id="c"><circle cx="64" cy="64" r="64"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="128" height="128" fill="${bg}"/>
${hairBack}
<path d="M18 128c0-24 20-36 46-36s46 12 46 36z" fill="${shirt}"/>
<rect x="55" y="82" width="18" height="16" rx="6" fill="${skin}"/>
<ellipse cx="64" cy="66" rx="25" ry="28" fill="${skin}"/>
${hairTop}${eyeSvg}${glassesSvg}${mouthSvg}
<circle cx="45" cy="76" r="4" fill="#FF6FA5" opacity=".25"/><circle cx="83" cy="76" r="4" fill="#FF6FA5" opacity=".25"/></g></svg>`;
}

/** The path the picture is served from. Stored in the database as the user's avatar. */
export const avatarPath = (seed: string) => `/v1/core/avatars/${encodeURIComponent(seed)}.svg`;

export const randomSeed = () => Math.random().toString(36).slice(2, 10);
