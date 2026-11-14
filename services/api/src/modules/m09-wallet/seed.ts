import { ORGANIZER_WALLET_ADDRESS, getSolanaExplorerUrl } from '../../../../../packages/solana/src/config.ts';
import type { PoapRecord, SolanaTicketRecord } from './types.ts';

/**
 * Same demo wallet as the app's wallet screen (apps/app/src/modules/m09-wallet/ticketStore.ts), so the
 * assistant talks about the tickets the user actually sees. Signatures are real devnet transactions where
 * they exist; the assistant checks each one live (onchain.ts) before showing an Explorer link.
 */
export const DEMO_WALLET = ORGANIZER_WALLET_ADDRESS;

const ticket = (t: Omit<SolanaTicketRecord, 'explorerUrl' | 'qrPayload' | 'ownerWallet'> & { venue: string }): SolanaTicketRecord => ({
  ticketId: t.ticketId,
  eventId: t.eventId,
  eventTitle: t.eventTitle,
  ownerWallet: DEMO_WALLET,
  attendeeName: t.attendeeName,
  txSignature: t.txSignature,
  explorerUrl: getSolanaExplorerUrl(t.txSignature),
  isCheckedIn: t.isCheckedIn,
  checkInTimestamp: t.checkInTimestamp,
  mintedAt: t.mintedAt,
  qrPayload: JSON.stringify({ hub: 'TimisoaraHub', ticketId: t.ticketId, eventId: t.eventId, wallet: DEMO_WALLET, sig: t.txSignature.slice(0, 16), venue: t.venue }),
});

export const seedTickets: SolanaTicketRecord[] = [
  ticket({
    ticketId: 'tkt-sol-faber-001',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    attendeeName: 'Andrei Timișan',
    txSignature: '4zWVYbV8WBq4nkti5tBkMDbhMbcEMjS2YJU1z1LmJTEi4mtHYibj9CX7Qejwwkezp86QPNGigfR6vP9Gv1EzWjBc',
    isCheckedIn: false,
    mintedAt: '2026-11-14T07:45:00Z',
    venue: 'Faber Community Yard',
  }),
  ticket({
    ticketId: 'tkt-sol-jazz-002',
    eventId: 'evt-003',
    eventTitle: 'Sunset Acoustic & Jazz Session',
    attendeeName: 'Andrei Timișan',
    txSignature: '5DzSd1e7Qs9SJtfn94G9rNQ76huCb6cZakgVktq4xtkmTwAavQNQ4nUYjPkrDYk5xJBfDpdaST8VRe3DdPEHLkBW',
    isCheckedIn: true,
    checkInTimestamp: '2026-11-14T07:34:00Z',
    mintedAt: '2026-11-14T07:30:00Z',
    venue: 'D’arc pe Mal',
  }),
];

export const seedPoaps: PoapRecord[] = [
  {
    poapId: 'poap-evt-003-seed',
    eventId: 'evt-003',
    eventTitle: 'Sunset Acoustic & Jazz Session',
    attendeeWallet: DEMO_WALLET,
    badgeName: 'Timișoara 2026 Culture Explorer: Bega Jazz Session',
    txSignature: '3XmuCJr2h7XCU3NKkwiN96ocrhSy9b2d56d8KdvvRMMwcayZ9i2nJd6Mcpky2m17AGWF6tiPpRzGD5twXZUhuSXr',
    explorerUrl: getSolanaExplorerUrl('3XmuCJr2h7XCU3NKkwiN96ocrhSy9b2d56d8KdvvRMMwcayZ9i2nJd6Mcpky2m17AGWF6tiPpRzGD5twXZUhuSXr'),
    issuedAt: '2026-11-14T07:35:00Z',
  },
  {
    poapId: 'poap-evt-001-cinema',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    attendeeWallet: DEMO_WALLET,
    badgeName: 'Timișoara Culture Explorer: Faber Cinema Night',
    txSignature: 'GPq2W9MujbkVC2cqoRpwuNUwsbQaRbd61DVmxHeH9ZHQ1KYuKXerNvSqgqBXMNaevwPqZ4qPP24p9jP1tHBAsdJ',
    explorerUrl: getSolanaExplorerUrl('GPq2W9MujbkVC2cqoRpwuNUwsbQaRbd61DVmxHeH9ZHQ1KYuKXerNvSqgqBXMNaevwPqZ4qPP24p9jP1tHBAsdJ'),
    issuedAt: '2026-11-14T08:49:00Z',
  },
];
