/**
 * Reminders store — user-defined local reminders. PepRep never proposes a
 * time or frequency; the user creates every reminder from scratch.
 * Notifications are strictly local (expo-notifications); nothing leaves the
 * device.
 */

import { Platform } from "react-native";
import { create } from "zustand";

import type { Reminder } from "@/src/db/models";
import { createId } from "@/src/db/models";
import { remindersRepository } from "@/src/db/repositories";

export type NewReminder = Pick<Reminder, "label" | "hour" | "minute">;

type NotificationsModule = typeof import("expo-notifications");

async function getNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === "web") return null;
  return import("expo-notifications");
}

async function ensurePermission(Notifications: NotificationsModule): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

async function scheduleDaily(reminder: Reminder): Promise<string | null> {
  const Notifications = await getNotifications();
  if (Notifications === null) return null;
  try {
    const granted = await ensurePermission(Notifications);
    if (!granted) return null;
    await ensureAndroidChannel(Notifications);
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.label.length > 0 ? reminder.label : "PepRep reminder",
        body: "Your scheduled reminder.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
        channelId: Platform.OS === "android" ? "reminders" : undefined,
      },
    });
  } catch (error) {
    console.error("[reminders] Failed to schedule notification", error);
    return null;
  }
}

export type WeeklyReminderInput = {
  /** Expo weekday: 1 = Sunday … 7 = Saturday (JS dayOfWeek + 1). */
  weekday: number;
  hour: number;
  minute: number;
  title: string;
  body: string;
};

/** Schedule a weekly local notification. Returns null on web / denied / failure. */
export async function scheduleWeekly(input: WeeklyReminderInput): Promise<string | null> {
  const Notifications = await getNotifications();
  if (Notifications === null) return null;
  try {
    const granted = await ensurePermission(Notifications);
    if (!granted) return null;
    await ensureAndroidChannel(Notifications);
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: input.weekday,
        hour: input.hour,
        minute: input.minute,
        channelId: Platform.OS === "android" ? "reminders" : undefined,
      },
    });
  } catch (error) {
    console.error("[reminders] Failed to schedule weekly notification", error);
    return null;
  }
}

export async function cancelScheduledNotification(
  notificationId: string | null | undefined,
): Promise<void> {
  if (notificationId == null) return;
  const Notifications = await getNotifications();
  if (Notifications === null) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("[reminders] Failed to cancel notification", error);
  }
}

/**
 * One-shot snooze. Privacy-safe body — never includes compound or dose.
 * Returns notification id, or null on web / denied / failure.
 */
export async function scheduleSnoozeMinutes(minutes: number): Promise<string | null> {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const Notifications = await getNotifications();
  if (Notifications === null) return null;
  try {
    const granted = await ensurePermission(Notifications);
    if (!granted) return null;
    await ensureAndroidChannel(Notifications);
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "PepRep reminder",
        body: "You asked to be reminded.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.round(minutes * 60),
        channelId: Platform.OS === "android" ? "reminders" : undefined,
      },
    });
  } catch (error) {
    console.error("[reminders] Failed to schedule snooze", error);
    return null;
  }
}

async function cancelScheduled(notificationId: string | null): Promise<void> {
  await cancelScheduledNotification(notificationId);
}

interface RemindersState {
  reminders: Reminder[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addReminder: (input: NewReminder) => Promise<void>;
  setEnabled: (id: string, enabled: boolean) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  reset: () => Promise<void>;
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  reminders: [],
  hydrated: false,

  hydrate: async () => {
    const reminders = await remindersRepository.list();
    set({ reminders, hydrated: true });
  },

  addReminder: async (input: NewReminder) => {
    const draft: Reminder = {
      id: createId(),
      label: input.label,
      hour: input.hour,
      minute: input.minute,
      enabled: false,
      notificationId: null,
    };
    const notificationId = await scheduleDaily(draft);
    const reminder: Reminder = {
      ...draft,
      enabled: notificationId !== null,
      notificationId,
    };
    const reminders = [...get().reminders, reminder];
    set({ reminders });
    await remindersRepository.saveAll(reminders);
  },

  setEnabled: async (id: string, enabled: boolean) => {
    const existing = get().reminders.find((reminder) => reminder.id === id);
    if (existing === undefined) return;

    let notificationId: string | null = null;
    if (enabled) {
      notificationId = await scheduleDaily(existing);
      if (notificationId === null) return;
    } else {
      await cancelScheduled(existing.notificationId);
    }

    const reminders = get().reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, enabled, notificationId } : reminder,
    );
    set({ reminders });
    await remindersRepository.saveAll(reminders);
  },

  removeReminder: async (id: string) => {
    const existing = get().reminders.find((reminder) => reminder.id === id);
    if (existing !== undefined) await cancelScheduled(existing.notificationId);
    const reminders = get().reminders.filter((reminder) => reminder.id !== id);
    set({ reminders });
    await remindersRepository.saveAll(reminders);
  },

  reset: async () => {
    for (const reminder of get().reminders) {
      await cancelScheduled(reminder.notificationId);
    }
    set({ reminders: [], hydrated: true });
  },
}));
