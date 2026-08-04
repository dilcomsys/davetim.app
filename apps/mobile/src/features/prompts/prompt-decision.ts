import { isOlderThan } from '@/features/prompts/version';

/*
 * Decides which single prompt, if any, the app is allowed to show right now.
 *
 * The reason this is one pure function rather than three independent hooks is
 * the failure it exists to prevent: an update sheet and a rating request racing
 * each other on the same launch. On iOS the rating request is a system alert
 * the app cannot see or dismiss, so if both fire the user gets a system dialog
 * stacked over a modal, and dismissing the alert leaves the sheet behind at the
 * wrong scroll offset. One decision, one prompt, strict priority.
 *
 * Priority is not arbitrary. A forced update means the installed build can no
 * longer talk to the backend safely, so nothing else is worth asking. An
 * optional update is still more valuable than a rating, and asking someone to
 * rate a build you are about to replace wastes the one rating prompt per
 * version that the platforms allow.
 */

export type PromptKind = 'forced_update' | 'optional_update' | 'review';

export type ReleaseInfo = {
  latestVersion: string | null;
  minSupportedVersion: string | null;
  storeUrl: string | null;
  notes: string | null;
};

export type PromptState = {
  /** Version string the optional-update sheet was last dismissed for. */
  dismissedUpdateVersion: string | null;
  /** App version the rating request was last made on. */
  reviewedVersion: string | null;
  /** Epoch ms of the last rating request, across all versions. */
  lastReviewPromptAt: number | null;
  /** Epoch ms the app was first opened on this device. */
  firstLaunchAt: number | null;
  /** How many times the user has finished something worth celebrating. */
  positiveMoments: number;
};

export type PromptContext = {
  currentVersion: string | null;
  release: ReleaseInfo | null;
  state: PromptState;
  now: number;
  /** False when the platform has no in-app review API available. */
  reviewAvailable: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/*
 * Apple's guidance is to ask rarely and only after the person has got value
 * out of the app; Google's is the same in different words. Three days of
 * ownership and two finished invitations is the cheapest honest reading of
 * "they have actually used this". 120 days between asks keeps the app well
 * inside both platforms' throttles even across several releases.
 */
export const REVIEW_RULES = {
  minDaysSinceFirstLaunch: 3,
  minPositiveMoments: 2,
  minDaysBetweenPrompts: 120,
} as const;

export function decidePrompt(context: PromptContext): PromptKind | null {
  const { currentVersion, now, release, reviewAvailable, state } = context;

  if (release && isOlderThan(currentVersion, release.minSupportedVersion) && release.storeUrl) {
    return 'forced_update';
  }

  if (
    release
    && isOlderThan(currentVersion, release.latestVersion)
    && release.storeUrl
    // Dismissing is per target version: a newer release may ask again, the same
    // one may not.
    && state.dismissedUpdateVersion !== release.latestVersion
  ) {
    return 'optional_update';
  }

  if (!reviewAvailable) return null;
  if (state.reviewedVersion === currentVersion) return null;
  if (state.positiveMoments < REVIEW_RULES.minPositiveMoments) return null;

  const installedFor = state.firstLaunchAt === null ? 0 : now - state.firstLaunchAt;
  if (installedFor < REVIEW_RULES.minDaysSinceFirstLaunch * DAY_MS) return null;

  if (
    state.lastReviewPromptAt !== null
    && now - state.lastReviewPromptAt < REVIEW_RULES.minDaysBetweenPrompts * DAY_MS
  ) {
    return null;
  }

  return 'review';
}
