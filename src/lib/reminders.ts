import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar/legacy';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export interface ScheduleOptions {
  bookTitle: string;
  stackName: string;
  hour: number;       // 0-23
  minute: number;     // 0-59
  repeatDaily: boolean;
}

/**
 * Schedule a daily reading reminder.
 * Returns the notification identifier so it can be cancelled later.
 */
export async function scheduleReadingReminder(opts: ScheduleOptions): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();

    const trigger: any = opts.repeatDaily
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: opts.hour,
          minute: opts.minute,
        }
      : {
          date: (() => {
            const d = new Date();
            d.setHours(opts.hour, opts.minute, 0, 0);
            if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
            return d;
          })(),
        };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time to read "${opts.bookTitle}"`,
        body: `Your ${opts.stackName} reading session is ready. Keep your streak going!`,
        sound: false,
      },
      trigger,
    });
    return id;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Write a reading block to the device calendar.
 * Uses the first writable calendar available.
 */
export async function addToCalendar(opts: {
  bookTitle: string;
  stackName: string;
  startDate: Date;
  durationMinutes: number;
}): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return null;
    const granted = await requestCalendarPermission();
    if (!granted) return null;

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const writable = calendars.find((c) => c.allowsModifications && !(c as any).isImmutable);
    if (!writable) return null;

    const endDate = new Date(opts.startDate.getTime() + opts.durationMinutes * 60 * 1000);
    const eventId = await Calendar.createEventAsync(writable.id, {
      title: `Read: "${opts.bookTitle}"`,
      notes: `${opts.stackName} stack reading session`,
      startDate: opts.startDate,
      endDate,
      alarms: [{ relativeOffset: -5 }],
    });
    return eventId;
  } catch {
    return null;
  }
}
