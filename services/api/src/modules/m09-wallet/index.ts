import { walletRoutes } from './routes';
import { walletService, WalletService } from './service';
import type { ApiModule } from '../../types';

export const apiModule: ApiModule = {
  id: 'm09-wallet',
  title: 'Solana Devnet Wallet & Tickets',
  routes: walletRoutes,
};

export { walletService, WalletService };
export default apiModule;
