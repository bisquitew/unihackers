import { walletRoutes } from './routes.ts';
import { walletService, WalletService } from './service.ts';
import type { ApiModule } from '../../types.ts';

export const apiModule: ApiModule = {
  id: 'm09-wallet',
  title: 'Solana Devnet Wallet & Tickets',
  routes: walletRoutes,
};

export { walletService, WalletService };
export default apiModule;
