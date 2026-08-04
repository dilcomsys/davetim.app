import type { NotificationGateway } from '@/features/notifications/notification-types';

/*
 * The web build serves the public invitation and RSVP pages, which guests open
 * from a link. Nothing there belongs to an account, so there is nobody to
 * notify and no token to register.
 */
export const notificationGateway: NotificationGateway = {
  async requestPermission() { return 'unsupported'; },
  async getPermission() { return 'unsupported'; },
  async getPushToken() { return null; },
  async syncReminders() {},
  async clearReminders() {},
  addResponseListener() { return () => {}; },
  async getInitialRoute() { return null; },
};
