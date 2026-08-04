import { useReducer } from 'react';

type History<T> = { past: T[]; present: T; future: T[] };
type Action<T> =
  | { type: 'change'; value: T }
  | { type: 'undo' }
  | { type: 'redo' };

function reducer<T>(state: History<T>, action: Action<T>): History<T> {
  if (action.type === 'change') {
    return { past: [...state.past.slice(-29), state.present], present: action.value, future: [] };
  }

  if (action.type === 'undo') {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] };
  }

  const next = state.future[0];
  if (!next) return state;
  return { past: [...state.past, state.present], present: next, future: state.future.slice(1) };
}

export function useEditorHistory<T>(initialValue: T) {
  const [history, dispatch] = useReducer(reducer<T>, { past: [], present: initialValue, future: [] });
  return {
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    document: history.present,
    redo: () => dispatch({ type: 'redo' }),
    setDocument: (value: T) => dispatch({ type: 'change', value }),
    undo: () => dispatch({ type: 'undo' }),
  };
}
