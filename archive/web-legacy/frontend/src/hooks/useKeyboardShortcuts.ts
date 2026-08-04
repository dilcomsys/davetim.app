import { useEffect } from 'react';

export interface KeyboardShortcuts {
  onSave?: () => void;
  onPreview?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSelectAll?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onToggleGrid?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Prevent default for our shortcuts
      const shouldPreventDefault = 
        (ctrlKey && ['s', 'p', 'e', 'z', 'y', 'd', 'a', 'b', 'i', 'u'].includes(e.key.toLowerCase())) ||
        e.key === 'Delete' ||
        e.key === 'Backspace' ||
        (e.key && e.key.startsWith('Arrow'));

      if (shouldPreventDefault) {
        // Check if user is typing in an input/textarea
        const target = e.target as HTMLElement;
        const isEditing = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable;

        // Allow delete/backspace in inputs
        if ((e.key === 'Delete' || e.key === 'Backspace') && isEditing) {
          return;
        }

        // Don't prevent arrow keys in inputs
        if (e.key && e.key.startsWith('Arrow') && isEditing) {
          return;
        }
      }

      // Ctrl/Cmd + S: Save
      if (ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        shortcuts.onSave?.();
      }

      // Ctrl/Cmd + P: Preview
      if (ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        shortcuts.onPreview?.();
      }

      // Ctrl/Cmd + E: Export
      if (ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        shortcuts.onExport?.();
      }

      // Ctrl/Cmd + Z: Undo
      if (ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        shortcuts.onUndo?.();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if ((ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') || 
          (ctrlKey && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        shortcuts.onRedo?.();
      }

      // Delete or Backspace: Delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        const isEditing = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable;
        
        if (!isEditing) {
          e.preventDefault();
          shortcuts.onDelete?.();
        }
      }

      // Ctrl/Cmd + D: Duplicate
      if (ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        shortcuts.onDuplicate?.();
      }

      // Ctrl/Cmd + A: Select All
      if (ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        shortcuts.onSelectAll?.();
      }

      // Ctrl/Cmd + Plus: Zoom In
      if (ctrlKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        shortcuts.onZoomIn?.();
      }

      // Ctrl/Cmd + Minus: Zoom Out
      if (ctrlKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        shortcuts.onZoomOut?.();
      }

      // Ctrl/Cmd + 0: Reset Zoom
      if (ctrlKey && e.key === '0') {
        e.preventDefault();
        shortcuts.onZoomReset?.();
      }

      // G: Toggle Grid
      if (e.key && e.key.toLowerCase() === 'g' && !ctrlKey && !e.shiftKey && !e.altKey) {
        const target = e.target as HTMLElement;
        const isEditing = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable;
        
        if (!isEditing) {
          e.preventDefault();
          shortcuts.onToggleGrid?.();
        }
      }

      // Arrow Keys: Move selected element
      if (e.key && e.key.startsWith('Arrow')) {
        const target = e.target as HTMLElement;
        const isEditing = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable;
        
        if (!isEditing) {
          e.preventDefault();
          
          switch (e.key) {
            case 'ArrowUp':
              shortcuts.onMoveUp?.();
              break;
            case 'ArrowDown':
              shortcuts.onMoveDown?.();
              break;
            case 'ArrowLeft':
              shortcuts.onMoveLeft?.();
              break;
            case 'ArrowRight':
              shortcuts.onMoveRight?.();
              break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

