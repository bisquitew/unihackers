export type AssistantLanguage = 'ro' | 'en';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface ChatInput {
  message: string;
  history: ChatTurn[];
  language: AssistantLanguage | null;
}

export interface ToolUse {
  name: string;
  moduleId: string;
}

export interface ChatResult {
  reply: string;
  toolsUsed: ToolUse[];
}
