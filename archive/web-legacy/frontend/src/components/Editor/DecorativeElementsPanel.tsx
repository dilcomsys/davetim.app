import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Move, Palette, Eye, EyeOff } from 'lucide-react';
import type { DecorativeElement } from '../../types/template';
import { DECORATIVE_ELEMENTS } from '../../utils/decorativeElements';

interface DecorativeElementsPanelProps {
  elements: DecorativeElement[];
  selectedElementId: string | null;
  onElementAdd: (element: Omit<DecorativeElement, 'id'>) => void;
  onElementUpdate: (id: string, updates: Partial<DecorativeElement>) => void;
  onElementDelete: (id: string) => void;
  onElementSelect: (id: string | null) => void;
}

export const DecorativeElementsPanel: React.FC<DecorativeElementsPanelProps> = ({
  elements,
  selectedElementId,
  onElementAdd,
  onElementUpdate,
  onElementDelete,
  onElementSelect
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(Object.values(DECORATIVE_ELEMENTS).map(e => e.category)))];

  const filteredElements = selectedCategory === 'all'
    ? Object.entries(DECORATIVE_ELEMENTS)
    : Object.entries(DECORATIVE_ELEMENTS).filter(([_, el]) => el.category === selectedCategory);

  const handleAddElement = (key: string) => {
    const element = DECORATIVE_ELEMENTS[key];
    if (!element) return;

    const newElement: Omit<DecorativeElement, 'id'> = {
      type: element.type,
      position: { x: 50, y: 50 }, // Center
      size: element.defaultSize,
      color: element.defaultColor,
      opacity: 0.8,
      rotation: 0,
      zIndex: elements.length + 1,
      svgPath: element.svgPath
    };

    onElementAdd(newElement);
    setIsLibraryOpen(false);
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          Süsleme Öğeleri
        </h3>
        <button
          onClick={() => setIsLibraryOpen(!isLibraryOpen)}
          className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Ekle
        </button>
      </div>

      {/* Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Süsleme Kütüphanesi</h3>
                <button
                  onClick={() => setIsLibraryOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                      ${selectedCategory === cat
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {cat === 'all' ? 'Tümü' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Elements Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                {filteredElements.map(([key, element]) => (
                  <button
                    key={key}
                    onClick={() => handleAddElement(key)}
                    className="aspect-square border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center justify-center group"
                    title={key}
                  >
                    <div
                      className="w-12 h-12 transition-transform group-hover:scale-110"
                      style={{ color: element.defaultColor }}
                      dangerouslySetInnerHTML={{ __html: element.svgPath }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elements List */}
      {elements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz süsleme öğesi eklenmedi</p>
          <p className="text-xs mt-1">Davetiyenizi süslemek için "Ekle" butonuna tıklayın</p>
        </div>
      ) : (
        <div className="space-y-2">
          {elements.map((element, index) => (
            <div
              key={element.id}
              onClick={() => onElementSelect(element.id)}
              className={`
                p-3 rounded-lg border-2 cursor-pointer transition-all
                ${selectedElementId === element.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Preview */}
                <div
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center"
                  style={{ color: element.color || '#000' }}
                  dangerouslySetInnerHTML={{ 
                    __html: element.svgPath || DECORATIVE_ELEMENTS[element.type]?.svgPath || '' 
                  }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {element.type.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {element.size.width}x{element.size.height}px
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onElementDelete(element.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Element Editor */}
      {selectedElement && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <h4 className="font-medium text-gray-900 text-sm">Öğe Ayarları</h4>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Renk</label>
            <input
              type="color"
              value={selectedElement.color || '#000000'}
              onChange={(e) => onElementUpdate(selectedElement.id, { color: e.target.value })}
              className="w-full h-10 rounded border border-gray-300 cursor-pointer"
            />
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Opaklık: {Math.round((selectedElement.opacity || 1) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={(selectedElement.opacity || 1) * 100}
              onChange={(e) => onElementUpdate(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
              className="w-full"
            />
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Döndürme: {selectedElement.rotation || 0}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={selectedElement.rotation || 0}
              onChange={(e) => onElementUpdate(selectedElement.id, { rotation: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Genişlik</label>
              <input
                type="number"
                value={selectedElement.size.width}
                onChange={(e) => onElementUpdate(selectedElement.id, {
                  size: { ...selectedElement.size, width: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                min="10"
                max="200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Yükseklik</label>
              <input
                type="number"
                value={selectedElement.size.height}
                onChange={(e) => onElementUpdate(selectedElement.id, {
                  size: { ...selectedElement.size, height: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                min="10"
                max="200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

