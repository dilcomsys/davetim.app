import { describe, expect, it } from 'vitest';

import { decidePrompt, REVIEW_RULES, type PromptContext, type PromptState } from '@/features/prompts/prompt-decision';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

function state(overrides: Partial<PromptState> = {}): PromptState {
  return {
    dismissedUpdateVersion: null,
    reviewedVersion: null,
    lastReviewPromptAt: null,
    firstLaunchAt: NOW - 30 * DAY,
    positiveMoments: 5,
    ...overrides,
  };
}

function context(overrides: Partial<PromptContext> = {}): PromptContext {
  return {
    currentVersion: '1.0.0',
    release: { latestVersion: '1.0.0', minSupportedVersion: '1.0.0', notes: null, storeUrl: 'https://apps.apple.com/app/id1' },
    state: state(),
    now: NOW,
    reviewAvailable: true,
    ...overrides,
  };
}

describe('decidePrompt priority', () => {
  // The whole reason this is one function: two prompts must never be eligible
  // at once. A user below the minimum version also qualifies for a review by
  // every other rule, and the system rating alert would stack on the sheet.
  it('picks the forced update even when a review is otherwise due', () => {
    expect(decidePrompt(context({
      release: { latestVersion: '2.0.0', minSupportedVersion: '1.5.0', notes: null, storeUrl: 'https://store' },
    }))).toBe('forced_update');
  });

  it('prefers an optional update over a review', () => {
    expect(decidePrompt(context({
      release: { latestVersion: '1.1.0', minSupportedVersion: '0.9.0', notes: null, storeUrl: 'https://store' },
    }))).toBe('optional_update');
  });

  it('falls through to the review when there is nothing to update to', () => {
    expect(decidePrompt(context())).toBe('review');
  });
});

describe('update rules', () => {
  it('does not force an update without somewhere to send the user', () => {
    expect(decidePrompt(context({
      release: { latestVersion: '2.0.0', minSupportedVersion: '1.5.0', notes: null, storeUrl: null },
      state: state({ positiveMoments: 0 }),
    }))).toBeNull();
  });

  it('stops asking about a version the user already dismissed', () => {
    const release = { latestVersion: '1.1.0', minSupportedVersion: '0.9.0', notes: null, storeUrl: 'https://store' };
    expect(decidePrompt(context({ release, state: state({ dismissedUpdateVersion: '1.1.0', positiveMoments: 0 }) }))).toBeNull();
  });

  it('asks again once a newer version ships', () => {
    const release = { latestVersion: '1.2.0', minSupportedVersion: '0.9.0', notes: null, storeUrl: 'https://store' };
    expect(decidePrompt(context({ release, state: state({ dismissedUpdateVersion: '1.1.0' }) }))).toBe('optional_update');
  });

  // A malformed or missing release row must be inert, never a lockout.
  it('shows nothing when the release row is unusable', () => {
    expect(decidePrompt(context({ release: null, state: state({ positiveMoments: 0 }) }))).toBeNull();
    expect(decidePrompt(context({
      release: { latestVersion: 'çok yeni', minSupportedVersion: 'eski', notes: null, storeUrl: 'https://store' },
      state: state({ positiveMoments: 0 }),
    }))).toBeNull();
  });
});

describe('review rules', () => {
  it('stays quiet when the platform has no review API', () => {
    expect(decidePrompt(context({ reviewAvailable: false }))).toBeNull();
  });

  it('asks only once per app version', () => {
    expect(decidePrompt(context({ state: state({ reviewedVersion: '1.0.0' }) }))).toBeNull();
    expect(decidePrompt(context({ state: state({ reviewedVersion: '0.9.0' }) }))).toBe('review');
  });

  it('waits for the user to have got something out of the app', () => {
    expect(decidePrompt(context({ state: state({ positiveMoments: REVIEW_RULES.minPositiveMoments - 1 }) }))).toBeNull();
    expect(decidePrompt(context({ state: state({ positiveMoments: REVIEW_RULES.minPositiveMoments }) }))).toBe('review');
  });

  it('waits a few days after install', () => {
    expect(decidePrompt(context({ state: state({ firstLaunchAt: NOW - 1 * DAY }) }))).toBeNull();
    expect(decidePrompt(context({ state: state({ firstLaunchAt: null }) }))).toBeNull();
  });

  it('respects the gap between asks', () => {
    expect(decidePrompt(context({ state: state({ lastReviewPromptAt: NOW - 10 * DAY, reviewedVersion: '0.9.0' }) }))).toBeNull();
    expect(decidePrompt(context({
      state: state({ lastReviewPromptAt: NOW - (REVIEW_RULES.minDaysBetweenPrompts + 1) * DAY, reviewedVersion: '0.9.0' }),
    }))).toBe('review');
  });
});
