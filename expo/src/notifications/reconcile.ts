/**
 * Notification reconciliation — the I/O side of orphans.ts.
 *
 * Scheduled local notifications live in the OS, not in PepRep's data. If the
 * data goes away without a cancel (erase, restore, an old bug), the OS keeps
 * firing "ghost" reminders. Boot-time reconciliation cancels any repeating
 * notification the current app state doesn't know about.
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { isRepeatingTrigger, selectOrphanedRepeatingIds } from "./orphans";

/** Cancels repeating notifications not present in knownIds. Returns how many were cancelled. */
export async function reconcileScheduledNotifications(
  knownIds: readonly (string | null | undefined)[],
): Promise<number> {
  if (Platform.OS === "web") return 0;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const rows = scheduled.map((request) => ({
      identifier: request.identifier,
      repeating: isRepeatingTrigger(request.trigger),
    }));
    const orphans = selectOrphanedRepeatingIds(rows, knownIds);
    for (const identifier of orphans) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    }
    if (orphans.length > 0) {
      console.warn(`[notifications] Cancelled ${orphans.length} orphaned reminder(s)`);
    }
    return orphans.length;
  } catch (error) {
    console.error("[notifications] Reconciliation failed", error);
    return 0;
  }
}

/** Cancels every scheduled notification this app owns (erase-all path). */
export async function cancelAllAppNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("[notifications] Failed to cancel all notifications", error);
  }
}
