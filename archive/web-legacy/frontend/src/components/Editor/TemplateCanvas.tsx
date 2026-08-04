import React, { useRef, useState } from 'react';
import { DraggableTextField } from './DraggableTextField';
import type { TextField, DecorativeElement, ColorPalette, Position } from '../../types/template';

interface TemplateCanvasProps {
  backgroundImage?: string;
  colorPalette: ColorPalette;
  textFields: TextField[];
  textValues: Record<string, string>;
  textPositions: Record<string, Position>;
  decorativeElements: DecorativeElement[];
  selectedTextFieldId: string | null;
  selectedElementId: string | null;
  editingTextFieldId: string | null;
  onTextValueChange: (fieldId: string, value: string) => void;
  onTextPositionChange: (fieldId: string, position: Position) => void;
  onTextFieldSelect: (fieldId: string | null) => void;
  onElementSelect: (elementId: string | null) => void;
  onStartEditTextField: (fieldId: string) => void;
  onEndEditTextField: () => void;
  readOnly?: boolean;
  aspectRatio?: number; // width / height
}

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({
  backgroundImage,
  colorPalette,
  textFields,
  textValues,
  textPositions,
  decorativeElements,
  selectedTextFieldId,
  selectedElementId,
  editingTextFieldId,
  onTextValueChange,
  onTextPositionChange,
  onTextFieldSelect,
  onElementSelect,
  onStartEditTextField,
  onEndEditTextField,
  readOnly = false,
  aspectRatio = 16 / 9 // Default landscape
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on canvas, not on children
    if (e.target === e.currentTarget) {
      onTextFieldSelect(null);
      onElementSelect(null);
    }
  };

  return (
    <div className="w-full">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200"
        style={{
          paddingBottom: `${(1 / aspectRatio) * 100}%`,
          backgroundColor: colorPalette.background || '#ffffff'
        }}
        onClick={handleCanvasClick}
      >
        {/* Absolute positioned content */}
        <div className="absolute inset-0">
          {/* Background Image */}
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                opacity: 0.3
              }}
            />
          )}

          {/* Decorative Elements Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {decorativeElements.map((element) => {
              const pixelX = (element.position.x / 100) * (containerRef.current?.clientWidth || 0);
              const pixelY = (element.position.y / 100) * (containerRef.current?.clientHeight || 0);

              return (
                <div
                  key={element.id}
                  className={`absolute ${readOnly ? '' : 'pointer-events-auto cursor-pointer'}`}
                  style={{
                    left: `${pixelX}px`,
                    top: `${pixelY}px`,
                    width: `${element.size.width}px`,
                    height: `${element.size.height}px`,
                    transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
                    opacity: element.opacity || 1,
                    zIndex: element.zIndex || 1,
                    color: element.color || '#000',
                    border: selectedElementId === element.id ? '2px solid #667eea' : 'none',
                    borderRadius: '4px',
                    padding: selectedElementId === element.id ? '4px' : '0'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly) onElementSelect(element.id);
                  }}
                  dangerouslySetInnerHTML={{ __html: element.svgPath || '' }}
                />
              );
            })}
          </div>

          {/* Text Fields Layer */}
          <div className="absolute inset-0">
            {textFields.map((field) => (
              <DraggableTextField
                key={field.id}
                field={field}
                value={textValues[field.id] || field.defaultValue || ''}
                position={textPositions[field.id] || field.position}
                isSelected={selectedTextFieldId === field.id}
                isEditing={editingTextFieldId === field.id}
                containerRef={containerRef}
                onValueChange={(value) => onTextValueChange(field.id, value)}
                onPositionChange={(position) => onTextPositionChange(field.id, position)}
                onSelect={() => onTextFieldSelect(field.id)}
                onStartEdit={() => onStartEditTextField(field.id)}
                onEndEdit={onEndEditTextField}
                readOnly={readOnly}
              />
            ))}
          </div>

          {/* Grid Overlay (only when editing) */}
          {!readOnly && (selectedTextFieldId || selectedElementId) && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full opacity-20">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="gray" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Info */}
      {!readOnly && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {selectedTextFieldId && (
            <span>
              ✏️ Yazı alanı seçili - Çift tıkla düzenle, sürükle taşı
            </span>
          )}
          {selectedElementId && (
            <span>
              ✨ Süsleme öğesi seçili - Sağ panelden düzenle
            </span>
          )}
          {!selectedTextFieldId && !selectedElementId && (
            <span>
              💡 Yazı veya süsleme öğesine tıklayarak düzenleyebilirsiniz
            </span>
          )}
        </div>
      )}
    </div>
  );
};

