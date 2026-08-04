import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PromptState } from '@/features/prompts/prompt-decision';

/*
 * Prompt bookkeeping lives on the device, not the server.
 *
 * Nothing here is worth a row in Postgres: it is one device's memory of what it
 * has already asked, and asking again on a new device is the correct behaviour
 * anyway. Keeping it local also means the update check works before sign-in,
 * which is exactly when a blocking update prompt matters most.
 *
 * `AsyncStorage`, not `SecureStore`: none of it is sensitive, and SecureStore
 * has a size limit and a keychain prompt cost that this does not deserve.
 */
const STORAGE_KEY = 'davetim.prompts.v1';

const EMPTY: PromptState = {
  dismissedUpdateVersion: null,
  reviewedVersion: null,
  lastReviewPromptAt: null,
  firstLaunchAt: null,
  positiveMoments: 0,
};

function decode(raw: string | null): PromptState {
  if (!raw) return { ...EMPTY };
  try {
    const parsed = JSON.parse(raw) as Partial<PromptState>;
    return {
      dismissedUpdateVersion: typeof parsed.dismissedUpdateVersion === 'string' ? parsed.dismissedUpdateVersion : null,
      reviewedVersion: typeof parsed.reviewedVersion === 'string' ? parsed.reviewedVersion : null,
      lastReviewPromptAt: typeof parsed.lastReviewPromptAt === 'number' ? parsed.lastReviewPromptAt : null,
      firstLaunchAt: typeof parsed.firstLaunchAt === 'number' ? parsed.firstLaunchAt : null,
      positiveMoments: typeof parsed.positiveMoments === 'number' && parsed.positiveMoments >= 0
        ? Math.floor(parsed.positiveMoments)
        : 0,
    };
  } catch {
    // Corrupt value: start over rather than crash on launch.
    return { ...EMPTY };
  }
}

export async function readPromptState(): Promise<PromptState> {
  try {
    return decode(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return { ...EMPTY };
  }
}

export async function writePromptState(state: PromptState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Losing the record means one extra prompt at worst.
  }
}

/**
 * Stamps the install date the first time it is called. The review rules need
 * "how long have they had this", and there is no reliable install timestamp
 * available on both platforms.
 */
export async function ensureFirstLaunch(now: number): Promise<PromptState> {
  const state = await readPromptState();
  if (state.firstLaunchAt !== null) return state;
  const next = { ...state, firstLaunchAt: now };
  await writePromptState(next);
  return next;
}

export async function recordPositiveMoment(): Promise<void> {
  const state = await readPromptState();
  await writePromptState({ ...state, positiveMoments: state.positiveMoments + 1 });
}

export async function recordUpdateDismissed(version: string | null): Promise<void> {
  const state = await readPromptState();
  await writePromptState({ ...state, dismissedUpdateVersion: version });
}

export async function recordReviewPrompted(version: string | null, now: number): Promise<void> {
  const state = await readPromptState();
  await writePromptState({ ...state, lastReviewPromptAt: now, reviewedVersion: version });
}

export const __testing = { decode, EMPTY, STORAGE_KEY };
