export interface SolanaTicketRecord {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  ownerWallet: string;
  attendeeName: string;
  txSignature: string;
  explorerUrl: string;
  isCheckedIn: boolean;
  checkInTimestamp?: string;
  mintedAt: string;
  qrPayload: string;
}

export interface MintTicketPayload {
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  userWallet?: string;
}

export interface CheckInPayload {
  ticketId: string;
  qrPayloadRaw: string;
}
