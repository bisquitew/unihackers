export interface ModuleManifest {
  id: string;
  title: string;
  owner: string;
  status: 'draft' | 'beta' | 'live';
  icon: string;
  entryRoute: string;
}

export const manifest: ModuleManifest = {
  id: 'm07-buddy',
  title: 'Cu Cine? (Event Buddy)',
  owner: 'P3',
  status: 'live',
  icon: 'users',
  entryRoute: '/m/buddy',
};
