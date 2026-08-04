import React, { useState } from 'react';
import { Palette, RefreshCw, Check } from 'lucide-react';
import type { ColorPalette } from '../../types/template';
import { colorPresets, categories } from '../../utils/colorPresets';

interface ColorPaletteEditorProps {
  palette: ColorPalette;
  onChange: (palette: ColorPalette) => void;
  compact?: boolean;
}

export const ColorPaletteEditor: React.FC<ColorPaletteEditorProps> = ({
  palette,
  onChange,
  compact = false
}) => {
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('wedding');
  const [showPresets, setShowPresets] = useState(false);

  const handleColorChange = (key: string, value: string) => {
    onChange({
      ...palette,
      [key]: value
    });
  };

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    onChange({
      primary: preset.colors.primary,
      secondary: preset.colors.secondary,
      accent: preset.colors.accent,
      background: preset.colors.background,
      text: preset.colors.text
    });
    setShowPresets(false);
  };

  const colorKeys = Object.keys(palette);
  const mainColors = ['primary', 'secondary', 'accent', 'background', 'text'];
  const additionalColors = colorKeys.filter(k => !mainColors.includes(k));

  const colorLabels: Record<string, string> = {
    primary: 'Ana Renk',
    secondary: 'İkincil Renk',
    accent: 'Vurgu Rengi',
    background: 'Arka Plan',
    text: 'Metin Rengi'
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {mainColors.map(key => (
          palette[key] && (
            <div key={key} className="relative group">
              <input
                type="color"
                value={palette[key]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                title={colorLabels[key] || key}
              />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {colorLabels[key] || key}
              </div>
            </div>
          )
        ))}
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors"
          title="Hazır Temalar"
        >
          <Palette className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-600" />
          Renk Paleti
        </h3>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Hazır Temalar
        </button>
      </div>

      {/* Preset Selector */}
      {showPresets && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-3 py-1.5 text-sm rounded-lg border transition-colors
                  ${selectedCategory === category.id
                    ? 'bg-primary-100 border-primary-500 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-primary-300'
                  }
                `}
              >
                {category.emoji} {category.name}
              </button>
            ))}
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {colorPresets
              .filter(preset => preset.category === selectedCategory)
              .map((preset) => {
                const isActive = 
                  palette.primary === preset.colors.primary &&
                  palette.secondary === preset.colors.secondary &&
                  palette.accent === preset.colors.accent;

                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`
                      p-3 border rounded-lg hover:shadow-md transition-all text-left relative
                      ${isActive 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-primary-300'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary-600" />
                      </div>
                    )}
                    <div className="flex gap-1.5 mb-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: preset.colors.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: preset.colors.secondary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: preset.colors.accent }}
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-700">{preset.name}</p>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Main Colors */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Ana Renkler</h4>
        {mainColors.map(key => (
          palette[key] && (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-gray-600">
                {colorLabels[key] || key}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={palette[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={palette[key].toUpperCase()}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded text-center font-mono uppercase"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
          )
        ))}
      </div>

      {/* Additional Colors */}
      {additionalColors.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Ek Renkler</h4>
          {additionalColors.map(key => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-gray-600 capitalize">
                {key.replace('_', ' ')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={palette[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={palette[key].toUpperCase()}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded text-center font-mono uppercase"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

