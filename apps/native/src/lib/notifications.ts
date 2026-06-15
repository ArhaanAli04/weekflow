import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NotificationPrefs } from '@weekflow/shared/types';

const WEEKLY_REPORT_ID = 'weekflow-weekly-report';
const MIDWEEK_CHECKIN_ID = 'weekflow-midweek-checkin';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  weekly_report: true,
  midweek_checkin: true,
};

export function setupNotificationHandler(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'WeekFlow',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function applyNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  if (prefs.weekly_report) {
    await scheduleWeeklyReport();
  } else {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_REPORT_ID).catch(() => {});
  }

  if (prefs.midweek_checkin) {
    await scheduleMidweekCheckin();
  } else {
    await Notifications.cancelScheduledNotificationAsync(MIDWEEK_CHECKIN_ID).catch(() => {});
  }
}

async function scheduleWeeklyReport(): Promise<void> {
  // Cancel first to avoid duplicate scheduled entries on each app launch
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_REPORT_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_REPORT_ID,
    content: {
      title: 'WeekFlow',
      body: 'Time to generate your WeekFlow report! 📊',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 1 = Sunday
      hour: 20,
      minute: 0,
    },
  });
}

async function scheduleMidweekCheckin(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(MIDWEEK_CHECKIN_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: MIDWEEK_CHECKIN_ID,
    content: {
      title: 'WeekFlow',
      body: "You're halfway through the week — how are your tasks going?",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 4, // 4 = Wednesday
      hour: 19,
      minute: 0,
    },
  });
}
