import { useState, useCallback, useRef } from 'react';

export interface UndoRedoState<T> {
  present: T;
  past: T[];
  future: T[];
}

export const useUndoRedo = <T,>(initialState: T, maxHistory: number = 50) => {
  const [state, setState] = useState<UndoRedoState<T>>({
    present: initialState,
    past: [],
    future: []
  });

  const isUndoingRef = useRef(false);

  const set = useCallback((newState: T) => {
    // Don't add to history if we're undoing/redoing
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }

    setState((prev) => {
      // Don't add if state hasn't changed
      if (JSON.stringify(prev.present) === JSON.stringify(newState)) {
        return prev;
      }

      return {
        present: newState,
        past: [...prev.past.slice(-maxHistory + 1), prev.present],
        future: []
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);

      isUndoingRef.current = true;

      return {
        present: previous,
        past: newPast,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      isUndoingRef.current = true;

      return {
        present: next,
        past: [...prev.past, prev.present],
        future: newFuture
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setState({
      present: newState,
      past: [],
      future: []
    });
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    reset
  };
};

