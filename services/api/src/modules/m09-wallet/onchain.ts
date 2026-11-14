// Read-only check that a transaction signature really exists on Solana devnet (public JSON-RPC, no keys).
// Used so the assistant only shows Explorer links that open a real transaction.
import { SOLANA_CONFIG } from '../../../../../packages/solana/src/config.ts';

export type OnChainStatus = 'finalized' | 'confirmed' | 'processed' | 'failed' | 'not_found' | 'unknown';

const CACHE_MS = 5 * 60_000;
const TIMEOUT_MS = 5_000;
const cache = new Map<string, { status: OnChainStatus; at: number }>();

/** Status per signature. 'unknown' means devnet could not be reached (nothing is cached then). */
export async function onChainStatuses(signatures: string[]): Promise<Record<string, OnChainStatus>> {
  const out: Record<string, OnChainStatus> = {};
  const now = Date.now();
  const todo = signatures.filter((s) => {
    const hit = cache.get(s);
    if (hit && now - hit.at < CACHE_MS) {
      out[s] = hit.status;
      return false;
    }
    return true;
  });
  if (todo.length === 0) return out;

  try {
    const res = await fetch(process.env.SOLANA_RPC_URL?.trim() || SOLANA_CONFIG.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignatureStatuses', params: [todo, { searchTransactionHistory: true }] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await res.json()) as { result?: { value?: ({ err: unknown; confirmationStatus?: string } | null)[] } };
    const values = data.result?.value;
    if (!res.ok || !Array.isArray(values)) throw new Error(`RPC ${res.status}`);
    todo.forEach((sig, i) => {
      const v = values[i];
      const status: OnChainStatus = !v ? 'not_found' : v.err ? 'failed' : ((v.confirmationStatus as OnChainStatus) ?? 'confirmed');
      out[sig] = status;
      cache.set(sig, { status, at: now });
    });
  } catch (err) {
    console.warn(`[m09-wallet] devnet check failed: ${err instanceof Error ? err.message : String(err)}`);
    for (const sig of todo) out[sig] = 'unknown';
  }
  return out;
}

export const isOnChain = (s: OnChainStatus) => s === 'finalized' || s === 'confirmed';
