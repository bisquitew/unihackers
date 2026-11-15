export type AssistantLanguage = 'ro' | 'en';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

/** Where the person is, roughly (rounded to about 100 m). Only sent when they chose to share it; never stored or logged. */
export interface ApproxLocation {
  latitude: number;
  longitude: number;
}

export interface ChatInput {
  message: string;
  history: ChatTurn[];
  language: AssistantLanguage | null;
  location?: ApproxLocation | null;
}

/**
 * Passed as the second argument to every module's assistant tool handler. Tools that answer about "my …"
 * (tickets, badges) use `userSub`; null means a guest (not signed in). Other tools ignore it.
 */
export interface ToolContext {
  userSub: string | null;
  /** the person's approximate location, when they shared it with this question; null otherwise */
  location?: ApproxLocation | null;
}

export interface ToolUse {
  name: string;
  moduleId: string;
}

export interface ChatResult {
  reply: string;
  toolsUsed: ToolUse[];
}
