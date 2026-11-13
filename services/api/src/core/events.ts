import type { CoreEvent } from '@hub/contracts';

type EventHandler = (payload: any) => Promise<void> | void;

const EVENT_LISTENERS: Map<string, EventHandler[]> = new Map();
const EVENT_HISTORY: CoreEvent[] = [];

export const eventBus = {
  on(topic: string, handler: EventHandler) {
    const existing = EVENT_LISTENERS.get(topic) || [];
    existing.push(handler);
    EVENT_LISTENERS.set(topic, existing);
  },

  async emit(topic: string, payload: Record<string, any>): Promise<CoreEvent> {
    const event: CoreEvent = {
      id: crypto.randomUUID(),
      topic,
      payload,
      created_at: new Date().toISOString()
    };

    EVENT_HISTORY.push(event);

    console.log(`[EVENT EMITTED] 📡 Topic: "${topic}" | ID: ${event.id}`);

    const listeners = EVENT_LISTENERS.get(topic) || [];
    for (const listener of listeners) {
      try {
        await listener(payload);
      } catch (err) {
        console.error(`[EVENT ERROR] Failed handling event "${topic}":`, err);
      }
    }

    return event;
  },

  getHistory(): CoreEvent[] {
    return [...EVENT_HISTORY];
  }
};
