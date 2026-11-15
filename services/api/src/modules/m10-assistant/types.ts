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

/**
 * Passed as the second argument to every module's assistant tool handler. Tools that answer about "my …"
 * (tickets, badges) use `userSub`; null means a guest (not signed in). Other tools ignore it.
 */
export interface ToolContext {
  userSub: string | null;
}

export interface ToolUse {
  name: string;
  moduleId: string;
}

export interface ChatResult {
  reply: string;
  toolsUsed: ToolUse[];
}
