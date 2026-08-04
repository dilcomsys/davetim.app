import { describe, expect, it } from 'vitest';

import { formatEventDate, parseCalendarDate } from '@/lib/format';

describe('parseCalendarDate', () => {
  /*
   * The zone cannot be swapped inside the run — Node fixes it when Intl first
   * initialises, so setting `process.env.TZ` mid-test does nothing. The
   * assertion is made zone-independent instead: a date-only string has to land
   * on local midnight of that day, which is exactly what `new Date(string)`
   * does not do. Under the old implementation this is midnight UTC and the
   * local parts come back as the day before anywhere west of Greenwich.
   */
  it('lands a date-only string on local midnight of that day', () => {
    const parsed = parseCalendarDate('2026-09-12');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8);
    expect(parsed.getDate()).toBe(12);
    expect(parsed.getHours()).toBe(0);
  });

  it('leaves a full timestamp to the platform parser', () => {
    expect(parseCalendarDate('2026-09-12T18:30:00Z').toISOString()).toBe('2026-09-12T18:30:00.000Z');
  });
});

describe('formatEventDate', () => {
  it('writes a stored date out in Turkish', () => {
    expect(formatEventDate('2026-09-12')).toBe('12 Eylül 2026');
  });

  it('names the gap rather than printing an empty string', () => {
    expect(formatEventDate(null)).toBe('Tarih eklenmedi');
  });

  it('passes through anything it cannot parse', () => {
    expect(formatEventDate('yakında')).toBe('yakında');
  });
});
