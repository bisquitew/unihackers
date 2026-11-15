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

/** `location` is only given when the person chose to share it with this question. */
export async function sendChat(message: string, history: ChatTurn[], location?: { latitude: number; longitude: number } | null): Promise<ChatReply> {
  const res = await fetch(`${API_URL}/v1/m/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, ...(location ? { location } : {}) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as ChatReply;
}
