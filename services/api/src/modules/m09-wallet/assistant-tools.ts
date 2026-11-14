// Read-only assistant tool for the Solana wallet: tickets, check-ins and POAP badges of the demo wallet.
// Nothing here mints or checks in; every Explorer link is verified live on devnet before it is offered.
import { getAccountExplorerUrl } from '../../../../../packages/solana/src/config.ts';
import { normalizePlace } from '../../core/text.ts';
import { DEMO_WALLET } from './seed.ts';
import { isOnChain, onChainStatuses } from './onchain.ts';
import { walletService } from './service.ts';

const shortWallet = (w: string) => (w.length > 12 ? `${w.slice(0, 4)}…${w.slice(-4)}` : w);

export const walletAssistantTools = [
  {
    name: 'get_my_tickets',
    description:
      "The user's event tickets and POAP attendance badges in the app's Solana wallet (demo wallet on Solana devnet, a test network): event, whether the ticket was checked in and when, and a Solana Explorer link for each one that is verified on-chain. Optionally only for one event (name or ticket id). Read-only.",
    parameters: {
      type: 'object',
      properties: {
        event: { type: 'string', description: 'Event name or ticket id to look for, e.g. "jazz" or "tkt-sol-jazz-002". Leave empty for all tickets.' },
      },
    },
    handler: async (args: { event?: string }) => {
      const [tickets, poaps] = await Promise.all([walletService.listUserTickets(DEMO_WALLET), walletService.listUserPoaps(DEMO_WALLET)]);
      const q = args.event?.trim() ? normalizePlace(args.event) : '';
      const matches = (title: string, id: string) => !q || id.toLowerCase() === args.event!.trim().toLowerCase() || normalizePlace(title).includes(q) || q.split(' ').every((w) => normalizePlace(title).includes(w));
      const t = tickets.filter((x) => matches(x.eventTitle, x.ticketId));
      const p = poaps.filter((x) => matches(x.eventTitle, x.poapId));
      const status = await onChainStatuses([...t.map((x) => x.txSignature), ...p.map((x) => x.txSignature)]);
      const link = (sig: string, url: string) => (isOnChain(status[sig]) ? url : null);
      return {
        wallet: shortWallet(DEMO_WALLET),
        walletExplorerUrl: getAccountExplorerUrl(DEMO_WALLET),
        network: 'Solana devnet (test network, no real money)',
        tickets: t.map((x) => ({
          event: x.eventTitle,
          ticketId: x.ticketId,
          checkedIn: x.isCheckedIn,
          checkedInAt: x.checkInTimestamp ?? null,
          mintedAt: x.mintedAt,
          onChain: status[x.txSignature],
          explorerUrl: link(x.txSignature, x.explorerUrl),
        })),
        poapBadges: p.map((x) => ({ event: x.eventTitle, badge: x.badgeName, issuedAt: x.issuedAt, onChain: status[x.txSignature], explorerUrl: link(x.txSignature, x.explorerUrl) })),
        note: [
          'Only share explorerUrl values that are present (they were verified on devnet just now).',
          'If onChain is "not_found", say the ticket is in the app but its devnet transaction could not be found; if "unknown", devnet could not be reached right now.',
          q && t.length === 0 && p.length === 0 ? 'No ticket or badge matches that event.' : '',
        ].filter(Boolean).join(' '),
      };
    },
  },
];
