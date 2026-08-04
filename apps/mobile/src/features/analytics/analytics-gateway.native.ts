import type { AnalyticsGateway } from '@/features/analytics/analytics-types';
import { sanitizeParams } from '@/features/analytics/events';

/*
 * Firebase Analytics, loaded on demand.
 *
 * The module is never imported at module scope, for the same reason the ads
 * gateway defers its import: @react-native-firebase reaches for a native
 * module while it is being evaluated, and that throws where the native module
 * is absent — Expo Go, and any environment without the google-services files.
 * A static import here would take down app startup, because analytics is
 * initialised from the root layout.
 *
 * Every method swallows its own failures. Analytics is never allowed to be the
 * reason a screen breaks, so a missing module or a rejected call degrades to
 * "no data" rather than an error the user sees.
 */
type AnalyticsModule = typeof import('@react-native-firebase/analytics');

let modulePromise: Promise<AnalyticsModule | null> | null = null;

function loadModule(): Promise<AnalyticsModule | null> {
  modulePromise ??= import('@react-native-firebase/analytics').catch(() => null);
  return modulePromise;
}

async function client() {
  const module = await loadModule();
  if (!module) return null;
  try {
    return module.getAnalytics();
  } catch {
    return null;
  }
}

export const analyticsGateway: AnalyticsGateway = {
  async track(name, params) {
    try {
      const module = await loadModule();
      const analytics = await client();
      if (!module || !analytics) return;
      /*
       * The catalogue deliberately uses Firebase's own names for `sign_up` and
       * `login`, because those light up the built-in acquisition reports that
       * custom names do not. The trade is that the SDK types those two through
       * dedicated overloads with required parameter shapes, which a catalogue
       * of plain string constants cannot satisfy at the type level. The values
       * are correct at runtime — already sanitised above — so the call is
       * narrowed to the generic overload here rather than giving up the
       * standard names.
       */
      const logEvent = module.logEvent as (
        instance: typeof analytics,
        eventName: string,
        eventParams?: Record<string, unknown>,
      ) => Promise<void>;
      await logEvent(analytics, name, sanitizeParams(params));
    } catch {
      // Intentionally silent.
    }
  },

  async identify(userId) {
    try {
      const module = await loadModule();
      const analytics = await client();
      if (!module || !analytics) return;
      await module.setUserId(analytics, userId);
    } catch {
      // Intentionally silent.
    }
  },

  async setProperties(properties) {
    try {
      const module = await loadModule();
      const analytics = await client();
      if (!module || !analytics) return;
      await module.setUserProperties(analytics, properties);
    } catch {
      // Intentionally silent.
    }
  },

  async screen(name) {
    try {
      const module = await loadModule();
      const analytics = await client();
      if (!module || !analytics) return;
      await module.logScreenView(analytics, { screen_class: name, screen_name: name });
    } catch {
      // Intentionally silent.
    }
  },

  async setEnabled(enabled) {
    try {
      const module = await loadModule();
      const analytics = await client();
      if (!module || !analytics) return;
      await module.setAnalyticsCollectionEnabled(analytics, enabled);
    } catch {
      // Intentionally silent.
    }
  },
};
