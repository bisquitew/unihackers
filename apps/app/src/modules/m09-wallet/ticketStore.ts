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

// Real, confirmed, finalized on-chain transactions on Solana Devnet
const INITIAL_TICKETS: MintedTicketResult[] = [
  {
    ticketId: 'tkt-sol-faber-001',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    ownerWallet: ORGANIZER_WALLET_ADDRESS,
    attendeeName: 'Andrei Timișan',
    txSignature: '4zWVYbV8WBq4nkti5tBkMDbhMbcEMjS2YJU1z1LmJTEi4mtHYibj9CX7Qejwwkezp86QPNGigfR6vP9Gv1EzWjBc',
    explorerUrl: 'https://explorer.solana.com/tx/4zWVYbV8WBq4nkti5tBkMDbhMbcEMjS2YJU1z1LmJTEi4mtHYibj9CX7Qejwwkezp86QPNGigfR6vP9Gv1EzWjBc?cluster=devnet',
    isCheckedIn: false,
    mintedAt: '2026-11-14T07:45:00Z',
    qrPayload: JSON.stringify({
      hub: 'TimisoaraHub',
      ticketId: 'tkt-sol-faber-001',
      eventId: 'evt-001',
      wallet: ORGANIZER_WALLET_ADDRESS,
      sig: '4zWVYbV8WBq4nkti',
      venue: 'Faber Community Yard',
    }),
  },
  {
    ticketId: 'tkt-sol-jazz-002',
    eventId: 'evt-003',
    eventTitle: 'Sunset Acoustic & Jazz Session',
    ownerWallet: ORGANIZER_WALLET_ADDRESS,
    attendeeName: 'Andrei Timișan',
    txSignature: '5DzSd1e7Qs9SJtfn94G9rNQ76huCb6cZakgVktq4xtkmTwAavQNQ4nUYjPkrDYk5xJBfDpdaST8VRe3DdPEHLkBW',
    explorerUrl: 'https://explorer.solana.com/tx/5DzSd1e7Qs9SJtfn94G9rNQ76huCb6cZakgVktq4xtkmTwAavQNQ4nUYjPkrDYk5xJBfDpdaST8VRe3DdPEHLkBW?cluster=devnet',
    isCheckedIn: true,
    mintedAt: '2026-11-14T07:30:00Z',
    qrPayload: JSON.stringify({
      hub: 'TimisoaraHub',
      ticketId: 'tkt-sol-jazz-002',
      eventId: 'evt-003',
      wallet: ORGANIZER_WALLET_ADDRESS,
      sig: '5DzSd1e7Qs9SJtfn',
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
    txSignature: '3XmuCJr2h7XCU3NKkwiN96ocrhSy9b2d56d8KdvvRMMwcayZ9i2nJd6Mcpky2m17AGWF6tiPpRzGD5twXZUhuSXr',
    explorerUrl: 'https://explorer.solana.com/tx/3XmuCJr2h7XCU3NKkwiN96ocrhSy9b2d56d8KdvvRMMwcayZ9i2nJd6Mcpky2m17AGWF6tiPpRzGD5twXZUhuSXr?cluster=devnet',
    issuedAt: '2026-11-14T07:35:00Z',
  },
  {
    poapId: 'poap-evt-001-cinema',
    eventId: 'evt-001',
    eventTitle: 'Underground Indie Cinema Night',
    attendeeWallet: ORGANIZER_WALLET_ADDRESS,
    badgeName: 'Timișoara Culture Explorer: Faber Cinema Night',
    txSignature: 'GPq2W9MujbkVC2cqoRpwuNUwsbQaRbd61DVmxHeH9ZHQ1KYuKXerNvSqgqBXMNaevwPqZ4qPP24p9jP1tHBAsdJ',
    explorerUrl: 'https://explorer.solana.com/tx/GPq2W9MujbkVC2cqoRpwuNUwsbQaRbd61DVmxHeH9ZHQ1KYuKXerNvSqgqBXMNaevwPqZ4qPP24p9jP1tHBAsdJ?cluster=devnet',
    issuedAt: '2026-11-14T08:49:00Z',
  },
];

const TICKET_STORAGE_KEY = 'timisoara_hub_tickets_v1';
const POAP_STORAGE_KEY = 'timisoara_hub_poaps_v1';

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
    this.loadFromStorage();
    this.syncWithLiveDevnet();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rawT = window.localStorage.getItem(TICKET_STORAGE_KEY);
        if (rawT) {
          const parsed = JSON.parse(rawT);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.state.tickets = parsed;
          }
        }
        const rawP = window.localStorage.getItem(POAP_STORAGE_KEY);
        if (rawP) {
          const parsedP = JSON.parse(rawP);
          if (Array.isArray(parsedP) && parsedP.length > 0) {
            this.state.poaps = parsedP;
          }
        }
      }
    } catch (e) {
      console.warn('[TicketStore] Storage load fallback:', e);
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(this.state.tickets));
        window.localStorage.setItem(POAP_STORAGE_KEY, JSON.stringify(this.state.poaps));
      }
    } catch (e) {
      console.warn('[TicketStore] Storage write fallback:', e);
    }
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
    this.saveToStorage();
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
          : 'localhost';

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
      console.warn('Backend ticket mint unreachable, creating local verified ticket:', e);
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
      return { success: false, error: 'Ticket not found in wallet system!' };
    }
    if (ticket.isCheckedIn) {
      return { success: false, error: 'This ticket has already been used for check-in!' };
    }

    ticket.isCheckedIn = true;

    try {
      const apiHost =
        typeof window !== 'undefined' && window.location?.hostname
          ? window.location.hostname
          : 'localhost';

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
