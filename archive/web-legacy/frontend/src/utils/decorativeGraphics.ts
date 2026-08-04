/**
 * Decorative Graphics Library
 * Using local graphics from /public/graphics/
 * All graphics are stored locally for reliability and performance
 */

export interface DecorativeGraphic {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  defaultSize: { width: number; height: number };
  keywords: string[];
  isPremium?: boolean;
}

export const DECORATIVE_GRAPHICS: Record<string, DecorativeGraphic> = {
  // 🎉 PARTY FLAGS & BUNTING
  'party-flags-1': {
    id: 'party-flags-1',
    name: 'Renkli Parti Bayrakları',
    category: 'party',
    imageUrl: '/graphics/Party-Flags-PNG-Isolated-Pic.png',
    defaultSize: { width: 220, height: 90 },
    keywords: ['bayrak', 'parti', 'flags', 'bunting', 'colorful']
  },
  'party-flags-2': {
    id: 'party-flags-2',
    name: 'Üçgen Parti Bayrakları',
    category: 'party',
    imageUrl: '/graphics/Party-Flags-PNG-Background-Isolated-Image.png',
    defaultSize: { width: 220, height: 80 },
    keywords: ['bayrak', 'parti', 'üçgen', 'flags', 'triangle']
  },
  'party-flags-3': {
    id: 'party-flags-3',
    name: 'Pastel Parti Bayrakları',
    category: 'party',
    imageUrl: '/graphics/Party-Flags-Transparent-Images-PNG.png',
    defaultSize: { width: 220, height: 85 },
    keywords: ['bayrak', 'pastel', 'parti', 'flags', 'soft']
  },
  'party-flags-4': {
    id: 'party-flags-4',
    name: 'Gökkuşağı Parti Bayrakları',
    category: 'party',
    imageUrl: '/graphics/Party-Flags-PNG-Transparent.png',
    defaultSize: { width: 240, height: 90 },
    keywords: ['bayrak', 'gökkuşağı', 'parti', 'flags', 'rainbow']
  },
  'party-flags-5': {
    id: 'party-flags-5',
    name: 'Lüks Parti Bayrakları',
    category: 'party',
    imageUrl: '/graphics/Party-Flags-PNG-Isolated-Free-Download.png',
    defaultSize: { width: 250, height: 95 },
    keywords: ['bayrak', 'lüks', 'parti', 'flags', 'luxury']
  },

  // 🎈 BALLOONS - Colorful balloon bunches
  'balloons-bunch-1': {
    id: 'balloons-bunch-1',
    name: 'Renkli Balon Demeti',
    category: 'party',
    imageUrl: '/graphics/Bunch-of-Balloons-PNG-Image.png',
    defaultSize: { width: 130, height: 160 },
    keywords: ['balon', 'demet', 'renkli', 'balloon', 'bunch']
  },
  'balloons-gold': {
    id: 'balloons-gold',
    name: 'Altın Balon Demeti',
    category: 'celebration',
    imageUrl: '/graphics/Gold-Balloons-PNG-Photo.png',
    defaultSize: { width: 120, height: 150 },
    keywords: ['balon', 'altın', 'demet', 'balloon', 'gold']
  },
  'balloons-black-gold': {
    id: 'balloons-black-gold',
    name: 'Siyah Altın Balon',
    category: 'elegant',
    imageUrl: '/graphics/Black-And-Gold-Balloons-PNG.png',
    defaultSize: { width: 130, height: 150 },
    keywords: ['balon', 'siyah', 'altın', 'balloon', 'elegant']
  },
  'balloons-party-decoration': {
    id: 'balloons-party-decoration',
    name: 'Parti Balon Dekorasyonu',
    category: 'party',
    imageUrl: '/graphics/Birthday-Party-Balloon-Decoration-PNG.png',
    defaultSize: { width: 140, height: 160 },
    keywords: ['balon', 'parti', 'dekorasyon', 'balloon', 'decoration']
  },
  'balloons-birthday-text': {
    id: 'balloons-birthday-text',
    name: 'Doğum Günü Balonları',
    category: 'birthday',
    imageUrl: '/graphics/Balloons-Birthday-Text-PNG.png',
    defaultSize: { width: 150, height: 140 },
    keywords: ['balon', 'doğum günü', 'balloon', 'birthday']
  },

  // 🎊 CONFETTI & FIREWORKS
  'confetti-red': {
    id: 'confetti-red',
    name: 'Kırmızı Konfeti',
    category: 'celebration',
    imageUrl: '/graphics/Red-Confetti-PNG-Photo.png',
    defaultSize: { width: 130, height: 130 },
    keywords: ['konfeti', 'kırmızı', 'confetti', 'red']
  },
  'confetti-colorful': {
    id: 'confetti-colorful',
    name: 'Renkli Konfeti',
    category: 'celebration',
    imageUrl: '/graphics/Red-Confetti-PNG-Pic.png',
    defaultSize: { width: 140, height: 140 },
    keywords: ['konfeti', 'renkli', 'confetti', 'colorful']
  },
  'fireworks-1': {
    id: 'fireworks-1',
    name: 'Havai Fişek',
    category: 'celebration',
    imageUrl: '/graphics/Fireworks-PNG-File.png',
    defaultSize: { width: 120, height: 140 },
    keywords: ['havai fişek', 'kutlama', 'fireworks', 'celebration']
  },
  'fireworks-pink': {
    id: 'fireworks-pink',
    name: 'Pembe Havai Fişek',
    category: 'celebration',
    imageUrl: '/graphics/Pink-Vector-Fireworks-PNG-File.png',
    defaultSize: { width: 110, height: 130 },
    keywords: ['havai fişek', 'pembe', 'fireworks', 'pink']
  },
  'fireworks-gold': {
    id: 'fireworks-gold',
    name: 'Altın Havai Fişek',
    category: 'celebration',
    imageUrl: '/graphics/Festive-Gold-Fireworks-PNG-Clipart.png',
    defaultSize: { width: 130, height: 150 },
    keywords: ['havai fişek', 'altın', 'fireworks', 'gold']
  },
  'fireworks-sparkle': {
    id: 'fireworks-sparkle',
    name: 'Işıltılı Havai Fişek',
    category: 'celebration',
    imageUrl: '/graphics/Sparkle-Gold-Fireworks-PNG-Clipart.png',
    defaultSize: { width: 130, height: 150 },
    keywords: ['havai fişek', 'ışıltı', 'fireworks', 'sparkle']
  },
  'fireworks-newyear': {
    id: 'fireworks-newyear',
    name: 'Yılbaşı Havai Fişek',
    category: 'celebration',
    imageUrl: '/graphics/New-Year-Fireworks-PNG.png',
    defaultSize: { width: 120, height: 130 },
    keywords: ['havai fişek', 'yılbaşı', 'fireworks', 'newyear']
  },

  // 🌸 FLOWERS & WREATHS
  'flower-wreath-1': {
    id: 'flower-wreath-1',
    name: 'Çiçek Çelenk',
    category: 'elegant',
    imageUrl: '/graphics/Wreath-Funeral-Flowers-Transparent-Background.png',
    defaultSize: { width: 150, height: 150 },
    keywords: ['çiçek', 'çelenk', 'flower', 'wreath']
  },
  'flower-wreath-2': {
    id: 'flower-wreath-2',
    name: 'Zarif Çiçek Çelenk',
    category: 'elegant',
    imageUrl: '/graphics/Wreath-Funeral-Flowers-PNG-Transparent-Image.png',
    defaultSize: { width: 150, height: 150 },
    keywords: ['çiçek', 'çelenk', 'zarif', 'flower', 'wreath']
  },
  'flower-frame': {
    id: 'flower-frame',
    name: 'Suluboya Çiçek Çerçeve',
    category: 'elegant',
    imageUrl: '/graphics/Watercolor-Floral-Flower-Frame-PNG-Clipart.png',
    defaultSize: { width: 140, height: 140 },
    keywords: ['çiçek', 'çerçeve', 'suluboya', 'flower', 'frame']
  },
  'flower-garland': {
    id: 'flower-garland',
    name: 'Çiçek Garland',
    category: 'wedding',
    imageUrl: '/graphics/Garland-Round-Transparent-Background.png',
    defaultSize: { width: 150, height: 150 },
    keywords: ['çiçek', 'garland', 'düğün', 'flower', 'wedding']
  },
  'wedding-garland': {
    id: 'wedding-garland',
    name: 'Düğün Çiçek Çelenk',
    category: 'wedding',
    imageUrl: '/graphics/Wedding-Garland-Round-PNG-Pic.png',
    defaultSize: { width: 150, height: 150 },
    keywords: ['düğün', 'çiçek', 'çelenk', 'wedding', 'garland']
  },

  // 🍃 LEAVES & PLANTS
  'eucalyptus': {
    id: 'eucalyptus',
    name: 'Okaliptüs Yaprakları',
    category: 'elegant',
    imageUrl: '/graphics/Eucalyptus-PNG-Isolated-Photos.webp',
    defaultSize: { width: 110, height: 150 },
    keywords: ['yaprak', 'okaliptüs', 'leaves', 'eucalyptus']
  },
  'plant-aesthetic': {
    id: 'plant-aesthetic',
    name: 'Estetik Bitki',
    category: 'elegant',
    imageUrl: '/graphics/Aesthetic-Plant-PNG-Image.png',
    defaultSize: { width: 100, height: 140 },
    keywords: ['bitki', 'yaprak', 'plant', 'aesthetic']
  },
  'fall-leaves': {
    id: 'fall-leaves',
    name: 'Sonbahar Yaprakları',
    category: 'elegant',
    imageUrl: '/graphics/Fall-PNG-Photo.png',
    defaultSize: { width: 120, height: 130 },
    keywords: ['yaprak', 'sonbahar', 'fall', 'leaves']
  },

  // 💍 WEDDING - Romantic elements
  'rose-bouquet': {
    id: 'rose-bouquet',
    name: 'Kırmızı Gül Buketi',
    category: 'wedding',
    imageUrl: '/graphics/Red-Rose-Bouquet-PNG-HD.png',
    defaultSize: { width: 130, height: 160 },
    keywords: ['gül', 'buket', 'düğün', 'rose', 'bouquet']
  },
  'rose-petals': {
    id: 'rose-petals',
    name: 'Gül Yaprakları',
    category: 'wedding',
    imageUrl: '/graphics/Rose-Petals-PNG-File.png',
    defaultSize: { width: 120, height: 100 },
    keywords: ['gül', 'yaprak', 'rose', 'petals']
  },
  'wedding-dove-1': {
    id: 'wedding-dove-1',
    name: 'Düğün Güvercinleri',
    category: 'wedding',
    imageUrl: '/graphics/Wedding-Pigeon-Love-PNG-Clipart.png',
    defaultSize: { width: 120, height: 110 },
    keywords: ['güvercin', 'düğün', 'dove', 'wedding']
  },
  'wedding-dove-2': {
    id: 'wedding-dove-2',
    name: 'Beyaz Güvercin',
    category: 'wedding',
    imageUrl: '/graphics/Wedding-Pigeon-PNG-Transparent-Image.png',
    defaultSize: { width: 110, height: 100 },
    keywords: ['güvercin', 'beyaz', 'dove', 'white']
  },
  'wedding-couple': {
    id: 'wedding-couple',
    name: 'Düğün Çifti',
    category: 'wedding',
    imageUrl: '/graphics/Cute-Wedding-Couple-Cartoon-PNG-Isolated-File.png',
    defaultSize: { width: 110, height: 130 },
    keywords: ['düğün', 'çift', 'wedding', 'couple']
  },
  'wedding-icon': {
    id: 'wedding-icon',
    name: 'Düğün İkonu',
    category: 'wedding',
    imageUrl: '/graphics/Wedding-PNG-Transparent-Picture.png',
    defaultSize: { width: 90, height: 90 },
    keywords: ['düğün', 'ikon', 'wedding', 'icon']
  },

  // 🎂 BIRTHDAY - Celebration
  'birthday-cake-1': {
    id: 'birthday-cake-1',
    name: 'Doğum Günü Pastası',
    category: 'birthday',
    imageUrl: '/graphics/Birthday-Cake-PNG-Photos.png',
    defaultSize: { width: 100, height: 110 },
    keywords: ['pasta', 'doğum günü', 'cake', 'birthday']
  },
  'birthday-cake-2': {
    id: 'birthday-cake-2',
    name: 'Renkli Doğum Günü Pastası',
    category: 'birthday',
    imageUrl: '/graphics/Birthday-Cake-PNG-Pic.png',
    defaultSize: { width: 110, height: 120 },
    keywords: ['pasta', 'doğum günü', 'renkli', 'cake', 'birthday']
  },
  'birthday-cake-masha': {
    id: 'birthday-cake-masha',
    name: 'Maşa Pastası',
    category: 'birthday',
    imageUrl: '/graphics/Masha-And-The-Bear-Cake-PNG-Image-Background.png',
    defaultSize: { width: 110, height: 130 },
    keywords: ['pasta', 'maşa', 'doğum günü', 'cake', 'masha']
  },
  'birthday-minions': {
    id: 'birthday-minions',
    name: 'Minions Doğum Günü',
    category: 'birthday',
    imageUrl: '/graphics/Birthday-Minions-PNG-File.png',
    defaultSize: { width: 120, height: 130 },
    keywords: ['minions', 'doğum günü', 'birthday']
  },
  'birthday-hat': {
    id: 'birthday-hat',
    name: 'Parti Şapkası',
    category: 'birthday',
    imageUrl: '/graphics/Party-Hat-PNG-Transparent-Image.png',
    defaultSize: { width: 90, height: 110 },
    keywords: ['şapka', 'parti', 'hat', 'party']
  },
  'birthday-gift': {
    id: 'birthday-gift',
    name: 'Hediye Kutusu',
    category: 'birthday',
    imageUrl: '/graphics/Colorful-Birthday-Gift-Vector-Clipart-PNG.png',
    defaultSize: { width: 90, height: 100 },
    keywords: ['hediye', 'kutu', 'gift', 'present']
  },
  'birthday-text-1': {
    id: 'birthday-text-1',
    name: 'Happy Birthday Yazısı',
    category: 'birthday',
    imageUrl: '/graphics/Birthday-PNG-HD-Isolated.png',
    defaultSize: { width: 160, height: 80 },
    keywords: ['doğum günü', 'yazı', 'birthday', 'text']
  },
  'birthday-text-2': {
    id: 'birthday-text-2',
    name: 'Doğum Günü Dekorasyonu',
    category: 'birthday',
    imageUrl: '/graphics/Birthday-PNG-Isolated-File.png',
    defaultSize: { width: 170, height: 90 },
    keywords: ['doğum günü', 'dekorasyon', 'birthday', 'decoration']
  },
  'birthday-gold': {
    id: 'birthday-gold',
    name: 'Altın Happy Birthday',
    category: 'birthday',
    imageUrl: '/graphics/Happy-Birthday-Gold-PNG-Isolated-Pic.png',
    defaultSize: { width: 160, height: 70 },
    keywords: ['doğum günü', 'altın', 'birthday', 'gold']
  },
  'birthday-blue': {
    id: 'birthday-blue',
    name: 'Mavi Doğum Günü',
    category: 'birthday',
    imageUrl: '/graphics/Blue-Birthday-Text-PNG.png',
    defaultSize: { width: 150, height: 80 },
    keywords: ['doğum günü', 'mavi', 'birthday', 'blue']
  },
  'birthday-emoji': {
    id: 'birthday-emoji',
    name: 'Doğum Günü Emoji',
    category: 'birthday',
    imageUrl: '/graphics/Birthday-Party-Hard-Emoji-PNG-Transparent-Image.png',
    defaultSize: { width: 80, height: 80 },
    keywords: ['emoji', 'doğum günü', 'birthday']
  },
  'first-birthday-1': {
    id: 'first-birthday-1',
    name: '1. Yaş Günü',
    category: 'birthday',
    imageUrl: '/graphics/1st-Birthday-Transparent-PNG.png',
    defaultSize: { width: 120, height: 130 },
    keywords: ['1 yaş', 'ilk', 'first', 'birthday']
  },
  'first-birthday-2': {
    id: 'first-birthday-2',
    name: '1 Yaş Kutlama',
    category: 'birthday',
    imageUrl: '/graphics/1st-Birthday-PNG-HD.png',
    defaultSize: { width: 110, height: 120 },
    keywords: ['1 yaş', 'kutlama', 'first', 'birthday']
  },

  // 👶 BABY - Cute baby elements
  'baby-bottle': {
    id: 'baby-bottle',
    name: 'Bebek Biberon',
    category: 'baby',
    imageUrl: '/graphics/Baby-Bottle-PNG-Clipart.png',
    defaultSize: { width: 70, height: 100 },
    keywords: ['bebek', 'biberon', 'baby', 'bottle']
  },
  'baby-pram': {
    id: 'baby-pram',
    name: 'Bebek Arabası',
    category: 'baby',
    imageUrl: '/graphics/Pram-PNG-HD.png',
    defaultSize: { width: 100, height: 100 },
    keywords: ['bebek', 'araba', 'baby', 'pram']
  },
  'baby-feet-1': {
    id: 'baby-feet-1',
    name: 'Bebek Ayak İzi',
    category: 'baby',
    imageUrl: '/graphics/Baby-Feet-PNG.png',
    defaultSize: { width: 80, height: 80 },
    keywords: ['bebek', 'ayak', 'baby', 'feet']
  },
  'baby-feet-2': {
    id: 'baby-feet-2',
    name: 'Bebek Ayak İzi 2',
    category: 'baby',
    imageUrl: '/graphics/Baby-Feet-PNG-File.png',
    defaultSize: { width: 70, height: 70 },
    keywords: ['bebek', 'ayak', 'baby', 'feet']
  },
  'baby-feet-3': {
    id: 'baby-feet-3',
    name: 'Pembe Bebek Ayak İzi',
    category: 'baby',
    imageUrl: '/graphics/Baby-Feet-PNG-Picture.png',
    defaultSize: { width: 75, height: 75 },
    keywords: ['bebek', 'ayak', 'pembe', 'baby', 'feet']
  },
  'baby-girl': {
    id: 'baby-girl',
    name: 'Bebek Kız',
    category: 'baby',
    imageUrl: '/graphics/Baby-Girl-PNG-Image.png',
    defaultSize: { width: 100, height: 120 },
    keywords: ['bebek', 'kız', 'baby', 'girl']
  },
  'mother-baby': {
    id: 'mother-baby',
    name: 'Anne ve Bebek',
    category: 'baby',
    imageUrl: '/graphics/Vector-Happy-Mother-With-Baby-Transparent-Background.png',
    defaultSize: { width: 110, height: 130 },
    keywords: ['anne', 'bebek', 'mother', 'baby']
  },
  'boss-baby': {
    id: 'boss-baby',
    name: 'Boss Baby',
    category: 'baby',
    imageUrl: '/graphics/The-Boss-Baby-Transparent-PNG.png',
    defaultSize: { width: 90, height: 110 },
    keywords: ['bebek', 'boss baby', 'baby']
  },

  // 🎓 GRADUATION - Academic celebration
  'graduation-cap-1': {
    id: 'graduation-cap-1',
    name: 'Mezuniyet Kepı',
    category: 'graduation',
    imageUrl: '/graphics/Grad-Hat-PNG-Photos.png',
    defaultSize: { width: 100, height: 90 },
    keywords: ['mezuniyet', 'kep', 'graduation', 'cap']
  },
  'graduation-cap-2': {
    id: 'graduation-cap-2',
    name: 'Siyah Mezuniyet Kepı',
    category: 'graduation',
    imageUrl: '/graphics/Scholar-Hat-PNG-Photo.png',
    defaultSize: { width: 110, height: 95 },
    keywords: ['mezuniyet', 'kep', 'siyah', 'graduation', 'cap']
  },
  'graduation-cap-3': {
    id: 'graduation-cap-3',
    name: 'Renkli Mezuniyet Kepı',
    category: 'graduation',
    imageUrl: '/graphics/Graduation-Cap-PNG-Picture.png',
    defaultSize: { width: 105, height: 90 },
    keywords: ['mezuniyet', 'kep', 'renkli', 'graduation', 'cap']
  },
  'graduation-kids-1': {
    id: 'graduation-kids-1',
    name: 'Çocuk Mezuniyet',
    category: 'graduation',
    imageUrl: '/graphics/Kids-Graduation-PNG-Picture.png',
    defaultSize: { width: 90, height: 110 },
    keywords: ['mezuniyet', 'çocuk', 'kids', 'graduation']
  },
  'graduation-kids-2': {
    id: 'graduation-kids-2',
    name: 'Çocuk Mezuniyet 2',
    category: 'graduation',
    imageUrl: '/graphics/Kids-Graduation-PNG-Isolated-Image.png',
    defaultSize: { width: 85, height: 105 },
    keywords: ['mezuniyet', 'çocuk', 'kids', 'graduation']
  },
  'diploma': {
    id: 'diploma',
    name: 'Diploma',
    category: 'graduation',
    imageUrl: '/graphics/Diploma-Certificate-Transparent-PNG.png',
    defaultSize: { width: 120, height: 95 },
    keywords: ['diploma', 'mezuniyet', 'graduation']
  },

  // ⭐ DECORATIVE FRAMES & RIBBONS
  'frame-gold': {
    id: 'frame-gold',
    name: 'Altın Çerçeve',
    category: 'elegant',
    imageUrl: '/graphics/Frame-Border-PNG-HD.png',
    defaultSize: { width: 160, height: 160 },
    keywords: ['çerçeve', 'altın', 'frame', 'gold']
  },
  'birthday-frame': {
    id: 'birthday-frame',
    name: 'Doğum Günü Çerçeve',
    category: 'birthday',
    imageUrl: '/graphics/Birthday-Frame-Transparent-PNG.png',
    defaultSize: { width: 170, height: 170 },
    keywords: ['çerçeve', 'doğum günü', 'frame', 'birthday']
  },
  'gold-decoration-1': {
    id: 'gold-decoration-1',
    name: 'Altın Dekorasyon',
    category: 'elegant',
    imageUrl: '/graphics/Golden-Decoration-PNG-Isolated-HD.png',
    defaultSize: { width: 130, height: 110 },
    keywords: ['altın', 'dekorasyon', 'gold', 'decoration']
  },
  'gold-decoration-2': {
    id: 'gold-decoration-2',
    name: 'Altın Süsleme',
    category: 'elegant',
    imageUrl: '/graphics/Golden-Decoration-PNG-Pic.png',
    defaultSize: { width: 140, height: 120 },
    keywords: ['altın', 'süsleme', 'gold', 'decoration']
  },
  'gold-bow': {
    id: 'gold-bow',
    name: 'Altın Fiyonk',
    category: 'elegant',
    imageUrl: '/graphics/Gold-Bow-PNG-Image.png',
    defaultSize: { width: 100, height: 90 },
    keywords: ['altın', 'fiyonk', 'gold', 'bow']
  },
  'red-bow-1': {
    id: 'red-bow-1',
    name: 'Kırmızı Kurdele',
    category: 'celebration',
    imageUrl: '/graphics/Red-Ribbon-Bow-Transparent-PNG.png',
    defaultSize: { width: 100, height: 85 },
    keywords: ['kırmızı', 'kurdele', 'red', 'ribbon']
  },
  'red-bow-2': {
    id: 'red-bow-2',
    name: 'Kırmızı Fiyonk',
    category: 'celebration',
    imageUrl: '/graphics/Red-Gift-Bow-Transparent-PNG.png',
    defaultSize: { width: 110, height: 95 },
    keywords: ['kırmızı', 'fiyonk', 'red', 'bow']
  },

  // 🎨 FUN & MISCELLANEOUS
  'newyear-decoration': {
    id: 'newyear-decoration',
    name: 'Yılbaşı Dekorasyonu',
    category: 'celebration',
    imageUrl: '/graphics/New-Year-Decoration-PNG-Isolated-File.png',
    defaultSize: { width: 130, height: 120 },
    keywords: ['yılbaşı', 'dekorasyon', 'newyear', 'decoration']
  },
  'newyear-background': {
    id: 'newyear-background',
    name: 'Yılbaşı Arka Plan',
    category: 'celebration',
    imageUrl: '/graphics/New-Year-Background-PNG-Image.png',
    defaultSize: { width: 150, height: 130 },
    keywords: ['yılbaşı', 'arka plan', 'newyear', 'background']
  },
  'chinese-newyear': {
    id: 'chinese-newyear',
    name: 'Çin Yılbaşı',
    category: 'celebration',
    imageUrl: '/graphics/Chinese-New-Year-PNG-Photos.png',
    defaultSize: { width: 120, height: 110 },
    keywords: ['çin', 'yılbaşı', 'chinese', 'newyear']
  },
  'holidays-text': {
    id: 'holidays-text',
    name: 'Happy Holidays',
    category: 'celebration',
    imageUrl: '/graphics/Calligraphy-Happy-Holidays-PNG-Transparent.png',
    defaultSize: { width: 150, height: 70 },
    keywords: ['tatil', 'bayram', 'holidays']
  },
  'astronaut': {
    id: 'astronaut',
    name: 'Astronot',
    category: 'fun',
    imageUrl: '/graphics/Astronaut-Cartoon-PNG-Free-Download.png',
    defaultSize: { width: 100, height: 130 },
    keywords: ['astronot', 'uzay', 'astronaut', 'space']
  },
  'doodle': {
    id: 'doodle',
    name: 'Doodle',
    category: 'fun',
    imageUrl: '/graphics/Doodle-PNG-File.png',
    defaultSize: { width: 90, height: 90 },
    keywords: ['doodle', 'çizim', 'drawing']
  }
};

// Category helpers
export const getGraphicsCategories = (): string[] => {
  const categories = new Set<string>();
  Object.values(DECORATIVE_GRAPHICS).forEach(graphic => {
    categories.add(graphic.category);
  });
  return Array.from(categories);
};

export const getGraphicsByCategory = (category: string): DecorativeGraphic[] => {
  return Object.values(DECORATIVE_GRAPHICS).filter(
    graphic => graphic.category === category
  );
};

export const searchGraphics = (query: string): DecorativeGraphic[] => {
  const lowerQuery = query.toLowerCase();
  return Object.values(DECORATIVE_GRAPHICS).filter(graphic =>
    graphic.name.toLowerCase().includes(lowerQuery) ||
    graphic.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
};

export const CATEGORY_LABELS: Record<string, string> = {
  party: '🎉 Parti',
  love: '❤️ Aşk',
  celebration: '🎊 Kutlama',
  elegant: '🌹 Zarif',
  birthday: '🎂 Doğum Günü',
  wedding: '💍 Düğün',
  baby: '👶 Bebek',
  graduation: '🎓 Mezuniyet',
  corporate: '💼 Kurumsal',
  fun: '🎨 Eğlenceli'
};
