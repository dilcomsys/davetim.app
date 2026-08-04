import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, Type, Trash2 } from 'lucide-react';
import type { TextField, Position } from '../../types/template';
import { getFontFamily } from '../../utils/fonts';

interface DraggableTextFieldProps {
  field: TextField;
  value: string;
  position: Position;
  isSelected: boolean;
  isEditing: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  onValueChange: (value: string) => void;
  onPositionChange: (position: Position) => void;
  onSelect: () => void;
  onDelete?: () => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  readOnly?: boolean;
}

export const DraggableTextField: React.FC<DraggableTextFieldProps> = ({
  field,
  value,
  position,
  isSelected,
  isEditing,
  containerRef,
  onValueChange,
  onPositionChange,
  onSelect,
  onDelete,
  onStartEdit,
  onEndEdit,
  readOnly = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);

  // Convert percentage position to pixels
  const getPixelPosition = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (position.x / 100) * rect.width,
      y: (position.y / 100) * rect.height
    };
  };

  // Convert pixel position to percentage
  const getPercentagePosition = (pixelX: number, pixelY: number): Position => {
    if (!containerRef.current) return position;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, (pixelX / rect.width) * 100)),
      y: Math.max(0, Math.min(100, (pixelY / rect.height) * 100))
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    onSelect();
    setIsDragging(true);
    
    const pixelPos = getPixelPosition();
    setDragStart({
      x: e.clientX - pixelPos.x,
      y: e.clientY - pixelPos.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newPixelX = e.clientX - rect.left - dragStart.x;
      const newPixelY = e.clientY - rect.top - dragStart.y;

      const newPosition = getPercentagePosition(newPixelX, newPixelY);
      onPositionChange(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, containerRef]);

  const handleDoubleClick = () => {
    if (readOnly) return;
    onStartEdit();
  };

  const handleBlur = () => {
    onEndEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !field.multiline) {
      e.preventDefault();
      onEndEdit();
    }
    if (e.key === 'Escape') {
      onEndEdit();
    }
  };

  const pixelPos = getPixelPosition();

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${pixelPos.x}px`,
    top: `${pixelPos.y}px`,
    fontSize: `${field.style.fontSize}px`,
    fontFamily: getFontFamily(field.style.fontFamily || 'Inter'),
    fontWeight: field.style.fontWeight || 'normal',
    fontStyle: field.style.fontStyle || 'normal',
    color: field.style.color,
    textAlign: field.style.textAlign,
    textTransform: field.style.textTransform || 'none',
    letterSpacing: field.style.letterSpacing ? `${field.style.letterSpacing}px` : 'normal',
    lineHeight: field.style.lineHeight || 1.5,
    cursor: readOnly ? 'default' : isDragging ? 'grabbing' : 'grab',
    userSelect: isEditing ? 'text' : 'none',
    whiteSpace: field.multiline ? 'pre-wrap' : 'nowrap',
    transform: 'translate(-50%, -50%)', // Center on position
    maxWidth: '80%',
    padding: isSelected ? '8px 12px' : '4px 8px',
    border: isSelected ? '2px solid #667eea' : '2px solid transparent',
    borderRadius: '4px',
    backgroundColor: isSelected ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    zIndex: isSelected ? 1000 : 1,
    outline: isEditing ? '2px solid #667eea' : 'none',
    minWidth: '50px'
  };

  return (
    <div
      ref={textRef}
      style={textStyle}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        e.stopPropagation();
        if (!isSelected) onSelect();
      }}
      className="group"
    >
      {/* Drag handle - only show when selected and not editing */}
      {isSelected && !isEditing && !readOnly && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-gray-800 text-white px-2 py-1 rounded-md text-xs shadow-lg">
          <GripVertical className="w-3 h-3" />
          <span className="font-medium">{field.label}</span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="ml-1 p-1 hover:bg-red-600 rounded transition-colors"
              title="Sil"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Text content */}
      {isEditing ? (
        field.multiline ? (
          <textarea
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={field.constraints?.maxLength}
            placeholder={field.placeholder || field.label}
            autoFocus
            className="w-full bg-transparent border-none outline-none resize-none"
            style={{
              fontSize: 'inherit',
              fontFamily: 'inherit',
              fontWeight: 'inherit',
              fontStyle: 'inherit',
              color: 'inherit',
              textAlign: 'inherit'
            }}
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={field.constraints?.maxLength}
            placeholder={field.placeholder || field.label}
            autoFocus
            className="w-full bg-transparent border-none outline-none"
            style={{
              fontSize: 'inherit',
              fontFamily: 'inherit',
              fontWeight: 'inherit',
              fontStyle: 'inherit',
              color: 'inherit',
              textAlign: 'inherit'
            }}
          />
        )
      ) : (
        <div className="whitespace-pre-wrap">
          {value || field.defaultValue || field.placeholder || field.label}
        </div>
      )}

      {/* Edit hint - show on hover when not editing */}
      {isSelected && !isEditing && !readOnly && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Çift tıkla düzenle
        </div>
      )}
    </div>
  );
};

