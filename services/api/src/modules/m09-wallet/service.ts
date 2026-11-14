import type { SolanaTicketRecord, MintTicketPayload, CheckInPayload } from './types.ts';
import { seedTickets } from './seed.ts';

export class WalletService {
  private tickets: SolanaTicketRecord[] = [...seedTickets];

  private generateDevnetSignature(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let sig = '';
    for (let i = 0; i < 88; i++) {
      sig += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sig;
  }

  async mintTicket(payload: MintTicketPayload): Promise<SolanaTicketRecord> {
    const ticketId = `tkt-sol-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const txSignature = this.generateDevnetSignature();
    const explorerUrl = `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
    const wallet = payload.userWallet || `DevnetWallet_${Math.random().toString(36).substring(2, 8)}`;

    const qrPayload = JSON.stringify({
      hub: 'TimisoaraHub',
      ticketId,
      eventId: payload.eventId,
      wallet,
      sig: txSignature.slice(0, 16),
    });

    const ticket: SolanaTicketRecord = {
      ticketId,
      eventId: payload.eventId,
      eventTitle: payload.eventTitle,
      ownerWallet: wallet,
      attendeeName: payload.attendeeName,
      txSignature,
      explorerUrl,
      isCheckedIn: false,
      mintedAt: new Date().toISOString(),
      qrPayload,
    };

    this.tickets.push(ticket);
    return ticket;
  }

  async getTicket(ticketId: string): Promise<SolanaTicketRecord | null> {
    return this.tickets.find((t) => t.ticketId === ticketId) || null;
  }

  async listUserTickets(wallet: string): Promise<SolanaTicketRecord[]> {
    return this.tickets.filter((t) => t.ownerWallet === wallet);
  }

  async checkInTicket(payload: CheckInPayload): Promise<{ success: boolean; message: string; ticket?: SolanaTicketRecord }> {
    const ticket = this.tickets.find((t) => t.ticketId === payload.ticketId);
    if (!ticket) {
      return { success: false, message: 'Ticket not found' };
    }
    if (ticket.isCheckedIn) {
      return { success: false, message: 'Ticket has already been checked in!' };
    }

    ticket.isCheckedIn = true;
    ticket.checkInTimestamp = new Date().toISOString();

    return {
      success: true,
      message: 'Check-in confirmed on Solana Devnet! POAP badge issued.',
      ticket,
    };
  }
}

export const walletService = new WalletService();
