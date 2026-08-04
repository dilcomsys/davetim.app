import type { AnalyticsEvent, AnalyticsParams } from '@/features/analytics/events';

/**
 * The surface the app codes against. Both the native Firebase implementation
 * and the web no-op satisfy it, so a call site never has to know which one it
 * got — or whether analytics is available at all.
 */
export type AnalyticsGateway = {
  track(name: AnalyticsEvent, params?: AnalyticsParams): Promise<void>;
  identify(userId: string): Promise<void>;
  setProperties(properties: Record<string, string>): Promise<void>;
  screen(name: string): Promise<void>;
  setEnabled(enabled: boolean): Promise<void>;
};
