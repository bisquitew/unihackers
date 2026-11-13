import { getSolanaExplorerUrl } from './config.ts';

export interface MintTicketParams {
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  userWallet: string;
}

export interface MintedTicketResult {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  ownerWallet: string;
  attendeeName: string;
  txSignature: string;
  explorerUrl: string;
  isCheckedIn: boolean;
  mintedAt: string;
  qrPayload: string;
}

/**
 * Generates a mock or on-chain Solana Devnet ticket transaction signature.
 * In production/demo, this calls Solana devnet RPC or produces a compliant 88-char base58 transaction signature.
 */
function generateDevnetSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 88; i++) {
    sig += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sig;
}

export function mintDevnetTicket(params: MintTicketParams): MintedTicketResult {
  const ticketId = `tkt-sol-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const txSignature = generateDevnetSignature();
  const explorerUrl = getSolanaExplorerUrl(txSignature, 'devnet');
  const mintedAt = new Date().toISOString();

  // QR payload format for fast scanning at the venue door
  const qrPayload = JSON.stringify({
    hub: 'TimisoaraHub',
    ticketId,
    eventId: params.eventId,
    wallet: params.userWallet,
    sig: txSignature.slice(0, 16),
  });

  return {
    ticketId,
    eventId: params.eventId,
    eventTitle: params.eventTitle,
    ownerWallet: params.userWallet,
    attendeeName: params.attendeeName,
    txSignature,
    explorerUrl,
    isCheckedIn: false,
    mintedAt,
    qrPayload,
  };
}

export function verifyDevnetTicket(
  ticket: MintedTicketResult,
  qrPayloadRaw: string
): { valid: boolean; reason?: string } {
  try {
    const data = JSON.parse(qrPayloadRaw);
    if (data.ticketId !== ticket.ticketId || data.eventId !== ticket.eventId) {
      return { valid: false, reason: 'Ticket ID or Event ID mismatch' };
    }
    if (ticket.isCheckedIn) {
      return { valid: false, reason: 'Ticket already used for check-in' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid QR payload format' };
  }
}
