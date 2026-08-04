import { useState, useCallback, useRef } from 'react';

interface EditorState {
  textElements: any[];
  decorativeElements: any[];
  textFields: any[];
  colors: any;
  formData: any;
  imageLayers: any;
  imageTransforms: any;
}

interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

export function useEditorHistory(initialState: EditorState) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialState,
    future: []
  });

  const maxHistorySize = 50;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedState = useRef<string>(JSON.stringify(initialState));

  // Push new state to history
  const pushState = useCallback((newState: EditorState, debounceMs: number = 300) => {
    // Check if state actually changed
    const newStateStr = JSON.stringify(newState);
    if (newStateStr === lastSavedState.current) {
      return;
    }

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the state push
    debounceTimer.current = setTimeout(() => {
      setHistory((current) => {
        const newPast = [...current.past, current.present].slice(-maxHistorySize);
        lastSavedState.current = newStateStr;
        
        return {
          past: newPast,
          present: newState,
          future: [] // Clear future when new state is pushed
        };
      });
    }, debounceMs);
  }, []);

  // Undo
  const undo = useCallback(() => {
    if (history.past.length === 0) {
      return null;
    }

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future]
    });

    lastSavedState.current = JSON.stringify(previous);
    return previous;
  }, [history]);

  // Redo
  const redo = useCallback(() => {
    if (history.future.length === 0) {
      return null;
    }

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture
    });

    lastSavedState.current = JSON.stringify(next);
    return next;
  }, [history]);

  // Reset history
  const reset = useCallback((newState: EditorState) => {
    setHistory({
      past: [],
      present: newState,
      future: []
    });
    lastSavedState.current = JSON.stringify(newState);
  }, []);

  return {
    state: history.present,
    pushState,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    historySize: history.past.length
  };
}



