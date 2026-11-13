// Ambient type declarations for IDE and TypeScript language server
// Resolves missing npm package types during offline / sandbox development

declare module 'react' {
  export const createContext: any;
  export const useContext: any;
  export const useState: any;
  export const useEffect: any;
  export interface FC<P = {}> {
    (props: P): any;
  }
  export type ReactNode = any;
  const React: any;
  export default React;
}

declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const StyleSheet: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
}

declare module 'hono' {
  export class Hono {
    use(...args: any[]): this;
    get(...args: any[]): this;
    post(...args: any[]): this;
    put(...args: any[]): this;
    patch(...args: any[]): this;
    delete(...args: any[]): this;
    route(...args: any[]): this;
  }
  export type Context = any;
  export type Next = any;
}

declare module 'hono/cors' {
  export function cors(options?: any): any;
}

declare module 'hono/logger' {
  export function logger(): any;
}

declare module '@hono/node-server' {
  export function serve(options: any, callback?: any): any;
}

declare module 'jose' {
  export function createRemoteJWKSet(url: URL): any;
  export function jwtVerify(token: string, keySet: any, options?: any): Promise<any>;
}

declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(options?: any);
    models: any;
  }
}
