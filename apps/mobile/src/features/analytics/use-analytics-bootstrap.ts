import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { setAnalyticsEnabled, trackEvent, trackScreen } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { routeShape } from '@/features/analytics/route-shape';

/*
 * App-level analytics: one open event per foreground session, and a screen view
 * per route.
 *
 * "Session" here means a real return to the app, not a re-render — `AppState`
 * fires `active` for transient interruptions too (a permission sheet, the
 * control centre), so a naive listener reports several opens for one use. Only
 * a transition from background counts.
 */
export function useAnalyticsBootstrap() {
  const pathname = usePathname();
  const lastScreen = useRef<string | null>(null);

  useEffect(() => {
    /*
     * Collection is turned on explicitly rather than left to the defaults.
     * The generated GoogleService-Info.plist ships `IS_ANALYTICS_ENABLED` set
     * to false; that key does not actually govern collection — the iOS SDK
     * reads `FIREBASE_ANALYTICS_COLLECTION_ENABLED` from Info.plist — but
     * depending on which of two similarly named keys wins is how a release
     * ends up with empty dashboards and no error. One call removes the
     * question on both platforms.
     */
    setAnalyticsEnabled(true);
    trackEvent(ANALYTICS_EVENTS.appOpened, { cold_start: true });

    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (previousState.match(/inactive|background/) && nextState === 'active') {
        trackEvent(ANALYTICS_EVENTS.appOpened, { cold_start: false });
      }
      previousState = nextState;
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const name = routeShape(pathname);
    if (name === lastScreen.current) return;
    lastScreen.current = name;
    trackScreen(name);
  }, [pathname]);
}
