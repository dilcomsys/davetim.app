import { useState, useCallback, useRef } from 'react';

interface HistoryOptions<T> {
  maxHistorySize?: number;
  onUndo?: (state: T) => void;
  onRedo?: (state: T) => void;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(
  initialState: T,
  options: HistoryOptions<T> = {}
) {
  const { maxHistorySize = 50, onUndo, onRedo } = options;

  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  // Debounce timer to prevent too many history entries
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingState = useRef<T | null>(null);

  const set = useCallback(
    (newState: T, debounceMs: number = 0) => {
      if (debounceMs > 0) {
        // Store pending state
        pendingState.current = newState;

        // Clear existing timer
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        // Set new timer
        debounceTimer.current = setTimeout(() => {
          if (pendingState.current) {
            setHistory((current) => {
              const newPast = [...current.past, current.present].slice(-maxHistorySize);
              return {
                past: newPast,
                present: pendingState.current as T,
                future: [] // Clear future when new state is set
              };
            });
            pendingState.current = null;
          }
        }, debounceMs);
      } else {
        // Immediate update
        setHistory((current) => {
          const newPast = [...current.past, current.present].slice(-maxHistorySize);
          return {
            past: newPast,
            present: newState,
            future: [] // Clear future when new state is set
          };
        });
      }
    },
    [maxHistorySize]
  );

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) return current;

      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, current.past.length - 1);

      if (onUndo) {
        onUndo(previous);
      }

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future]
      };
    });
  }, [onUndo]);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) return current;

      const next = current.future[0];
      const newFuture = current.future.slice(1);

      if (onRedo) {
        onRedo(next);
      }

      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture
      };
    });
  }, [onRedo]);

  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: []
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo
  };
}



