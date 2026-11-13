export interface ModuleManifest {
  id: string;
  title: string;
  owner: string;
  status: 'draft' | 'beta' | 'live';
  icon: string;
  entryRoute: string;
}

export const manifest: ModuleManifest = {
  id: 'm01-events',
  title: 'Evenimente Culturale',
  owner: 'P3',
  status: 'live',
  icon: 'calendar',
  entryRoute: '/m/events',
};
