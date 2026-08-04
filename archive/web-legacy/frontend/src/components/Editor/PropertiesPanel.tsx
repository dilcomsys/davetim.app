import React from 'react';
import { 
  Type, Palette, Image, Layers, Settings, 
  AlignLeft, AlignCenter, AlignRight, 
  Bold, Italic, Underline, RotateCw, Trash2
} from 'lucide-react';
import { ALL_FONTS, type FontFamily, getFontFamily } from '../../utils/fonts';

export interface ElementProperties {
  id: string;
  type: 'text' | 'image' | 'decoration' | 'divider';
  content?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  style?: {
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontStyle?: string;
    textDecoration?: string;
  };
}

interface PropertiesPanelProps {
  selectedElement: ElementProperties | null;
  onUpdate: (updates: Partial<ElementProperties>) => void;
  onDelete: () => void;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdate,
  onDelete,
  colors
}) => {
  if (!selectedElement) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-8 text-center">
        <Settings className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-sm text-gray-600 font-medium">Öğe Seçilmedi</p>
        <p className="text-xs text-gray-400 mt-2">
          Tuvalde bir öğeye tıklayın
        </p>
      </div>
    );
  }

  const isText = selectedElement.type === 'text';
  const isDivider = selectedElement.type === 'divider';

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Özellikler</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {selectedElement.type === 'text' && '📝 Metin'}
            {selectedElement.type === 'image' && '🖼️ Görsel'}
            {selectedElement.type === 'decoration' && '✨ Dekorasyon'}
            {selectedElement.type === 'divider' && '➖ Çizgi'}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
          title="Sil (Del)"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Properties */}
      <div className="flex-1 p-4 space-y-4">
        {/* Text Content (for text elements) */}
        {isText && !isDivider && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              <Type className="h-3 w-3 inline mr-1" />
              Metin İçeriği
            </label>
            <textarea
              value={selectedElement.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none text-sm"
              rows={3}
              placeholder="Metin girin..."
            />
          </div>
        )}

        {/* Font (for text elements) */}
        {isText && !isDivider && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Yazı Tipi
            </label>
            <select
              value={selectedElement.style?.fontFamily || 'Playfair Display'}
              onChange={(e) => onUpdate({ 
                style: { 
                  ...selectedElement.style, 
                  fontFamily: e.target.value 
                } 
              })}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              style={{ fontFamily: getFontFamily(selectedElement.style?.fontFamily as FontFamily || 'Playfair Display') }}
            >
              {ALL_FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: getFontFamily(font) }}>
                  {font}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Font Size (for text elements) */}
        {isText && !isDivider && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Boyut: <span className="text-primary-600">{selectedElement.style?.fontSize || 16}px</span>
            </label>
            <input
              type="range"
              min={8}
              max={72}
              value={selectedElement.style?.fontSize || 16}
              onChange={(e) => onUpdate({ 
                style: { 
                  ...selectedElement.style, 
                  fontSize: Number(e.target.value) 
                } 
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>8px</span>
              <span>72px</span>
            </div>
          </div>
        )}

        {/* Text Align (for text elements) */}
        {isText && !isDivider && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Hizalama
            </label>
            <div className="flex gap-2">
              {[
                { value: 'left', icon: AlignLeft, label: 'Sol' },
                { value: 'center', icon: AlignCenter, label: 'Orta' },
                { value: 'right', icon: AlignRight, label: 'Sağ' }
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => onUpdate({ 
                    style: { 
                      ...selectedElement.style, 
                      textAlign: value as 'left' | 'center' | 'right' 
                    } 
                  })}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                    selectedElement.style?.textAlign === value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                  title={label}
                >
                  <Icon className="h-4 w-4 mx-auto" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Style (for text elements) */}
        {isText && !isDivider && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Stil
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({ 
                  style: { 
                    ...selectedElement.style, 
                    fontWeight: selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold'
                  } 
                })}
                className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                  selectedElement.style?.fontWeight === 'bold'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                title="Kalın (Ctrl+B)"
              >
                <Bold className="h-4 w-4 mx-auto" />
              </button>
              <button
                onClick={() => onUpdate({ 
                  style: { 
                    ...selectedElement.style, 
                    fontStyle: selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic'
                  } 
                })}
                className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                  selectedElement.style?.fontStyle === 'italic'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                title="İtalik (Ctrl+I)"
              >
                <Italic className="h-4 w-4 mx-auto" />
              </button>
              <button
                onClick={() => onUpdate({ 
                  style: { 
                    ...selectedElement.style, 
                    textDecoration: selectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline'
                  } 
                })}
                className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                  selectedElement.style?.textDecoration === 'underline'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
                title="Altı Çizili (Ctrl+U)"
              >
                <Underline className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        )}

        {/* Color (for text elements) */}
        {isText && !isDivider && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              <Palette className="h-3 w-3 inline mr-1" />
              Renk
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedElement.style?.color || colors.text}
                onChange={(e) => onUpdate({ 
                  style: { 
                    ...selectedElement.style, 
                    color: e.target.value 
                  } 
                })}
                className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <div className="flex-1 grid grid-cols-5 gap-1">
                {[colors.primary, colors.secondary, colors.text, colors.accent, '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    onClick={() => onUpdate({ 
                      style: { 
                        ...selectedElement.style, 
                        color 
                      } 
                    })}
                    className={`w-full aspect-square rounded-lg border-2 transition-all ${
                      selectedElement.style?.color === color
                        ? 'border-primary-500 scale-110'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Position */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            Konum (%)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">X</label>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(selectedElement.position.x)}
                onChange={(e) => onUpdate({ 
                  position: { 
                    ...selectedElement.position, 
                    x: Number(e.target.value) 
                  } 
                })}
                className="w-full px-2 py-1 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Y</label>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(selectedElement.position.y)}
                onChange={(e) => onUpdate({ 
                  position: { 
                    ...selectedElement.position, 
                    y: Number(e.target.value) 
                  } 
                })}
                className="w-full px-2 py-1 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            Boyut (px)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">Genişlik</label>
              <input
                type="number"
                min={10}
                max={800}
                value={Math.round(selectedElement.size.width)}
                onChange={(e) => onUpdate({ 
                  size: { 
                    ...selectedElement.size, 
                    width: Number(e.target.value) 
                  } 
                })}
                className="w-full px-2 py-1 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Yükseklik</label>
              <input
                type="number"
                min={10}
                max={800}
                value={Math.round(selectedElement.size.height)}
                onChange={(e) => onUpdate({ 
                  size: { 
                    ...selectedElement.size, 
                    height: Number(e.target.value) 
                  } 
                })}
                className="w-full px-2 py-1 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            <RotateCw className="h-3 w-3 inline mr-1" />
            Döndürme: <span className="text-primary-600">{selectedElement.rotation}°</span>
          </label>
          <input
            type="range"
            min={0}
            max={360}
            value={selectedElement.rotation}
            onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0°</span>
            <span>360°</span>
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            <Layers className="h-3 w-3 inline mr-1" />
            Opaklık: <span className="text-primary-600">{Math.round(selectedElement.opacity * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={selectedElement.opacity * 100}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) / 100 })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

