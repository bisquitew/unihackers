import { API_URL } from './config';

export interface ToolUse {
  name: string;
  moduleId: string;
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface ChatReply {
  reply: string;
  toolsUsed: ToolUse[];
}

export async function sendChat(message: string, history: ChatTurn[]): Promise<ChatReply> {
  const res = await fetch(`${API_URL}/v1/m/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as ChatReply;
}
