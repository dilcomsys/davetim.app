import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/*
 * Tab screens stay mounted, so their data was fetched once and never again.
 * Create an invitation in the editor, come back to the list, and the list still
 * showed what it had before — the row was simply missing until the app was
 * restarted. Publishing, archiving and deleting had the same problem from the
 * detail screen.
 *
 * The first focus is skipped: the screen's own initial load is already in
 * flight then, and refreshing on top of it fires the same request twice on
 * every cold start.
 */
export function useRefreshOnFocus(refresh: () => void) {
  const seenFirstFocus = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!seenFirstFocus.current) {
        seenFirstFocus.current = true;
        return;
      }
      refresh();
    }, [refresh]),
  );
}
