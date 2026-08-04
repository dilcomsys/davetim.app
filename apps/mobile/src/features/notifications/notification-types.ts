import type { PlannedReminder } from '@/features/notifications/event-reminders';

/**
 * `blocked` is kept apart from `denied` on purpose: the first can only be
 * undone in system settings, so the UI has to offer a different action.
 * `unsupported` covers a simulator or a build with no push capability, where
 * asking the user for anything would be misleading.
 */
export type PermissionOutcome = 'granted' | 'denied' | 'blocked' | 'unsupported';

export type NotificationGateway = {
  requestPermission(): Promise<PermissionOutcome>;
  getPermission(): Promise<PermissionOutcome>;
  getPushToken(): Promise<string | null>;
  syncReminders(reminders: PlannedReminder[]): Promise<void>;
  clearReminders(): Promise<void>;
  addResponseListener(handler: (route: string | null) => void): () => void;
  getInitialRoute(): Promise<string | null>;
};
