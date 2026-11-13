export interface ModuleManifest {
  id: string;
  title: string;
  owner: string;
  status: 'draft' | 'beta' | 'live';
  icon: string;
  entryRoute: string;
}

export const manifest: ModuleManifest = {
  id: 'm09-wallet',
  title: 'Portofel Solana Devnet',
  owner: 'P3',
  status: 'live',
  icon: 'credit-card',
  entryRoute: '/m/wallet',
};
