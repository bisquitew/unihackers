import type { AvatarTone } from '@hub/ui';

const TONES: AvatarTone[] = ['apricot', 'blue', 'mint', 'ink'];

/** "Ana Radu" becomes "AR". */
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** The same person always gets the same avatar colour. "You" is always ink. */
export function toneFor(key: string): AvatarTone {
  if (key === 'You') return 'ink';
  let n = 0;
  for (const ch of key) n = (n + ch.charCodeAt(0)) % 97;
  return TONES[n % 3];
}
