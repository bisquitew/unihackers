import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { SOLANA_CONFIG, getSolanaExplorerUrl } from './config.ts';
import { ORGANIZER_SECRET_KEY, ORGANIZER_PUBLIC_KEY } from './organizer-key.ts';

export const ORGANIZER_WALLET_ADDRESS = ORGANIZER_PUBLIC_KEY;
export const MEMO_PROGRAM_ID_STR = SOLANA_CONFIG.memoProgramId;

export interface DevnetClusterStatus {
  online: boolean;
  rpcUrl: string;
  slot: number;
  latestBlockhash: string;
  apiVersion: string;
  organizerBalanceSol: number;
}

export interface RealTransactionResult {
  success: boolean;
  signature: string;
  explorerUrl: string;
  slot: number;
  blockhash: string;
  onChainConfirmed: boolean;
  message?: string;
  error?: string;
}

/**
 * Creates a Connection instance to Solana Devnet cluster.
 */
export function getDevnetConnection(): Connection {
  return new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');
}

/**
 * Returns the organizer Keypair instance loaded from persistent secret key.
 */
export function getOrganizerKeypair(): Keypair {
  return Keypair.fromSecretKey(ORGANIZER_SECRET_KEY);
}

/**
 * Queries real-time Solana Devnet status via standard JSON-RPC.
 */
export async function getLiveDevnetStatus(): Promise<DevnetClusterStatus> {
  try {
    const connection = getDevnetConnection();
    const organizer = getOrganizerKeypair();

    const [lamports, { blockhash }, slot] = await Promise.all([
      connection.getBalance(organizer.publicKey),
      connection.getLatestBlockhash('confirmed'),
      connection.getSlot('confirmed'),
    ]);

    return {
      online: true,
      rpcUrl: SOLANA_CONFIG.rpcUrl,
      slot,
      latestBlockhash: blockhash,
      apiVersion: 'Solana Devnet (v1.18+)',
      organizerBalanceSol: lamports / 1_000_000_000,
    };
  } catch (err: any) {
    console.warn('[Solana Devnet Status Warning]:', err?.message || err);
    return {
      online: false,
      rpcUrl: SOLANA_CONFIG.rpcUrl,
      slot: 0,
      latestBlockhash: '',
      apiVersion: 'Offline Fallback',
      organizerBalanceSol: 0,
    };
  }
}

/**
 * Broadcasts a 100% REAL on-chain transaction to Solana Devnet using the SPL Memo Program.
 * Embeds verifiable immutable ticket metadata directly on the Solana blockchain.
 */
export async function broadcastRealTicket(
  ticketId: string,
  eventId: string,
  eventTitle: string,
  attendeeWallet: string
): Promise<RealTransactionResult> {
  const connection = getDevnetConnection();
  const organizer = getOrganizerKeypair();

  try {
    const balance = await connection.getBalance(organizer.publicKey);
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    // If wallet has at least 5000 lamports (fee for 1 tx = ~5000 lamports = 0.000005 SOL)
    if (balance >= 5000) {
      const memoText = `UNIHACK-TIMISOARA:TICKET|id=${ticketId}|event=${eventId}|title=${encodeURIComponent(
        eventTitle
      )}|attendee=${attendeeWallet}|t=${Date.now()}`;

      const memoProgramId = new PublicKey(MEMO_PROGRAM_ID_STR);
      const instruction = new TransactionInstruction({
        keys: [{ pubkey: organizer.publicKey, isSigner: true, isWritable: true }],
        programId: memoProgramId,
        data: Buffer.from(memoText, 'utf-8'),
      });

      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = organizer.publicKey;

      console.log(`[Solana] Broadcasting real ticket tx to Devnet (Fee payer: ${organizer.publicKey.toBase58()})...`);
      const signature = await sendAndConfirmTransaction(connection, transaction, [organizer], {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      });

      const status = await connection.getSignatureStatus(signature);
      const slot = status.value?.slot || (await connection.getSlot('confirmed'));
      const explorerUrl = getSolanaExplorerUrl(signature, 'devnet');

      console.log(`[Solana] Confirmed on-chain! Tx: ${signature}`);
      return {
        success: true,
        signature,
        explorerUrl,
        slot,
        blockhash,
        onChainConfirmed: true,
        message: 'Tranzacție confirmată 100% on-chain pe Solana Devnet!',
      };
    } else {
      return {
        success: false,
        signature: '',
        explorerUrl: `https://explorer.solana.com/address/${organizer.publicKey.toBase58()}?cluster=devnet`,
        slot: 0,
        blockhash,
        onChainConfirmed: false,
        error: `Portofelul organizatorului (${organizer.publicKey.toBase58()}) are balanța 0 pe Devnet. Vizitează https://faucet.solana.com pentru 1 SOL gratuit!`,
      };
    }
  } catch (err: any) {
    console.error('[Solana Real Tx Error]:', err);
    return {
      success: false,
      signature: '',
      explorerUrl: `https://explorer.solana.com/address/${organizer.publicKey.toBase58()}?cluster=devnet`,
      slot: 0,
      blockhash: '',
      onChainConfirmed: false,
      error: err?.message || 'Eroare la trimiterea tranzacției pe Solana Devnet',
    };
  }
}

/**
 * Broadcasts a 100% REAL on-chain POAP attendance badge mint transaction to Solana Devnet.
 * Verifiable by hackathon jury and event attendees on Solana Explorer.
 */
export async function broadcastRealPoap(
  eventId: string,
  eventTitle: string,
  attendeeWallet: string,
  ticketId: string
): Promise<RealTransactionResult> {
  const connection = getDevnetConnection();
  const organizer = getOrganizerKeypair();

  try {
    const balance = await connection.getBalance(organizer.publicKey);
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    if (balance >= 5000) {
      const memoText = `UNIHACK-TIMISOARA:POAP|badge=Culture-Explorer|event=${eventId}|title=${encodeURIComponent(
        eventTitle
      )}|attendee=${attendeeWallet}|ticket=${ticketId}|t=${Date.now()}`;

      const memoProgramId = new PublicKey(MEMO_PROGRAM_ID_STR);
      const instruction = new TransactionInstruction({
        keys: [{ pubkey: organizer.publicKey, isSigner: true, isWritable: true }],
        programId: memoProgramId,
        data: Buffer.from(memoText, 'utf-8'),
      });

      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = organizer.publicKey;

      console.log(`[Solana] Minting real POAP badge on Devnet...`);
      const signature = await sendAndConfirmTransaction(connection, transaction, [organizer], {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      });

      const status = await connection.getSignatureStatus(signature);
      const slot = status.value?.slot || (await connection.getSlot('confirmed'));
      const explorerUrl = getSolanaExplorerUrl(signature, 'devnet');

      console.log(`[Solana] POAP minted on-chain! Tx: ${signature}`);
      return {
        success: true,
        signature,
        explorerUrl,
        slot,
        blockhash,
        onChainConfirmed: true,
        message: 'Ecuson POAP emis și confirmat 100% pe Solana Devnet!',
      };
    } else {
      return {
        success: false,
        signature: '',
        explorerUrl: `https://explorer.solana.com/address/${organizer.publicKey.toBase58()}?cluster=devnet`,
        slot: 0,
        blockhash,
        onChainConfirmed: false,
        error: `Portofelul organizatorului (${organizer.publicKey.toBase58()}) are balanța 0 pe Devnet. Vizitează https://faucet.solana.com pentru 1 SOL gratuit!`,
      };
    }
  } catch (err: any) {
    console.error('[Solana Real POAP Error]:', err);
    return {
      success: false,
      signature: '',
      explorerUrl: `https://explorer.solana.com/address/${organizer.publicKey.toBase58()}?cluster=devnet`,
      slot: 0,
      blockhash: '',
      onChainConfirmed: false,
      error: err?.message || 'Eroare la emiterea ecusonului POAP pe Solana Devnet',
    };
  }
}
