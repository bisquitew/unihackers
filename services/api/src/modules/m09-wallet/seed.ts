import { SolanaTicketRecord } from './types';

export const seedTickets: SolanaTicketRecord[] = [
  {
    ticketId: 'tkt-sol-demo-001',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    ownerWallet: '7XwK...TMHub...Devnet',
    attendeeName: 'Alex Radu',
    txSignature: '4f8ZkQGj87kM1xRty9mPQvw48NmZ91VcLK2wP5RtxLpQvW981zNkLM8PQw91kVcLK2wP5RtxLpQvW981zNkLM8PQ',
    explorerUrl: 'https://explorer.solana.com/tx/4f8ZkQGj87kM1xRty9mPQvw48NmZ91VcLK2wP5RtxLpQvW981zNkLM8PQw91kVcLK2wP5RtxLpQvW981zNkLM8PQ?cluster=devnet',
    isCheckedIn: false,
    mintedAt: '2026-11-13T12:00:00Z',
    qrPayload: JSON.stringify({
      hub: 'TimisoaraHub',
      ticketId: 'tkt-sol-demo-001',
      eventId: 'evt-001',
      wallet: '7XwK...TMHub...Devnet',
    }),
  }
];
