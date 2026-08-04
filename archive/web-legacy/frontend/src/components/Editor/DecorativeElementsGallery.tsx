import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { 
  DECORATIVE_GRAPHICS, 
  getGraphicsCategories, 
  getGraphicsByCategory,
  searchGraphics,
  CATEGORY_LABELS,
  type DecorativeGraphic
} from '../../utils/decorativeGraphics';

interface DecorativeElementsGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGraphic: (graphic: DecorativeGraphic) => void;
}

export const DecorativeElementsGallery: React.FC<DecorativeElementsGalleryProps> = ({
  isOpen,
  onClose,
  onSelectGraphic
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const categories = getGraphicsCategories();

  // Filter graphics
  let filteredGraphics: DecorativeGraphic[] = [];
  
  if (searchTerm) {
    filteredGraphics = searchGraphics(searchTerm);
    if (selectedCategory !== 'all') {
      filteredGraphics = filteredGraphics.filter(g => g.category === selectedCategory);
    }
  } else if (selectedCategory === 'all') {
    filteredGraphics = Object.values(DECORATIVE_GRAPHICS);
  } else {
    filteredGraphics = getGraphicsByCategory(selectedCategory);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Dekoratif Öğeler</h2>
              <p className="text-purple-100 text-sm mt-1">
                Davetiyenize özel dokunuşlar ekleyin
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ara... (balon, kalp, yıldız)"
              className="w-full pl-10 pr-4 py-2.5 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 py-4 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎨 Tümü
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {CATEGORY_LABELS[category] || category}
              </button>
            ))}
          </div>
        </div>

        {/* Graphics Grid */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {filteredGraphics.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {filteredGraphics.map((graphic) => (
                <button
                  key={graphic.id}
                  onClick={() => {
                    onSelectGraphic(graphic);
                    onClose();
                  }}
                  className="group relative aspect-square bg-white hover:bg-purple-50 rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all hover:shadow-lg hover:scale-105 overflow-hidden"
                  title={graphic.name}
                >
                  <img
                    src={graphic.imageUrl}
                    alt={graphic.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                    <span className="text-white text-xs font-medium px-2 text-center">
                      {graphic.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600 font-medium">Sonuç bulunamadı</p>
              <p className="text-gray-500 text-sm mt-1">
                Farklı bir kategori veya arama terimi deneyin
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            <span className="font-semibold text-purple-600">{filteredGraphics.length}</span> grafik gösteriliyor
          </p>
        </div>
      </div>
    </div>
  );
};

