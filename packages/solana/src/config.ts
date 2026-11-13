export const SOLANA_CONFIG = {
  network: 'devnet' as const,
  rpcUrl: 'https://api.devnet.solana.com',
  explorerBaseUrl: 'https://explorer.solana.com',
  timisoaraHubProgramId: 'TMHub11111111111111111111111111111111111111',
  memoProgramId: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
};

export function getSolanaExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet'): string {
  return `${SOLANA_CONFIG.explorerBaseUrl}/tx/${signature}?cluster=${cluster}`;
}

export function getAccountExplorerUrl(address: string, cluster: 'devnet' | 'mainnet-beta' = 'devnet'): string {
  return `${SOLANA_CONFIG.explorerBaseUrl}/address/${address}?cluster=${cluster}`;
}
