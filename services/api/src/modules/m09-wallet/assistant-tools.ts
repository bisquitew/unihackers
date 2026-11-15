// Read-only assistant tool for the Solana wallet: the signed-in person's tickets, check-ins and POAP badges —
// the same wallet the app and the website show (core/wallets.ts, GET /v1/m/solana/tickets/mine).
// Nothing here mints or checks in; every Explorer link is verified live on devnet before it is offered.
import { normalizePlace } from '../../core/text.ts';
import { walletOf } from '../../core/wallets.ts';
import type { ToolContext } from '../m10-assistant/types.ts';
import { isOnChain, onChainStatuses } from './onchain.ts';

const NOT_SIGNED_IN = {
  signedIn: false,
  note: 'The user is not signed in, so there is no wallet to show. Tell them to sign in (app or website) to see their tickets and badges.',
};

/** The signed-in person's tickets and badges, or null for a guest. */
export function walletFor(ctx?: ToolContext): { tickets: any[]; poaps: any[] } | null {
  return ctx?.userSub ? walletOf(ctx.userSub) : null;
}

export const walletAssistantTools = [
  {
    name: 'get_my_tickets',
    description:
      "The signed-in user's event tickets and POAP attendance badges in their Solana wallet (Solana devnet, a test network): event, whether the ticket was checked in and when, and a Solana Explorer link for each one that is verified on-chain. Optionally only for one event (name or ticket id). Read-only.",
    parameters: {
      type: 'object',
      properties: {
        event: { type: 'string', description: 'Event name or ticket id to look for, e.g. "jazz". Leave empty for all tickets.' },
      },
    },
    handler: async (args: { event?: string }, ctx?: ToolContext) => {
      const wallet = walletFor(ctx);
      if (!wallet) return NOT_SIGNED_IN;
      const q = args.event?.trim() ? normalizePlace(args.event) : '';
      const matches = (title: string, id: string) =>
        !q || id.toLowerCase() === args.event!.trim().toLowerCase() || normalizePlace(title).includes(q) || q.split(' ').every((w) => normalizePlace(title).includes(w));
      const t = wallet.tickets.filter((x) => matches(x.eventTitle ?? '', x.ticketId ?? ''));
      const p = wallet.poaps.filter((x) => matches(x.eventTitle ?? '', x.poapId ?? ''));
      const status = await onChainStatuses([...t.map((x) => x.txSignature), ...p.map((x) => x.txSignature)].filter(Boolean));
      const link = (sig: string, url: string) => (sig && isOnChain(status[sig]) ? url : null);
      return {
        signedIn: true,
        network: 'Solana devnet (test network, no real money)',
        tickets: t.map((x) => ({
          event: x.eventTitle,
          ticketId: x.ticketId,
          checkedIn: !!x.isCheckedIn,
          mintedAt: x.mintedAt ?? null,
          onChain: x.txSignature ? status[x.txSignature] : 'unknown',
          explorerUrl: link(x.txSignature, x.explorerUrl),
        })),
        poapBadges: p.map((x) => ({ event: x.eventTitle, badge: x.badgeName, issuedAt: x.issuedAt ?? null, onChain: x.txSignature ? status[x.txSignature] : 'unknown', explorerUrl: link(x.txSignature, x.explorerUrl) })),
        note: [
          'Only share explorerUrl values that are present (they were verified on devnet just now).',
          'If onChain is "not_found", say the ticket is in the app but its devnet transaction could not be found; if "unknown", devnet could not be reached right now.',
          wallet.tickets.length === 0 && wallet.poaps.length === 0 ? 'The wallet is empty: the user gets a ticket by tapping "Get a ticket" on an event, and a badge when it is scanned at the door.' : '',
          q && t.length === 0 && p.length === 0 && (wallet.tickets.length || wallet.poaps.length) ? 'No ticket or badge matches that event.' : '',
        ].filter(Boolean).join(' '),
      };
    },
  },
];
