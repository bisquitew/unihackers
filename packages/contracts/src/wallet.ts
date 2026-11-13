export type SolanaNetwork = 'devnet' | 'testnet' | 'mainnet-beta';

export interface SolanaTicket {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  ownerWallet: string;
  attendeeName: string;
  txSignature: string;
  mintAddress?: string;
  explorerUrl: string;
  isCheckedIn: boolean;
  checkInTimestamp?: string;
  mintedAt: string;
}

export interface ProofOfAttendance {
  id: string;
  eventId: string;
  attendeeWallet: string;
  txSignature: string;
  badgeName: string;
  metadataUri: string;
  issuedAt: string;
}

export interface MintTicketRequest {
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  userWallet: string;
}

export interface VerifyTicketRequest {
  ticketId: string;
  txSignature: string;
}
