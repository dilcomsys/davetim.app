// Expo resolves the .native/.web implementation at bundle time; ESLint's resolver does not.
// eslint-disable-next-line import/no-unresolved
import { analyticsGateway } from '@/features/analytics/analytics-gateway';
import type { AnalyticsEvent, AnalyticsParams } from '@/features/analytics/events';

/*
 * The one entry point call sites use.
 *
 * Everything is fire-and-forget: `void` on purpose, so instrumenting a handler
 * never turns it async and never adds a failure path to a user action. The
 * gateway already swallows its own errors; the extra `catch` here covers the
 * case where the module itself fails to resolve.
 */
function fireAndForget(work: () => Promise<void>) {
  try {
    void work().catch(() => {});
  } catch {
    // Unreachable in practice, but analytics must not throw synchronously either.
  }
}

export function trackEvent(name: AnalyticsEvent, params?: AnalyticsParams) {
  fireAndForget(() => analyticsGateway.track(name, params));
}

export function trackScreen(name: string) {
  fireAndForget(() => analyticsGateway.screen(name));
}

/**
 * Ties events to an account using the Supabase user ID — a pseudonymous
 * identifier the app already holds, never an e-mail address or a name. Passing
 * `null` on sign-out clears it so the next account's events are not attributed
 * to the previous one on a shared device.
 */
export function identifyUser(userId: string | null) {
  fireAndForget(async () => {
    await analyticsGateway.identify(userId ?? '');
  });
}

export function setUserProperties(properties: Record<string, string>) {
  fireAndForget(() => analyticsGateway.setProperties(properties));
}

export function setAnalyticsEnabled(enabled: boolean) {
  fireAndForget(() => analyticsGateway.setEnabled(enabled));
}
