import React from 'react';
import {
  MousePointer2, Type, Image, Shapes, Layers,
  ZoomIn, ZoomOut, Maximize2, Save, Eye, Share2,
  Download, Settings, Grid, Lock, Unlock
} from 'lucide-react';

interface ToolbarProps {
  activeTool: 'select' | 'text' | 'shape';
  onToolChange: (tool: 'select' | 'text' | 'shape') => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onSave: () => void;
  onPreview: () => void;
  onShare: () => void;
  onDownload: () => void;
  isSaving?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolChange,
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  onSave,
  onPreview,
  onShare,
  onDownload,
  isSaving = false
}) => {
  const tools = [
    { id: 'select' as const, icon: MousePointer2, label: 'Seç', shortcut: 'V' },
    { id: 'text' as const, icon: Type, label: 'Metin', shortcut: 'T' },
    { id: 'shape' as const, icon: Shapes, label: 'Şekil', shortcut: 'S' }
  ];

  return (
    <div className="w-16 xl:w-20 h-full bg-gray-900 text-white flex flex-col items-center py-4 gap-2 shadow-2xl overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
      {/* Logo */}
      <div className="mb-4 pb-4 border-b border-gray-700 w-full flex justify-center">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center font-bold text-lg">
          D
        </div>
      </div>

      {/* Tools */}
      <div className="flex flex-col gap-1 w-full px-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`
                relative group w-full aspect-square rounded-lg transition-all
                ${isActive
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }
              `}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon className="h-5 w-5 absolute inset-0 m-auto" />

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 hidden md:block">
                {tool.label}
                <span className="ml-2 text-gray-400">{tool.shortcut}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom Controls */}
      <div className="flex flex-col gap-1 w-full px-2 py-2 border-t border-gray-700">
        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          className="w-full aspect-square rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
          title="Yakınlaştır (+)"
        >
          <ZoomIn className="h-5 w-5 mx-auto" />
        </button>
        <div className="text-xs text-center text-gray-400 font-mono py-1">
          {zoom}%
        </div>
        <button
          onClick={() => onZoomChange(Math.max(25, zoom - 10))}
          className="w-full aspect-square rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
          title="Uzaklaştır (-)"
        >
          <ZoomOut className="h-5 w-5 mx-auto" />
        </button>
        <button
          onClick={() => onZoomChange(100)}
          className="w-full aspect-square rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
          title="100% (0)"
        >
          <Maximize2 className="h-5 w-5 mx-auto" />
        </button>
      </div>

      {/* Grid Toggle */}
      <div className="w-full px-2">
        <button
          onClick={onToggleGrid}
          className={`w-full aspect-square rounded-lg transition-all ${showGrid
              ? 'bg-primary-600 text-white'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          title="Izgara (G)"
        >
          <Grid className="h-5 w-5 mx-auto" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 w-full px-2 pt-2 border-t border-gray-700">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full aspect-square rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50"
          title="Kaydet (Ctrl+S)"
        >
          <Save className={`h-5 w-5 mx-auto ${isSaving ? 'animate-pulse' : ''}`} />
        </button>
        <button
          onClick={onPreview}
          className="w-full aspect-square rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
          title="Önizle (Ctrl+P)"
        >
          <Eye className="h-5 w-5 mx-auto" />
        </button>
        <button
          onClick={onShare}
          className="w-full aspect-square rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all"
          title="Paylaş"
        >
          <Share2 className="h-5 w-5 mx-auto" />
        </button>
        <button
          onClick={onDownload}
          className="w-full aspect-square rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-all"
          title="İndir (Ctrl+E)"
        >
          <Download className="h-5 w-5 mx-auto" />
        </button>
      </div>
    </div>
  );
};

