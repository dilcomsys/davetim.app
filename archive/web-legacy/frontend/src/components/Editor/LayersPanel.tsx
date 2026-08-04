import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react';

export interface Layer {
  id: string;
  type: 'text' | 'image' | 'decoration' | 'divider';
  name: string;
  visible: boolean;
  locked?: boolean;
  zIndex: number;
}

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onReorderLayer: (id: string, direction: 'up' | 'down') => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onDuplicateLayer,
  onReorderLayer
}) => {
  // Sort by zIndex descending (top to bottom)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'decoration': return '✨';
      case 'divider': return '➖';
      default: return '📄';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">Katmanlar</h3>
        <p className="text-xs text-gray-500 mt-0.5">{layers.length} öğe</p>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {sortedLayers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-sm">Henüz öğe yok</p>
            <p className="text-xs mt-1">Sol araç çubuğundan ekleyin</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedLayers.map((layer, index) => {
              const isSelected = selectedLayerId === layer.id;
              const isFirst = index === 0;
              const isLast = index === sortedLayers.length - 1;

              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`
                    group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'bg-primary-50 border-2 border-primary-500' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }
                  `}
                >
                  {/* Icon */}
                  <div className="text-lg flex-shrink-0">
                    {getLayerIcon(layer.type)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {layer.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {layer.type}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Visibility */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(layer.id);
                      }}
                      className="p-1 rounded hover:bg-white/50 transition-colors"
                      title={layer.visible ? 'Gizle' : 'Göster'}
                    >
                      {layer.visible ? (
                        <Eye className="h-4 w-4 text-gray-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {/* Lock */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock(layer.id);
                      }}
                      className="p-1 rounded hover:bg-white/50 transition-colors"
                      title={layer.locked ? 'Kilidi Aç' : 'Kilitle'}
                    >
                      {layer.locked ? (
                        <Lock className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Unlock className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                      )}
                    </button>

                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderLayer(layer.id, 'up');
                        }}
                        disabled={isFirst}
                        className="p-0.5 rounded hover:bg-white/50 transition-colors disabled:opacity-30"
                        title="Öne Al"
                      >
                        <ChevronUp className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderLayer(layer.id, 'down');
                        }}
                        disabled={isLast}
                        className="p-0.5 rounded hover:bg-white/50 transition-colors disabled:opacity-30"
                        title="Arkaya Al"
                      >
                        <ChevronDown className="h-3 w-3 text-gray-600" />
                      </button>
                    </div>

                    {/* Duplicate */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateLayer(layer.id);
                      }}
                      className="p-1 rounded hover:bg-white/50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Çoğalt (Ctrl+D)"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                      className="p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Sil (Del)"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

