import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Trash2, Copy, Lock, Unlock } from 'lucide-react';

interface DraggableElementProps {
  id: string;
  type: 'text' | 'decoration';
  content?: string | React.ReactNode;
  imageUrl?: string;
  imageFit?: 'contain' | 'cover';
  position: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  opacity?: number;
  style?: React.CSSProperties;
  resizeMode?: 'both' | 'horizontal' | 'vertical';
  zIndex?: number;
  isSelected?: boolean;
  locked?: boolean;
  onSelect?: (id: string) => void;
  onUpdate: (updates: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    rotation?: number;
    opacity?: number;
    content?: string;
  }) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleLock?: () => void;
  onChangeZ?: (action: 'front' | 'back') => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const DraggableElement: React.FC<DraggableElementProps> = ({
  id,
  type,
  content,
  imageUrl,
  imageFit = 'contain',
  position,
  size = { width: 100, height: 100 },
  rotation = 0,
  opacity = 1,
  style = {},
  resizeMode = 'both',
  zIndex = 100,
  isSelected: controlledSelected = false,
  locked = false,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleLock,
  onChangeZ,
  containerRef
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const elementRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const rotateStartAngle = useRef(0);
  const centerRef = useRef({ x: 0, y: 0 });
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.control-button')) return;
    if (locked) return;
    if (isEditing) return;

    // Double-click detection for text elements
    if (type === 'text' && clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      handleDoubleClick();
      e.preventDefault();
      return;
    }

    clickTimeout.current = setTimeout(() => {
      clickTimeout.current = null;
    }, 300);

    setIsDragging(true);
    setIsSelected(true);
    if (onSelect) {
      onSelect(id);
    }
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.control-button')) return;
    if (locked) return;
    if (isEditing) return;

    // Prevent default to stop scrolling while dragging
    // e.preventDefault(); // Sometimes problematic with input focus

    const touch = e.touches[0];

    // Double-tap detection logic could be added here similar to clickTimeout
    
    setIsDragging(true);
    setIsSelected(true);
    if (onSelect) {
      onSelect(id);
    }
    dragStartPos.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
  };

  const handleDoubleClick = () => {
    if (type !== 'text' || locked) return;
    setIsEditing(true);
    setEditingContent(typeof content === 'string' ? content : '');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleFinishEditing = () => {
    setIsEditing(false);
    if (editingContent !== content) {
      onUpdate({ content: editingContent });
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (locked) return;
    e.stopPropagation();
    setIsResizing(true);
    setIsSelected(true);
    resizeStartSize.current = { ...size };
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    if (locked) return;
    e.stopPropagation();
    const touch = e.touches[0];
    setIsResizing(true);
    setIsSelected(true);
    resizeStartSize.current = { ...size };
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    if (locked) return;
    if (!containerRef.current || !elementRef.current) return;
    e.stopPropagation();
    setIsRotating(true);
    setIsSelected(true);
    
    const elementRect = elementRef.current.getBoundingClientRect();
    
    // Calculate center of element in screen coordinates
    centerRef.current = {
      x: elementRect.left + elementRect.width / 2,
      y: elementRect.top + elementRect.height / 2
    };
    
    // Calculate initial angle
    const angle = Math.atan2(
      e.clientY - centerRef.current.y,
      e.clientX - centerRef.current.x
    );
    rotateStartAngle.current = (angle * 180 / Math.PI) - rotation;
  };

  const handleRotateTouchStart = (e: React.TouchEvent) => {
    if (locked) return;
    if (!containerRef.current || !elementRef.current) return;
    e.stopPropagation();
    const touch = e.touches[0];
    setIsRotating(true);
    setIsSelected(true);
    
    const elementRect = elementRef.current.getBoundingClientRect();
    
    centerRef.current = {
      x: elementRect.left + elementRect.width / 2,
      y: elementRect.top + elementRect.height / 2
    };
    
    const angle = Math.atan2(
      touch.clientY - centerRef.current.y,
      touch.clientX - centerRef.current.x
    );
    rotateStartAngle.current = (angle * 180 / Math.PI) - rotation;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      if (isDragging) {
        // Calculate new position relative to container
        const newX = e.clientX;
        const newY = e.clientY;

        // Convert to percentage relative to container
        const xPercent = ((newX - containerRect.left) / containerRect.width) * 100;
        const yPercent = ((newY - containerRect.top) / containerRect.height) * 100;

        onUpdate({
          position: {
            x: Math.max(5, Math.min(95, xPercent)),
            y: Math.max(5, Math.min(95, yPercent))
          }
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;
        
        if (resizeMode === 'horizontal') {
          // Horizontal only (dividers)
          onUpdate({
            size: {
              width: Math.max(30, resizeStartSize.current.width + deltaX),
              height: resizeStartSize.current.height
            }
          });
        } else if (resizeMode === 'vertical') {
          // Vertical only
          onUpdate({
            size: {
              width: resizeStartSize.current.width,
              height: Math.max(30, resizeStartSize.current.height + deltaY)
            }
          });
        } else {
          // Both (independent width/height)
          onUpdate({
            size: {
              width: Math.max(30, resizeStartSize.current.width + deltaX),
              height: Math.max(30, resizeStartSize.current.height + deltaY)
            }
          });
        }
      } else if (isRotating) {
        // Calculate angle from center to current mouse position
        const angle = Math.atan2(
          e.clientY - centerRef.current.y,
          e.clientX - centerRef.current.x
        );
        const degrees = angle * 180 / Math.PI;
        const newRotation = (degrees - rotateStartAngle.current + 360) % 360;

        onUpdate({
          rotation: Math.round(newRotation)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    // Touch Event Handlers for Document
    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      if (e.cancelable) e.preventDefault(); // Prevent scrolling

      const touch = e.touches[0];
      const containerRect = containerRef.current.getBoundingClientRect();

      if (isDragging) {
        const newX = touch.clientX;
        const newY = touch.clientY;
        const xPercent = ((newX - containerRect.left) / containerRect.width) * 100;
        const yPercent = ((newY - containerRect.top) / containerRect.height) * 100;

        onUpdate({
          position: {
            x: Math.max(5, Math.min(95, xPercent)),
            y: Math.max(5, Math.min(95, yPercent))
          }
        });
      } else if (isResizing) {
        const deltaX = touch.clientX - dragStartPos.current.x;
        const deltaY = touch.clientY - dragStartPos.current.y;
        
        if (resizeMode === 'horizontal') {
          onUpdate({
            size: {
              width: Math.max(30, resizeStartSize.current.width + deltaX),
              height: resizeStartSize.current.height
            }
          });
        } else if (resizeMode === 'vertical') {
          onUpdate({
            size: {
              width: resizeStartSize.current.width,
              height: Math.max(30, resizeStartSize.current.height + deltaY)
            }
          });
        } else {
          onUpdate({
            size: {
              width: Math.max(30, resizeStartSize.current.width + deltaX),
              height: Math.max(30, resizeStartSize.current.height + deltaY)
            }
          });
        }
      } else if (isRotating) {
        const angle = Math.atan2(
          touch.clientY - centerRef.current.y,
          touch.clientX - centerRef.current.x
        );
        const degrees = angle * 180 / Math.PI;
        const newRotation = (degrees - rotateStartAngle.current + 360) % 360;

        onUpdate({
          rotation: Math.round(newRotation)
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Add touch listeners with passive: false to allow preventDefault
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, isResizing, isRotating, onUpdate, containerRef, resizeMode]); // Added resizeMode dependency

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (elementRef.current && !elementRef.current.contains(e.target as Node)) {
        // Only deselect if not clicking on toolbar buttons
        if (!(e.target as HTMLElement).closest('.control-button')) {
           setIsSelected(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // Add touch listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Sync internal selection with controlled prop (for toolbar-based selection)
  useEffect(() => {
    if (controlledSelected !== undefined) {
      setIsSelected(controlledSelected);
    }
  }, [controlledSelected]);

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${size.width}px`,
        height: type === 'text' ? 'auto' : `${size.height}px`,
        minHeight: type === 'text' ? `${size.height}px` : undefined,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        opacity,
        cursor: locked ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
        zIndex: (zIndex || 100),
        userSelect: 'none',
        pointerEvents: 'auto',
        transition: isDragging || isResizing || isRotating ? 'none' : 'all 0.1s ease'
      }}
      className={`draggable-element ${isSelected ? 'selected' : ''} ${locked ? 'locked' : ''}`}
    >
      {/* Content (apply visual styles here to avoid clipping controls) */}
      <div className="element-content w-full h-full" style={style}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Decorative element" 
            className="w-full h-full pointer-events-none"
            style={{ objectFit: imageFit }}
            draggable={false}
            crossOrigin="anonymous"
          />
        ) : isEditing && type === 'text' ? (
          <textarea
            ref={inputRef}
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleFinishEditing();
              }
              if (e.key === 'Escape') {
                setEditingContent(typeof content === 'string' ? content : '');
                setIsEditing(false);
              }
            }}
            className="w-full h-full resize-none bg-white/90 border-2 border-primary-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{
              fontSize: style.fontSize || '16px',
              fontFamily: style.fontFamily,
              fontWeight: style.fontWeight,
              textAlign: style.textAlign,
              color: '#000000'
            }}
          />
        ) : (
          content
        )}
      </div>

      {/* Controls (only when selected) */}
      {isSelected && (
        <>
          {/* Selection Border */}
          <div
            style={{
              position: 'absolute',
              inset: -2,
              border: locked ? '2px solid #ef4444' : '2px dashed #667eea',
              borderRadius: '4px',
              pointerEvents: 'none',
              background: locked ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
            }}
          />

          {/* Control Buttons Toolbar */}
          <div
            className="control-buttons"
            style={{
              position: 'absolute',
              top: -48,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '2px',
              background: 'rgba(0, 0, 0, 0.9)',
              padding: '4px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 1001,
              backdropFilter: 'blur(8px)'
            }}
          >
            {/* Lock/Unlock */}
            {onToggleLock && (
              <button
                onMouseDown={(e) => { e.stopPropagation(); onToggleLock(); }}
                className="control-button"
                style={{
                  padding: '6px',
                  background: locked ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: locked ? '#fca5a5' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                title={locked ? 'Kilidi Aç' : 'Kilitle'}
              >
                {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>
            )}

            {!locked && (
              <>
                {/* Duplicate */}
                {onDuplicate && (
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); onDuplicate(); }}
                    className="control-button"
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Çoğalt (Ctrl+D)"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}

                {/* Send Back */}
                {onChangeZ && (
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); onChangeZ('back'); }}
                    className="control-button"
                    style={{
                      padding: '6px 8px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#9ca3af',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                    title="Arkaya Gönder"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    ↓
                  </button>
                )}

                {/* Bring Front */}
                {onChangeZ && (
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); onChangeZ('front'); }}
                    className="control-button"
                    style={{
                      padding: '6px 8px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#9ca3af',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                    title="Öne Getir"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    ↑
                  </button>
                )}

                {/* Delete */}
                {onDelete && (
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); onDelete(); }}
                    className="control-button"
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Sil (Del)"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>

          {!locked && (
            <>
              {/* Resize Handle (bottom-right corner) */}
              <div
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeTouchStart}
                style={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  width: 14,
                  height: 14,
                  background: '#667eea',
                  border: '2px solid white',
                  borderRadius: '50%',
                  cursor: 'nwse-resize',
                  zIndex: 1001,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />

              {/* Rotation Handle (top-center) */}
              <div
                onMouseDown={handleRotateStart}
                onTouchStart={handleRotateTouchStart}
                style={{
                  position: 'absolute',
                  top: -24,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 20,
                  background: '#10b981',
                  border: '2px solid white',
                  borderRadius: '50%',
                  cursor: 'grab',
                  zIndex: 1001,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                title="Döndür"
              >
                <RotateCw className="h-3 w-3 text-white" />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};