import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette, X, ChevronDown, ChevronUp } from 'lucide-react';
import { colorPresets, categories, type ColorPreset } from '../../utils/colorPresets';

interface ColorPickerProps {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  onChange: (colors: ColorPickerProps['colors']) => void;
  defaultColors?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
}

const ColorPicker: React.FC<ColorPickerProps> = ({ colors, onChange, defaultColors }) => {
  const [activeColor, setActiveColor] = useState<keyof ColorPickerProps['colors'] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('wedding');
  const [showPresets, setShowPresets] = useState(true);

  const handleColorChange = (hex: string) => {
    if (activeColor) {
      onChange({
        ...colors,
        [activeColor]: hex
      });
    }
  };

  const handlePresetSelect = (preset: ColorPreset) => {
    onChange(preset.colors);
    setActiveColor(null);
  };

  const colorLabels = {
    primary: 'Ana Renk',
    secondary: 'İkincil Renk',
    background: 'Arka Plan',
    text: 'Metin Rengi',
    accent: 'Vurgu Rengi'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-4 w-4 text-primary-600" />
        <h3 className="text-sm font-bold text-gray-900">Renk Özelleştirme</h3>
      </div>

      {/* Preset Categories */}
      <div className="mb-4">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center justify-between w-full text-xs font-medium text-gray-700 mb-2 hover:text-gray-900"
        >
          <span>Hazır Temalar</span>
          {showPresets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {showPresets && (
          <>
            <div className="flex flex-wrap gap-1 mb-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-primary-300'
                  }`}
                >
                  {category.emoji} {category.name}
                </button>
              ))}
            </div>

            {/* Preset Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
              {colorPresets
                .filter(preset => preset.category === selectedCategory)
                .map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="p-2 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex gap-1 mb-1">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: preset.colors.primary }}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: preset.colors.secondary }}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: preset.colors.accent }}
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-700 truncate">{preset.name}</p>
                  </button>
                ))}
            </div>
          </>
        )}
      </div>

      {/* Custom Colors */}
      <div>
        <h4 className="text-xs font-medium text-gray-700 mb-2">Özel Renkler</h4>
        <div className="space-y-2">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">
                  {colorLabels[key as keyof typeof colorLabels]}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveColor(activeColor === key ? null : key as keyof typeof colors)}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-primary-500 transition-colors relative"
                    style={{ backgroundColor: value }}
                    title={`${colorLabels[key as keyof typeof colorLabels]} değiştir`}
                  >
                    {activeColor === key && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded">
                        <X className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                  <input
                    type="text"
                    value={value.toUpperCase()}
                    onChange={(e) => {
                      const hex = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(hex)) {
                        onChange({ ...colors, [key]: hex });
                      }
                    }}
                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded text-center font-mono uppercase"
                    placeholder="#000000"
                  />
                </div>
              </div>
              
              {/* Inline Color Picker */}
              {activeColor === key && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <HexColorPicker 
                    color={colors[activeColor]} 
                    onChange={handleColorChange}
                    style={{ width: '100%', height: '150px' }}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => setActiveColor(null)}
                      className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
