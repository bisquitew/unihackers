// Ambient type declarations for IDE and TypeScript language server
// Only for packages without installed @types

declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(options?: any);
    models: any;
  }
}

