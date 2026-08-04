/*
 * Pure `mailto:` construction, kept apart from the code that opens it so it can
 * be tested without pulling React Native into the test runner.
 */

export const SUPPORT_ADDRESS = 'info@davetim.app';

export function supportMailUrl(subject: string, body?: string) {
  const query = new URLSearchParams({ subject });
  if (body) query.set('body', body);
  // URLSearchParams encodes spaces as "+", which mail clients show literally in
  // the subject line rather than reading as a space.
  return `mailto:${SUPPORT_ADDRESS}?${query.toString().replace(/\+/g, '%20')}`;
}
