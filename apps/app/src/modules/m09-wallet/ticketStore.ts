// The signed-in person's tickets and attendance badges (M09 Wallet, used by M01 Events). They live on the server
// (GET /v1/m/solana/tickets/mine), so the app and the website show the same wallet and nothing is lost on a new phone.
import { api, onSessionToken } from '../../core/api';
import { MintedTicketResult, PoapResult, ORGANIZER_WALLET_ADDRESS, getLiveDevnetStatus } from '@hub/solana';

export interface WalletState {
  walletAddress: string;
  solBalance: number;
  liveSlot: number;
  latestBlockhash: string;
  isLiveConnected: boolean;
  tickets: MintedTicketResult[];
  poaps: PoapResult[];
  /** false until the wallet has been read from the server once */
  loaded: boolean;
}

class TicketStore {
  private state: WalletState = {
    walletAddress: ORGANIZER_WALLET_ADDRESS,
    solBalance: 0,
    liveSlot: 0,
    latestBlockhash: '',
    isLiveConnected: false,
    tickets: [],
    poaps: [],
    loaded: false,
  };

  private listeners: (() => void)[] = [];

  constructor() {
    // load the wallet when someone signs in, empty it when they sign out
    onSessionToken((token) => {
      if (token) void this.refresh();
      else {
        this.state = { ...this.state, tickets: [], poaps: [], loaded: false };
        this.notify();
      }
    });
    void this.syncWithLiveDevnet();
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

  /** Reads the wallet from the server. Keeps what is shown if the server cannot be reached. */
  async refresh(): Promise<void> {
    try {
      const data = await api.get<{ tickets: MintedTicketResult[]; poaps: PoapResult[] }>('/v1/m/solana/tickets/mine');
      this.state = { ...this.state, tickets: data.tickets ?? [], poaps: data.poaps ?? [], loaded: true };
      this.notify();
    } catch (e) {
      console.warn('[wallet] could not load the wallet:', e);
    }
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

  /** The server mints the ticket on Solana devnet for the signed-in person. Throws when it cannot. */
  async addTicketFromRsvp(eventId: string, eventTitle: string, attendeeName?: string): Promise<MintedTicketResult> {
    const data = await api.post<MintedTicketResult>('/v1/m/solana/tickets/mint', {
      eventId,
      eventTitle,
      attendeeName,
      attendeeWallet: this.state.walletAddress,
    });
    this.state.tickets = [data, ...this.state.tickets];
    this.notify();
    return data;
  }

  /** Gives a ticket back (cancelling a place). Throws when the server refuses. */
  async cancelTicket(ticketId: string): Promise<void> {
    await api.del(`/v1/m/solana/tickets/${encodeURIComponent(ticketId)}`);
    this.state = { ...this.state, tickets: this.state.tickets.filter((t) => t.ticketId !== ticketId) };
    this.notify();
  }

  /** Door check-in: the server gives the attendance badge for a ticket in this wallet. */
  async checkInTicket(ticketId: string): Promise<{ success: boolean; poap?: PoapResult; error?: string }> {
    const ticket = this.state.tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) return { success: false, error: 'This ticket is not in your wallet.' };
    if (ticket.isCheckedIn) return { success: false, error: 'This ticket was already used at the door.' };
    try {
      const poap = await api.post<PoapResult>('/v1/m/solana/poap/mint', {
        eventId: ticket.eventId,
        eventTitle: ticket.eventTitle,
        attendeeWallet: this.state.walletAddress,
        ticketId: ticket.ticketId,
      });
      this.state.tickets = this.state.tickets.map((t) => (t.ticketId === ticketId ? { ...t, isCheckedIn: true } : t));
      this.state.poaps = [poap, ...this.state.poaps];
      this.notify();
      return { success: true, poap };
    } catch (e: any) {
      return { success: false, error: e?.message || 'We could not check this ticket. Try again.' };
    }
  }
}

export const ticketStore = new TicketStore();
