import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedReminder } from '@/features/notifications/event-reminders';
import type { NotificationGateway, PermissionOutcome } from '@/features/notifications/notification-types';

/*
 * The device half of notifications.
 *
 * Everything here fails soft. A simulator has no push token, a user may have
 * denied the permission in system settings, and a development build may have no
 * project ID — none of which is an error the person using the app can act on,
 * so each degrades to "notifications are off" rather than an alert.
 */

// Foreground behaviour: an RSVP arriving while the owner is looking at the
// guest list should still be visible, because the list does not live-update.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId
    ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  // Android drops notifications with no channel. The name and description are
  // what the user sees in system settings, so they are written for them.
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Davet bildirimleri',
    description: 'Davetli yanıtları, galeri paylaşımları ve etkinlik hatırlatmaları.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

export const notificationGateway: NotificationGateway = {
  async requestPermission(): Promise<PermissionOutcome> {
    // A push token needs real hardware; a simulator returns nothing useful and
    // asking for the permission there only trains people to dismiss it.
    if (!Device.isDevice) return 'unsupported';

    try {
      await ensureAndroidChannel();
      const existing = await Notifications.getPermissionsAsync();
      if (existing.granted) return 'granted';
      // iOS only ever shows the system prompt once. Asking again when it can no
      // longer be shown just returns denied, so the caller is told to send the
      // user to settings instead.
      if (!existing.canAskAgain) return 'blocked';

      const requested = await Notifications.requestPermissionsAsync();
      return requested.granted ? 'granted' : 'denied';
    } catch {
      return 'unsupported';
    }
  },

  async getPermission(): Promise<PermissionOutcome> {
    if (!Device.isDevice) return 'unsupported';
    try {
      const status = await Notifications.getPermissionsAsync();
      if (status.granted) return 'granted';
      return status.canAskAgain ? 'denied' : 'blocked';
    } catch {
      return 'unsupported';
    }
  },

  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;
    try {
      const id = projectId();
      const token = await Notifications.getExpoPushTokenAsync(id ? { projectId: id } : undefined);
      return token.data || null;
    } catch {
      // No project ID, no network, or a build without push entitlements.
      return null;
    }
  },

  /*
   * Reminders are replaced wholesale rather than diffed. The scheduled set is
   * small, the plan is cheap to recompute, and cancelling only what the app
   * scheduled avoids the class of bug where an edited or deleted invitation
   * leaves a reminder behind that nothing can find again.
   */
  async syncReminders(reminders: PlannedReminder[]): Promise<void> {
    try {
      await ensureAndroidChannel();
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        scheduled
          .filter((item) => typeof item.content.data?.reminderId === 'string')
          .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
      );

      for (const reminder of reminders) {
        await Notifications.scheduleNotificationAsync({
          content: {
            body: reminder.body,
            data: { invitationId: reminder.invitationId, reminderId: reminder.id, route: `/invitation/${reminder.invitationId}` },
            title: reminder.title,
          },
          trigger: {
            channelId: 'default',
            date: new Date(reminder.fireAt),
            type: Notifications.SchedulableTriggerInputTypes.DATE,
          },
        });
      }
    } catch {
      // Reminders are a convenience; losing them must not surface as an error.
    }
  },

  async clearReminders(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        scheduled
          .filter((item) => typeof item.content.data?.reminderId === 'string')
          .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
      );
    } catch {
      // Nothing to recover.
    }
  },

  addResponseListener(handler: (route: string | null) => void) {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;
      handler(typeof route === 'string' ? route : null);
    });
    return () => subscription.remove();
  },

  async getInitialRoute(): Promise<string | null> {
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      const route = response?.notification.request.content.data?.route;
      return typeof route === 'string' ? route : null;
    } catch {
      return null;
    }
  },
};
