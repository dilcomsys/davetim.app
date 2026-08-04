import { describe, expect, it } from 'vitest';

import { routeShape } from '@/features/analytics/route-shape';

describe('routeShape', () => {
  it('names the root', () => {
    expect(routeShape('/')).toBe('home');
    expect(routeShape('')).toBe('home');
  });

  // Without this every invitation becomes its own screen name.
  it('collapses identifier segments', () => {
    expect(routeShape('/invitation/546ad9da-19bc-4828-9018-56a8ac81eb08')).toBe('invitation/:id');
    expect(routeShape('/editor/9f2c1b4e5a6d7c8e')).toBe('editor/:id');
    expect(routeShape('/guests/42')).toBe('guests/:id');
  });

  it('keeps real route names, including short words that look hex-ish', () => {
    expect(routeShape('/(tabs)/templates')).toBe('(tabs)/templates');
    expect(routeShape('/editor/new')).toBe('editor/new');
    expect(routeShape('/legal/privacy')).toBe('legal/privacy');
  });

  it('handles a trailing slash', () => {
    expect(routeShape('/account/')).toBe('account');
  });
});
