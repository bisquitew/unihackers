import type { Notification } from '@hub/contracts';

// In-memory notifications store for instant responsiveness
const NOTIFICATIONS_STORE: Notification[] = [];

export interface NotifyParams {
  userId: string;
  moduleId: string;
  title: string;
  body: string;
  category: 'outage' | 'transit_detour' | 'smell_alert' | 'safety' | 'system' | 'security';
  data?: Record<string, any>;
}

export async function notify(params: NotifyParams): Promise<Notification> {
  const notification: Notification = {
    id: crypto.randomUUID(),
    user_id: params.userId,
    module_id: params.moduleId,
    title: params.title,
    body: params.body,
    category: params.category,
    data: params.data,
    read: false,
    created_at: new Date().toISOString()
  };

  NOTIFICATIONS_STORE.unshift(notification);

  // High-visibility logging for hackathon verification & debugging
  console.log(`[PUSH NOTIFICATION] 🔔 To: ${params.userId} | Module: ${params.moduleId} | Title: "${params.title}"`);
  console.log(`                     Body: ${params.body}`);

  // In production with Expo Push Token:
  // if (user.expoPushToken) { await sendExpoPushNotification(...) }

  return notification;
}

export function getUserNotifications(userId: string): Notification[] {
  return NOTIFICATIONS_STORE.filter((n) => n.user_id === userId);
}

export function markNotificationAsRead(notificationId: string): boolean {
  const notif = NOTIFICATIONS_STORE.find((n) => n.id === notificationId);
  if (notif) {
    notif.read = true;
    return true;
  }
  return false;
}
