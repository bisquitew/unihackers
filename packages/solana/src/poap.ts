import { getSolanaExplorerUrl } from './config';

export interface MintPoapParams {
  eventId: string;
  eventTitle: string;
  attendeeWallet: string;
  checkInLocation: string;
}

export interface PoapResult {
  poapId: string;
  eventId: string;
  eventTitle: string;
  attendeeWallet: string;
  badgeName: string;
  txSignature: string;
  explorerUrl: string;
  issuedAt: string;
}

export function mintDevnetPoap(params: MintPoapParams): PoapResult {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 88; i++) {
    sig += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const poapId = `poap-${params.eventId}-${Date.now().toString(36)}`;
  const explorerUrl = getSolanaExplorerUrl(sig, 'devnet');

  return {
    poapId,
    eventId: params.eventId,
    eventTitle: params.eventTitle,
    attendeeWallet: params.attendeeWallet,
    badgeName: `Timișoara Culture Explorer: ${params.eventTitle}`,
    txSignature: sig,
    explorerUrl,
    issuedAt: new Date().toISOString(),
  };
}
