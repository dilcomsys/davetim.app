import * as Application from 'expo-application';
import * as StoreReview from 'expo-store-review';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { decidePrompt, type PromptKind, type ReleaseInfo } from '@/features/prompts/prompt-decision';
import {
  ensureFirstLaunch,
  readPromptState,
  recordPositiveMoment,
  recordReviewPrompted,
  recordUpdateDismissed,
} from '@/features/prompts/prompt-storage';
import { fetchRelease } from '@/features/prompts/release-service';
import { UpdateModal } from '@/features/prompts/update-modal';

/*
 * Owns every interruption the app is allowed to make, so that only one of them
 * can ever be on screen.
 *
 * The rule this enforces is not "show the update, then maybe the review" — it
 * is that a single decision runs once, produces at most one prompt, and nothing
 * else may ask. Two independent effects, each reasonable on its own, is exactly
 * how an iOS rating alert ends up stacked over a modal sheet.
 *
 * It also deliberately waits. Firing on the first frame competes with the
 * splash screen, the auth restore and the first data load; a prompt that lands
 * mid-transition looks like a glitch and gets dismissed reflexively.
 */

type PromptContextValue = {
  /** Call after the user finishes something worth celebrating. */
  celebrate: () => void;
};

const PromptContext = createContext<PromptContextValue | null>(null);

const STARTUP_DELAY_MS = 2500;

export function PromptProvider({ children }: PropsWithChildren) {
  const [active, setActive] = useState<PromptKind | null>(null);
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const currentVersion = Application.nativeApplicationVersion;
  // One decision per app launch. Without this, any re-render of the tree could
  // re-open a prompt the user just dismissed.
  const decided = useRef(false);

  const celebrate = useCallback(() => {
    void recordPositiveMoment();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (decided.current || cancelled) return;
        decided.current = true;

        const now = Date.now();
        const [state, releaseInfo, reviewAvailable] = await Promise.all([
          ensureFirstLaunch(now).then(() => readPromptState()),
          fetchRelease(),
          StoreReview.isAvailableAsync().catch(() => false),
        ]);
        if (cancelled) return;

        const kind = decidePrompt({ currentVersion, now, release: releaseInfo, reviewAvailable, state });
        if (!kind) return;

        setRelease(releaseInfo);

        if (kind === 'review') {
          // The rating request is a system alert with no result and no
          // dismissal callback, so it is recorded as asked the moment it is
          // requested — the platform will silently no-op if it decides not to
          // show it, and asking again later is worse than missing one.
          await recordReviewPrompted(currentVersion, now);
          trackEvent(ANALYTICS_EVENTS.reviewPromptShown, { version: currentVersion });
          try {
            await StoreReview.requestReview();
          } catch {
            // Nothing to recover: the platform owns this UI.
          }
          return;
        }

        setActive(kind);
        trackEvent(ANALYTICS_EVENTS.updatePromptShown, {
          blocking: kind === 'forced_update',
          target_version: releaseInfo?.latestVersion,
        });
      })();
    }, STARTUP_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentVersion]);

  async function openStore() {
    const url = release?.storeUrl;
    trackEvent(ANALYTICS_EVENTS.updatePromptAccepted, { blocking: active === 'forced_update' });
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      // The sheet stays up; a blocking one must not be escapable by a failed
      // store launch.
    }
  }

  function dismiss() {
    trackEvent(ANALYTICS_EVENTS.updatePromptDismissed, { target_version: release?.latestVersion });
    void recordUpdateDismissed(release?.latestVersion ?? null);
    setActive(null);
  }

  return (
    <PromptContext.Provider value={{ celebrate }}>
      {children}
      {active === 'forced_update' || active === 'optional_update' ? (
        <UpdateModal
          blocking={active === 'forced_update'}
          notes={release?.notes ?? null}
          onDismiss={dismiss}
          onUpdate={() => void openStore()}
          version={release?.latestVersion ?? null}
        />
      ) : null}
    </PromptContext.Provider>
  );
}

/**
 * Records that something good happened. Safe to call outside the provider —
 * it degrades to doing nothing rather than throwing, because the callers are
 * success paths and must not fail on a missing provider.
 */
export function usePrompts(): PromptContextValue {
  return useContext(PromptContext) ?? { celebrate: () => {} };
}
