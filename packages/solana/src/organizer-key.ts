// Must stay the first import: Hermes (the phone JS engine) has no crypto.getRandomValues, which Keypair.generate() needs.
// On the web this is a no-op because browsers already provide it.
import 'react-native-get-random-values';
import { Keypair } from '@solana/web3.js';

// Public Address for Timișoara Cultural Hub (Safe for public GitHub repositories)
export const ORGANIZER_PUBLIC_KEY = 'H6oCfQHkpFg6rUhZmx1e6szoRveAVFrN4ji7P4HJvPU1';

/**
 * Loads the organizer secret key securely without committing private keys to git:
 * 1. Checks process.env.SOLANA_ORGANIZER_SECRET_KEY (from .env)
 * 2. Fallback: generates ephemeral keypair
 */
function resolveSecretKey(): Uint8Array {
  const envVal =
    (typeof process !== 'undefined' && process.env?.SOLANA_ORGANIZER_SECRET_KEY) || '';

  if (envVal) {
    try {
      const clean = envVal.trim();
      if (clean.startsWith('[')) {
        return new Uint8Array(JSON.parse(clean));
      }
      return new Uint8Array(clean.split(',').map((n) => parseInt(n.trim(), 10)));
    } catch (e) {
      console.warn('[Solana] Could not parse SOLANA_ORGANIZER_SECRET_KEY from env:', e);
    }
  }

  // Safe fallback if .env is missing (e.g. in public CI or fresh clone)
  return Keypair.generate().secretKey;
}

export const ORGANIZER_SECRET_KEY = resolveSecretKey();
