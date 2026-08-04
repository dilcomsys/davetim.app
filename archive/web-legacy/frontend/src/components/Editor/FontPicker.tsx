import React, { useState } from 'react';
import { Type, ChevronDown, Check } from 'lucide-react';
import { TEMPLATE_FONTS, FONT_CATEGORIES, getFontFamily, type FontOption } from '../../utils/fonts';

interface FontPickerProps {
  selectedFont: string;
  availableFonts?: string[]; // If provided, only show these fonts
  onFontChange: (fontName: string) => void;
  label?: string;
  compact?: boolean;
}

export const FontPicker: React.FC<FontPickerProps> = ({
  selectedFont,
  availableFonts,
  onFontChange,
  label = 'Font Seç',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter fonts based on available fonts list
  const fonts = availableFonts
    ? TEMPLATE_FONTS.filter(font => availableFonts.includes(font.name))
    : TEMPLATE_FONTS;

  // Get fonts by category
  const fontsByCategory = selectedCategory
    ? fonts.filter(font => font.category === selectedCategory)
    : fonts;

  const currentFont = fonts.find(f => f.name === selectedFont);

  return (
    <div className="relative">
      {/* Label */}
      {!compact && label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Type className="w-4 h-4" />
          {label}
        </label>
      )}

      {/* Selected Font Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2 
          bg-white border border-gray-300 rounded-lg 
          hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-all
          ${compact ? 'px-3 py-2 text-sm' : 'px-4 py-3'}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Type className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 flex-shrink-0`} />
          <span
            className="font-medium truncate"
            style={{ fontFamily: getFontFamily(selectedFont) }}
          >
            {currentFont?.name || selectedFont}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors
                  ${selectedCategory === null
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                Tümü
              </button>
              {FONT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors
                    ${selectedCategory === cat.value
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Font List */}
            <div className="overflow-y-auto max-h-80">
              {fontsByCategory.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Bu kategoride font bulunamadı
                </div>
              ) : (
                fontsByCategory.map(font => (
                  <button
                    key={font.name}
                    onClick={() => {
                      onFontChange(font.name);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full px-4 py-3 flex items-center justify-between gap-3
                      hover:bg-gray-50 transition-colors text-left
                      ${selectedFont === font.name ? 'bg-primary-50' : ''}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {font.name}
                        </span>
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                          {FONT_CATEGORIES.find(c => c.value === font.category)?.label}
                        </span>
                      </div>
                      <div
                        className="text-base text-gray-700 truncate"
                        style={{ fontFamily: font.family }}
                      >
                        {font.preview}
                      </div>
                    </div>
                    {selectedFont === font.name && (
                      <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Compact Font Picker for toolbar
 */
export const CompactFontPicker: React.FC<Omit<FontPickerProps, 'compact'>> = (props) => {
  return <FontPicker {...props} compact />;
};

