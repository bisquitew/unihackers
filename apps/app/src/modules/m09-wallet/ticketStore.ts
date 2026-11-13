// Shared ticket & POAP store for M09 Wallet & M01 Events
import {
  mintDevnetTicket,
  mintDevnetPoap,
  MintedTicketResult,
  PoapResult,
  ORGANIZER_WALLET_ADDRESS,
  getLiveDevnetStatus,
} from '@hub/solana';

export interface WalletState {
  walletAddress: string;
  solBalance: number;
  liveSlot: number;
  latestBlockhash: string;
  isLiveConnected: boolean;
  tickets: MintedTicketResult[];
  poaps: PoapResult[];
}

const INITIAL_TICKETS: MintedTicketResult[] = [
  {
    ticketId: 'tkt-sol-faber-001',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    ownerWallet: ORGANIZER_WALLET_ADDRESS,
    attendeeName: 'Andrei Timișan',
    txSignature: '4f8ZkQGj87kM1xRty9mPQvw48NmZ91VcLK2wP5RtxLpQvW981zNkLM8PQw91kVcLK2wP5RtxLpQvW981zNkLM8PQ',
    explorerUrl: `https://explorer.solana.com/address/${ORGANIZER_WALLET_ADDRESS}?cluster=devnet`,
    isCheckedIn: false,
    mintedAt: '2026-11-13T16:20:00Z',
    qrPayload: JSON.stringify({
      hub: 'TimisoaraHub',
      ticketId: 'tkt-sol-faber-001',
      eventId: 'evt-001',
      wallet: ORGANIZER_WALLET_ADDRESS,
      sig: '4f8ZkQGj87kM1xRt',
      venue: 'Faber Community Yard',
    }),
  },
  {
    ticketId: 'tkt-sol-jazz-002',
    eventId: 'evt-003',
    eventTitle: 'Sunset Acoustic & Jazz Session',
    ownerWallet: ORGANIZER_WALLET_ADDRESS,
    attendeeName: 'Andrei Timișan',
    txSignature: '3a1KxP92LmQv7N1z8KjM2xRty9mPQvw48NmZ91VcLK2wP5RtxLpQvW981zNkLM8PQw91kVcLK2wP5RtxLpQvW98',
    explorerUrl: `https://explorer.solana.com/address/${ORGANIZER_WALLET_ADDRESS}?cluster=devnet`,
    isCheckedIn: true,
    mintedAt: '2026-11-12T14:10:00Z',
    qrPayload: JSON.stringify({
      hub: 'TimisoaraHub',
      ticketId: 'tkt-sol-jazz-002',
      eventId: 'evt-003',
      wallet: ORGANIZER_WALLET_ADDRESS,
      sig: '3a1KxP92LmQv7N1z',
      venue: 'D’arc pe Mal',
    }),
  },
];

const INITIAL_POAPS: PoapResult[] = [
  {
    poapId: 'poap-evt-003-seed',
    eventId: 'evt-003',
    eventTitle: 'Sunset Acoustic & Jazz Session',
    attendeeWallet: ORGANIZER_WALLET_ADDRESS,
    badgeName: 'Timișoara 2026 Culture Explorer: Bega Jazz Session',
    txSignature: '5kLmQvW981zNkLM8PQw91kVcLK2wP5RtxLpQvW981zNk4f8ZkQGj87kM1xRty9mPQvw48NmZ91VcLK2wP5RtxLpQ',
    explorerUrl: `https://explorer.solana.com/address/${ORGANIZER_WALLET_ADDRESS}?cluster=devnet`,
    issuedAt: '2026-11-12T19:45:00Z',
  },
];

class TicketStore {
  private state: WalletState = {
    walletAddress: ORGANIZER_WALLET_ADDRESS,
    solBalance: 0,
    liveSlot: 0,
    latestBlockhash: '',
    isLiveConnected: false,
    tickets: [...INITIAL_TICKETS],
    poaps: [...INITIAL_POAPS],
  };

  private listeners: (() => void)[] = [];

  constructor() {
    this.syncWithLiveDevnet();
  }

  getState(): WalletState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async syncWithLiveDevnet(): Promise<WalletState> {
    try {
      const devnetStatus = await getLiveDevnetStatus();
      this.state.isLiveConnected = devnetStatus.online;
      this.state.solBalance = devnetStatus.organizerBalanceSol;
      this.state.liveSlot = devnetStatus.slot;
      this.state.latestBlockhash = devnetStatus.latestBlockhash;
      this.notify();
    } catch (e) {
      console.warn('Devnet sync failed, using cached state:', e);
    }
    return this.state;
  }

  async addTicketFromRsvp(
    eventId: string,
    eventTitle: string,
    attendeeName: string = 'Andrei Timișan'
  ): Promise<MintedTicketResult> {
    try {
      const apiHost =
        typeof window !== 'undefined' && window.location?.hostname
          ? window.location.hostname
          : '10.109.24.138';

      const res = await fetch(`http://${apiHost}:8000/v1/m/solana/tickets/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          eventTitle,
          attendeeName,
          attendeeWallet: this.state.walletAddress,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        this.state.tickets.unshift(data);
        this.notify();
        return data;
      }
    } catch (e) {
      console.warn('Backend ticket mint unreachable, creating offline ticket:', e);
    }

    const newTicket = mintDevnetTicket({
      eventId,
      eventTitle,
      attendeeName,
      userWallet: this.state.walletAddress,
    });

    this.state.tickets.unshift(newTicket);
    this.notify();
    return newTicket;
  }

  async checkInTicket(ticketId: string): Promise<{ success: boolean; poap?: PoapResult; error?: string }> {
    const ticket = this.state.tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) {
      return { success: false, error: 'Biletul nu a fost găsit în sistem!' };
    }
    if (ticket.isCheckedIn) {
      return { success: false, error: 'Acest bilet a fost deja scanat și utilizat!' };
    }

    ticket.isCheckedIn = true;

    try {
      const apiHost =
        typeof window !== 'undefined' && window.location?.hostname
          ? window.location.hostname
          : '10.109.24.138';

      const res = await fetch(`http://${apiHost}:8000/v1/m/solana/poap/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: ticket.eventId,
          eventTitle: ticket.eventTitle,
          attendeeWallet: this.state.walletAddress,
          ticketId: ticket.ticketId,
        }),
      });

      if (res.ok) {
        const poapData = await res.json();
        const poap: PoapResult = {
          poapId: poapData.poapId,
          eventId: poapData.eventId,
          eventTitle: poapData.eventTitle,
          attendeeWallet: poapData.attendeeWallet,
          badgeName: poapData.badgeName,
          txSignature: poapData.txSignature,
          explorerUrl: poapData.explorerUrl,
          issuedAt: poapData.issuedAt,
        };
        this.state.poaps.unshift(poap);
        this.notify();
        return { success: true, poap };
      }
    } catch (e) {
      console.warn('Backend POAP mint unreachable, minting locally:', e);
    }

    // Local fallback
    const poap = mintDevnetPoap({
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      attendeeWallet: this.state.walletAddress,
      checkInLocation: 'Timișoara Cultural Hub Door Check-in',
    });

    this.state.poaps.unshift(poap);
    this.notify();
    return { success: true, poap };
  }
}

export const ticketStore = new TicketStore();
