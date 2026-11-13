import type { FeatureFlagStatus } from './core.ts';

export interface ModuleManifest {
  id: string;
  title: string;
  owner: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'draft' | 'beta' | 'live';
  icon: string;
  entryRoute: string;
  homeCard?: any;     // Optional React component for Home tile
  mapLayer?: any;     // Optional map overlay component
  settings?: any;     // Optional profile settings component
}

export interface AssistantToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<any>;
}

export interface ApiModule {
  id: string;
  routes: any; // Hono Router instance
  jobs?: (() => Promise<void>)[];
  assistantTools?: AssistantToolDeclaration[];
  onEvent?: Record<string, (payload: any) => Promise<void> | void>;
}
