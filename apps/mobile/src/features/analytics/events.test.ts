import { describe, expect, it } from 'vitest';

import { ANALYTICS_EVENTS, isValidEventName, sanitizeParams } from '@/features/analytics/events';

describe('event catalogue', () => {
  // The whole point of the catalogue: a name Firebase would silently drop
  // fails here instead of leaving a hole in a funnel weeks later.
  it('only contains names Firebase will accept', () => {
    const rejected = Object.values(ANALYTICS_EVENTS).filter((name) => !isValidEventName(name));
    expect(rejected).toEqual([]);
  });

  it('has no duplicate event names', () => {
    const names = Object.values(ANALYTICS_EVENTS);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('isValidEventName', () => {
  it('rejects the shapes Firebase drops', () => {
    expect(isValidEventName('Invitation-Published')).toBe(false); // dash and capitals
    expect(isValidEventName('2nd_open')).toBe(false); // leading digit
    expect(isValidEventName('a'.repeat(41))).toBe(false); // over 40 characters
    expect(isValidEventName('firebase_start')).toBe(false); // reserved prefix
    expect(isValidEventName('ga_session')).toBe(false);
    expect(isValidEventName('google_ad')).toBe(false);
  });

  it('accepts an ordinary snake_case name', () => {
    expect(isValidEventName('invitation_published')).toBe(true);
  });
});

describe('sanitizeParams', () => {
  it('keeps usable values and drops empty ones', () => {
    expect(sanitizeParams({ count: 3, empty: '   ', missing: null, source: 'gallery', flag: true }))
      .toEqual({ count: 3, source: 'gallery', flag: true });
  });

  it('truncates a long value rather than losing the event', () => {
    const result = sanitizeParams({ title: 'x'.repeat(250) });
    expect((result.title as string).length).toBe(100);
  });

  it('drops parameter names Firebase would reject', () => {
    expect(sanitizeParams({ 'bad-name': 1, Ok: 2, ok_name: 3 })).toEqual({ ok_name: 3 });
  });

  it('drops non-finite numbers', () => {
    expect(sanitizeParams({ ratio: Number.NaN, size: Number.POSITIVE_INFINITY, ok: 1 })).toEqual({ ok: 1 });
  });

  it('returns an empty object for no params', () => {
    expect(sanitizeParams(undefined)).toEqual({});
  });
});
