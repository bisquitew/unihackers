// Ambient type declarations for IDE and TypeScript language server
// Only for packages without installed @types

declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(options?: any);
    models: any;
  }
}

declare module 'react-native-webview' {
  import * as React from 'react';
  export class WebView extends React.Component<any, any> {
    injectJavaScript(script: string): void;
  }
  export type WebViewMessageEvent = {
    nativeEvent: {
      data: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

