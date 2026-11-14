import { walletRoutes } from './routes.ts';
import { walletAssistantTools } from './assistant-tools.ts';
import { solanaMcpTools } from './solana-mcp.ts';
import { walletService, WalletService } from './service.ts';
import type { ApiModule } from '../../types.ts';

export const apiModule: ApiModule = {
  id: 'm09-wallet',
  title: 'Solana Devnet Wallet & Tickets',
  routes: walletRoutes,
  // get_my_tickets (wallet data) + verify_on_solana / search_solana_docs (Solana's official MCP servers)
  assistantTools: [...walletAssistantTools, ...solanaMcpTools],
};

export { walletService, WalletService };
export default apiModule;
