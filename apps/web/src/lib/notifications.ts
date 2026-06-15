import type { NotificationPrefs } from '@weekflow/shared/types';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  weekly_report: true,
  midweek_checkin: true,
};

export async function requestPermissions(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// TODO: wire to PWA push notifications via service worker
export async function applyNotificationPrefs(_prefs: NotificationPrefs): Promise<void> {}
