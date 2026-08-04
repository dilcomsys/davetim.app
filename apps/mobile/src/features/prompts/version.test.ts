import { describe, expect, it } from 'vitest';

import { compareVersions, isOlderThan, parseVersion } from '@/features/prompts/version';

describe('parseVersion', () => {
  it('reads the shapes a store version actually takes', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
    expect(parseVersion('v2.0.0')).toEqual([2, 0, 0]);
    expect(parseVersion(' 1.4 ')).toEqual([1, 4, 0]);
    expect(parseVersion('3')).toEqual([3, 0, 0]);
    expect(parseVersion('1.2.3-beta.1')).toEqual([1, 2, 3]);
  });

  it('has no opinion on something it cannot read', () => {
    expect(parseVersion(null)).toBeNull();
    expect(parseVersion('')).toBeNull();
    expect(parseVersion('latest')).toBeNull();
  });
});

describe('compareVersions', () => {
  // String comparison gets this one backwards, and it is the case that decides
  // whether a forced update fires against the newest build.
  it('orders 1.10.0 after 1.9.0', () => {
    expect(compareVersions('1.9.0', '1.10.0')).toBe(-1);
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
  });

  it('treats missing segments as zero', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
  });

  it('returns null when either side is unreadable', () => {
    expect(compareVersions('1.0.0', 'çok yeni')).toBeNull();
    expect(compareVersions(null, '1.0.0')).toBeNull();
  });
});

describe('isOlderThan', () => {
  it('is true only for a genuinely older version', () => {
    expect(isOlderThan('1.0.0', '1.0.1')).toBe(true);
    expect(isOlderThan('1.0.1', '1.0.1')).toBe(false);
    expect(isOlderThan('1.1.0', '1.0.1')).toBe(false);
  });

  // A malformed release row must never lock anyone out of the app.
  it('is false when the comparison is unreadable', () => {
    expect(isOlderThan('1.0.0', undefined)).toBe(false);
    expect(isOlderThan(null, '9.9.9')).toBe(false);
  });
});
