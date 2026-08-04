import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { useAuth } from '@/features/auth/auth-provider';
import { planReminders } from '@/features/notifications/event-reminders';
// Expo resolves the .native/.web implementation at bundle time; ESLint's resolver does not.
// eslint-disable-next-line import/no-unresolved
import { notificationGateway } from '@/features/notifications/notification-gateway';
import type { PermissionOutcome } from '@/features/notifications/notification-types';
import { registerPushToken } from '@/features/notifications/notification-service';
import { listInvitations } from '@/features/invitations/invitation-service';

/*
 * Owns permission state, the push token, and the scheduled event reminders.
 *
 * Permission is never requested on launch. A cold prompt before the user has
 * anything to be notified about is the fastest way to a permanent denial, and
 * on iOS the system dialog can only ever be shown once — spending it on a
 * first-run modal costs the feature for the lifetime of the install. It is
 * asked for from the notification settings screen, at the moment the user opts
 * in, and the reminders below work without it having been granted.
 */

type NotificationContextValue = {
  permission: PermissionOutcome;
  refreshPermission: () => Promise<void>;
  enable: () => Promise<PermissionOutcome>;
  syncReminders: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: PropsWithChildren) {
  const { status, user } = useAuth();
  const router = useRouter();
  const [permission, setPermission] = useState<PermissionOutcome>('denied');
  const handledInitialRoute = useRef(false);

  const refreshPermission = useCallback(async () => {
    setPermission(await notificationGateway.getPermission());
  }, []);

  const syncReminders = useCallback(async () => {
    if (!user) {
      await notificationGateway.clearReminders();
      return;
    }
    try {
      const invitations = await listInvitations(user.id);
      await notificationGateway.syncReminders(planReminders(invitations, Date.now()));
    } catch {
      // Reminders are a convenience; a failed refresh keeps the previous set.
    }
  }, [user]);

  const enable = useCallback(async (): Promise<PermissionOutcome> => {
    const outcome = await notificationGateway.requestPermission();
    setPermission(outcome);

    if (outcome !== 'granted') {
      trackEvent(ANALYTICS_EVENTS.notificationsDeclined, { outcome });
      return outcome;
    }

    trackEvent(ANALYTICS_EVENTS.notificationsEnabled);
    const token = await notificationGateway.getPushToken();
    if (token && (Platform.OS === 'ios' || Platform.OS === 'android')) {
      try {
        await registerPushToken(token, Platform.OS);
      } catch {
        // The permission is still granted and local reminders still work; a
        // failed registration is retried on the next enable or launch.
      }
    }
    return outcome;
  }, []);

  // Keep the server's idea of this device current. A push token can be reissued
  // by the OS, and a token registered to a previous account on the same device
  // has to be re-pointed on sign-in.
  useEffect(() => {
    if (status !== 'authenticated' || !user) return;
    let cancelled = false;

    void (async () => {
      const current = await notificationGateway.getPermission();
      if (cancelled) return;
      setPermission(current);
      if (current !== 'granted') return;

      const token = await notificationGateway.getPushToken();
      if (cancelled || !token) return;
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
      try {
        await registerPushToken(token, Platform.OS);
      } catch {
        // Nothing the user can act on.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, user]);

  useEffect(() => {
    void syncReminders();
  }, [syncReminders]);

  // Reminders drift as invitations are published, edited or archived, so they
  // are recomputed whenever the app comes back to the foreground rather than
  // only at launch.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      if (previous.match(/inactive|background/) && next === 'active') void syncReminders();
      previous = next;
    });
    return () => subscription.remove();
  }, [syncReminders]);

  // Tapping a notification opens what it is about. Routes are produced by the
  // database and the local scheduler, never by the notification payload of an
  // untrusted sender, so they are safe to navigate to — but they are still
  // checked for shape before use.
  useEffect(() => {
    function go(route: string | null) {
      if (!route || !route.startsWith('/')) return;
      trackEvent(ANALYTICS_EVENTS.notificationOpened);
      router.push(route as Href);
    }

    const unsubscribe = notificationGateway.addResponseListener(go);

    if (!handledInitialRoute.current) {
      handledInitialRoute.current = true;
      void notificationGateway.getInitialRoute().then(go);
    }

    return unsubscribe;
  }, [router]);

  return (
    <NotificationContext.Provider value={{ enable, permission, refreshPermission, syncReminders }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('useNotifications yalnızca NotificationProvider içinde kullanılabilir.');
  return value;
}
