export interface ModuleManifest {
  id: string;
  title: string;
  owner: string;
  status: 'draft' | 'beta' | 'live';
  icon: string;
  entryRoute: string;
}

export const manifest: ModuleManifest = {
  id: 'm08-forum',
  title: 'Comunitate & Forum',
  owner: 'P3',
  status: 'live',
  icon: 'message-square',
  entryRoute: '/m/forum',
};
