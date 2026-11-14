// Gemini <-> Solana through Solana's official MCP servers (P4).
//  - Solana Explorer MCP (https://explorer.solana.com/mcp): `inspect_entity` reads any transaction or address live,
//    here always on devnet. Used to check that a wallet ticket or POAP really is on-chain and what its memo says.
//  - Solana Developer MCP (https://mcp.solana.com/mcp): `Solana_Documentation_Search` answers "what is X" questions
//    from the official Solana docs instead of the model's memory.
// Read-only: no keys, no signing, only these two tools are allowed. Failures become a short "unavailable" answer.
import { McpError, McpHttpClient } from '../../core/mcp-client.ts';
import { getAccountExplorerUrl, getSolanaExplorerUrl, ORGANIZER_WALLET_ADDRESS } from '../../../../../packages/solana/src/config.ts';
import { normalizePlace } from '../../core/text.ts';
import { DEMO_WALLET } from './seed.ts';
import { walletService } from './service.ts';

export const EXPLORER_MCP_URL = process.env.SOLANA_EXPLORER_MCP_URL || 'https://explorer.solana.com/mcp';
export const DOCS_MCP_URL = process.env.SOLANA_DOCS_MCP_URL || 'https://mcp.solana.com/mcp';
const CLUSTER = 'devnet';

const explorer = new McpHttpClient(EXPLORER_MCP_URL, { allowedTools: ['inspect_entity'], timeoutMs: 10_000, cacheMs: 5 * 60_000 });
const docs = new McpHttpClient(DOCS_MCP_URL, { allowedTools: ['Solana_Documentation_Search'], timeoutMs: 15_000, cacheMs: 30 * 60_000 });

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,90}$/;
const short = (s: string) => (s.length > 14 ? `${s.slice(0, 4)}…${s.slice(-4)}` : s);

const unavailable = (source: string, err: unknown) => ({
  available: false,
  source,
  reason: err instanceof McpError ? err.message : 'unexpected error',
  note: 'Tell the user that Solana could not be checked right now and to try again in a minute. Do not guess the result.',
});

/** "UNIHACK-TIMISOARA:TICKET|id=…|event=…|title=…" -> { type: 'TICKET', fields: { id, event, title } } */
export function parseHubMemo(memo: string): { type: string; fields: Record<string, string> } | null {
  const m = /^UNIHACK-TIMISOARA:([A-Z_]+)\|(.*)$/s.exec(memo.trim());
  if (!m) return null;
  const fields: Record<string, string> = {};
  for (const part of m[2].split('|')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const key = part.slice(0, eq);
    let value = part.slice(eq + 1);
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep raw
    }
    // wallet addresses stay short in answers
    fields[key] = BASE58.test(value) ? short(value) : value;
  }
  return { type: m[1], fields };
}

interface WalletItem {
  kind: 'ticket' | 'poap';
  id: string;
  event: string;
  signature: string;
}

async function walletItems(): Promise<WalletItem[]> {
  const [tickets, poaps] = await Promise.all([walletService.listUserTickets(DEMO_WALLET), walletService.listUserPoaps(DEMO_WALLET)]);
  return [
    ...tickets.map((t) => ({ kind: 'ticket' as const, id: t.ticketId, event: t.eventTitle, signature: t.txSignature })),
    ...poaps.map((p) => ({ kind: 'poap' as const, id: p.poapId, event: p.eventTitle, signature: p.txSignature })),
  ];
}

function findWalletItem(items: WalletItem[], query: string): WalletItem | null {
  const raw = query.trim().toLowerCase();
  const q = normalizePlace(query);
  return (
    items.find((i) => i.id.toLowerCase() === raw || i.signature === query.trim()) ??
    items.find((i) => q && (normalizePlace(i.event).includes(q) || q.split(' ').every((w) => normalizePlace(i.event).includes(w)))) ??
    null
  );
}

function summariseTransaction(entity: any, item: WalletItem | null) {
  const memos: string[] = (entity.instructions ?? [])
    .filter((ix: any) => ix?.decoded?.type === 'memo' && typeof ix.decoded.info === 'string')
    .map((ix: any) => ix.decoded.info);
  const memo = memos.length ? parseHubMemo(memos[0]) : null;
  const signers: string[] = Array.isArray(entity.signers) ? entity.signers : [];
  const titleOnChain = memo?.fields.title ?? '';
  const matches =
    item && memo
      ? {
          sameId: memo.fields.id === item.id,
          sameEvent: !!titleOnChain && (normalizePlace(titleOnChain).includes(normalizePlace(item.event)) || normalizePlace(item.event).includes(normalizePlace(titleOnChain))),
        }
      : null;
  return {
    found: true,
    kind: 'transaction',
    status: entity.status ?? (entity.error ? 'failed' : 'unknown'),
    confirmation: entity.confirmation_status ?? null,
    time: typeof entity.block_time === 'number' ? new Date(entity.block_time * 1000).toISOString() : null,
    feeSol: typeof entity.fee_lamports === 'number' ? entity.fee_lamports / 1e9 : null,
    signedBy: signers.map(short),
    signedByEventOrganizer: signers.includes(ORGANIZER_WALLET_ADDRESS),
    program: memos.length ? 'Memo program (the ticket data is written as a note on the transaction)' : null,
    onChainRecord: memo ? { type: memo.type, ...memo.fields } : memos[0]?.slice(0, 200) ?? null,
    appRecord: item ? { kind: item.kind, id: item.id, event: item.event } : null,
    matchesApp: matches,
    explorerUrl: typeof entity.signature === 'string' ? getSolanaExplorerUrl(entity.signature, CLUSTER) : null,
  };
}

/** Code files are not explanations for residents. */
const CODE_FILE = /\.(ts|tsx|js|mjs|rs|json|toml|cfg|py|go|sol|yaml|yml|lock)$|\/idl\//i;
const MIN_SCORE = 0.3;

/**
 * The docs search returns "### n. [Title](url)\n\n_source: x · score: 0.99_\n\ntext" blocks.
 * Keep up to 3 readable pages (no source code files) with a usable relevance score, trimmed.
 */
export function pickReadableMatches(text: string): { title: string; url: string | null; excerpt: string; score: number }[] {
  return text
    .split(/\n(?=### \d+\. )/)
    .filter((b) => b.startsWith('### '))
    .map((b) => {
      const head = /^### \d+\. \[([^\]]+)\]\(([^)]+)\)/.exec(b);
      const score = Number(/score:\s*([\d.]+)/.exec(b)?.[1] ?? 0);
      const excerpt = b
        .replace(/^### .*\n/, '')
        .replace(/^_source:.*_\s*$/m, '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 700);
      return { title: head?.[1] ?? 'Solana docs', url: head?.[2] ?? null, excerpt, score };
    })
    .filter((m) => m.score >= MIN_SCORE && !CODE_FILE.test(m.url ?? '') && !CODE_FILE.test(m.title) && m.excerpt.length >= 80)
    .slice(0, 3);
}

export const solanaMcpTools = [
  {
    name: 'verify_on_solana',
    description:
      "Checks live on the Solana blockchain (devnet, a test network) whether one of the user's wallet tickets or POAP badges is really on-chain, or inspects any Solana transaction signature or address. Uses Solana's official Explorer MCP server. Returns status, time, fee, who signed it (the event organizer or not) and the ticket data written on-chain, compared with the app's record. Read-only.",
    parameters: {
      type: 'object',
      properties: {
        ticket: { type: 'string', description: 'A ticket or badge from the user\'s wallet: event name or id, e.g. "jazz" or "tkt-sol-jazz-002".' },
        id: { type: 'string', description: 'A Solana transaction signature or account address the user pasted.' },
      },
    },
    handler: async (args: { ticket?: string; id?: string }) => {
      const items = await walletItems();
      let item: WalletItem | null = null;
      let identifier = args.id?.trim() ?? '';
      if (!identifier && args.ticket?.trim()) {
        // "my badges" / "my tickets" (optionally "jazz badge"): check every matching item of that kind
        const kindWord = /\b(poaps?|badges?|insigne?|insignă|insigna)\b/i.test(args.ticket) ? 'poap' : /\b(tickets?|bilete?|biletul)\b/i.test(args.ticket) ? 'ticket' : null;
        const rest = args.ticket.replace(/\b(poaps?|badges?|insigne?|insignă|insigna|tickets?|bilete?|biletul|my|mele|meu|all|toate)\b/gi, '').trim();
        if (kindWord) {
          const ofKind = items.filter((i) => i.kind === kindWord);
          const picked = rest ? ofKind.filter((i) => findWalletItem([i], rest)) : ofKind;
          if (picked.length > 0) {
            const results = await Promise.all(picked.slice(0, 4).map((i) => inspect(i.signature, i)));
            return { checked: results.length, results };
          }
        }
        item = findWalletItem(items, args.ticket);
        if (!item) {
          return {
            found: false,
            reason: `No ticket or badge in the wallet matches "${args.ticket}".`,
            walletHas: items.map((i) => `${i.kind}: ${i.event} (${i.id})`),
          };
        }
        identifier = item.signature;
      }
      if (!identifier) return { found: false, reason: 'Say which ticket, transaction or address to check.' };
      if (!BASE58.test(identifier)) return { found: false, reason: 'That is not a valid Solana signature or address.' };
      item ??= items.find((i) => i.signature === identifier) ?? null;
      return inspect(identifier, item);
    },
  },
  {
    name: 'search_solana_docs',
    description:
      'Searches the official Solana documentation (Solana Foundation\'s Developer MCP server) to explain Solana concepts the user asks about: what a POAP, wallet, devnet, transaction, memo, NFT or fee is, how tickets on a blockchain work. Use it instead of answering about Solana from memory.',
    parameters: {
      type: 'object',
      properties: { question: { type: 'string', description: 'The concept or question, in English, e.g. "What is the memo program?"' } },
      required: ['question'],
    },
    handler: async (args: { question?: string }) => searchDocs(args.question ?? ''),
  },
];

/** Reads one signature or address on devnet through the Explorer MCP and explains it, compared with the wallet item. */
async function inspect(identifier: string, item: WalletItem | null) {
  const base = { source: 'Solana Explorer MCP (explorer.solana.com/mcp), live', network: 'Solana devnet (test network, no real money)' };
  const isAddress = identifier.length <= 44;
  let entity: any = null;
  try {
    const result = await explorer.callTool('inspect_entity', { identifier, cluster: CLUSTER });
    entity = (result.data as any)?.payload?.entity ?? null;
  } catch (err) {
    // the Explorer reports a missing transaction as a tool error with code NOT_FOUND: that is an answer, not an outage
    if (!(err instanceof McpError && err.kind === 'tool' && /NOT_FOUND/.test(err.message))) return unavailable('Solana Explorer MCP', err);
  }
  if (isAddress && entity?.kind === 'unknown') {
    // plain wallet accounts are not decoded by the Explorer MCP; that does not mean they do not exist
    return {
      ...base,
      found: null,
      kind: 'address',
      isEventOrganizer: identifier === ORGANIZER_WALLET_ADDRESS,
      note: 'The Explorer has no decoded details for this address (plain wallets show none here). Do not say it does not exist; give the Explorer link so the user can see its activity.',
      explorerUrl: getAccountExplorerUrl(identifier, CLUSTER),
    };
  }
  if (!entity || entity.kind === 'unknown') {
    return {
      ...base,
      found: false,
      appRecord: item ? { kind: item.kind, id: item.id, event: item.event } : null,
      note: item
        ? 'This ticket is in the app, but its transaction was not found on devnet. Say so plainly; do not call it fake, it may not have been minted on devnet.'
        : 'Nothing was found on devnet for this identifier.',
      // no link for a transaction that is not there: it would open an empty page
      explorerUrl: isAddress ? getAccountExplorerUrl(identifier, CLUSTER) : null,
    };
  }
  if (entity.kind === 'transaction') {
    const summary = summariseTransaction(entity, item);
    const note =
      summary.matchesApp && (!summary.matchesApp.sameId || !summary.matchesApp.sameEvent)
        ? 'The transaction exists and is confirmed, but the data written on-chain does not match the app\'s ticket (different id or event). Tell the user honestly; it is a demo record that points at another test transaction.'
        : 'Explain in plain words: confirmed on Solana devnet, when, signed by the event organizer, and what the on-chain note says. Times are UTC: convert to Timișoara time.';
    return { ...base, ...summary, note };
  }
  // an account: keep the useful top-level fields only
  const keep = ['kind', 'lamports', 'owner', 'executable', 'data_size', 'program', 'type'];
  const account: Record<string, unknown> = {};
  for (const k of keep) if (k in entity) account[k] = entity[k];
  if (typeof entity.lamports === 'number') account.balanceSol = entity.lamports / 1e9;
  return { ...base, found: true, ...account, isEventOrganizer: identifier === ORGANIZER_WALLET_ADDRESS, explorerUrl: getAccountExplorerUrl(identifier, CLUSTER) };
}

/** Searches the Solana docs through the Developer MCP and returns up to 3 readable excerpts. */
async function searchDocs(rawQuestion: string) {
  const question = rawQuestion.trim().slice(0, 300);
  if (!question) return { found: false, reason: 'No question given.' };
  let result;
  try {
    result = await docs.callTool('Solana_Documentation_Search', { query: question });
  } catch (err) {
    return unavailable('Solana Developer MCP', err);
  }
  const matches = pickReadableMatches(result.text);
  const source = 'Solana developer documentation via the Solana Foundation\'s Developer MCP server (mcp.solana.com)';
  if (matches.length === 0) {
    return {
      source,
      found: false,
      note: 'The Solana docs have nothing clear on this. Say so in one sentence; if you add a general explanation, say it is general knowledge, not from the Solana docs.',
    };
  }
  return {
    source,
    found: true,
    matches,
    note: 'Answer in 2-4 plain sentences for a non-developer, in the user\'s language, based only on these excerpts, and give the most relevant url as "Sursa"/"Source". If the excerpts do not actually explain what was asked, say the Solana docs do not cover it instead of stretching them.',
  };
}
