import type { AnalyticsGateway } from '@/features/analytics/analytics-types';

/*
 * Web has no Firebase Analytics here on purpose. The web build exists for the
 * static export and for the public invitation and RSVP pages — surfaces a guest
 * opens from a link, often without ever having agreed to anything. Measuring
 * them would mean a consent banner and a second processor to disclose, for
 * traffic the product does not make decisions from.
 */
export const analyticsGateway: AnalyticsGateway = {
  async track() {},
  async identify() {},
  async setProperties() {},
  async screen() {},
  async setEnabled() {},
};
