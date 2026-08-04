/**
 * Available fonts for invitation templates
 * Organized by style category
 */

export interface FontOption {
  name: string;
  family: string;
  category: 'elegant' | 'modern' | 'script' | 'fun' | 'serif';
  weights: number[];
  preview: string; // Sample text to show in font picker
}

export const TEMPLATE_FONTS: FontOption[] = [
  // Elegant & Classic
  {
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'elegant',
    weights: [400, 500, 600, 700],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Cormorant Garamond',
    family: "'Cormorant Garamond', serif",
    category: 'elegant',
    weights: [400, 500, 600, 700],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Cinzel',
    family: "'Cinzel', serif",
    category: 'elegant',
    weights: [400, 500, 600, 700],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Bodoni Moda',
    family: "'Bodoni Moda', serif",
    category: 'elegant',
    weights: [400, 500, 600, 700],
    preview: 'Düğünümüze Davetlisiniz'
  },
  
  // Modern & Clean
  {
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    category: 'modern',
    weights: [300, 400, 500, 600, 700, 800],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Poppins',
    family: "'Poppins', sans-serif",
    category: 'modern',
    weights: [300, 400, 500, 600, 700, 800],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Raleway',
    family: "'Raleway', sans-serif",
    category: 'modern',
    weights: [300, 400, 500, 600, 700, 800],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Lato',
    family: "'Lato', sans-serif",
    category: 'modern',
    weights: [300, 400, 700, 900],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Open Sans',
    family: "'Open Sans', sans-serif",
    category: 'modern',
    weights: [300, 400, 600, 700, 800],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Roboto',
    family: "'Roboto', sans-serif",
    category: 'modern',
    weights: [300, 400, 500, 700, 900],
    preview: 'Düğünümüze Davetlisiniz'
  },
  
  // Script & Handwriting
  {
    name: 'Dancing Script',
    family: "'Dancing Script', cursive",
    category: 'script',
    weights: [400, 500, 600, 700],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Great Vibes',
    family: "'Great Vibes', cursive",
    category: 'script',
    weights: [400],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Pacifico',
    family: "'Pacifico', cursive",
    category: 'script',
    weights: [400],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Satisfy',
    family: "'Satisfy', cursive",
    category: 'script',
    weights: [400],
    preview: 'Düğünümüze Davetlisiniz'
  },
  
  // Fun & Playful
  {
    name: 'Fredoka One',
    family: "'Fredoka One', cursive",
    category: 'fun',
    weights: [400],
    preview: 'Doğum Günü Partisi'
  },
  {
    name: 'Quicksand',
    family: "'Quicksand', sans-serif",
    category: 'fun',
    weights: [300, 400, 500, 600, 700],
    preview: 'Doğum Günü Partisi'
  },
  {
    name: 'Baloo 2',
    family: "'Baloo 2', cursive",
    category: 'fun',
    weights: [400, 500, 600, 700, 800],
    preview: 'Doğum Günü Partisi'
  },
  {
    name: 'Righteous',
    family: "'Righteous', cursive",
    category: 'fun',
    weights: [400],
    preview: 'Doğum Günü Partisi'
  },
  
  // Serif & Traditional
  {
    name: 'Lora',
    family: "'Lora', serif",
    category: 'serif',
    weights: [400, 500, 600, 700],
    preview: 'Düğünümüze Davetlisiniz'
  },
  {
    name: 'Merriweather',
    family: "'Merriweather', serif",
    category: 'serif',
    weights: [300, 400, 700, 900],
    preview: 'Düğünümüze Davetlisiniz'
  }
];

/**
 * Get font by name
 */
export const getFontByName = (name: string): FontOption | undefined => {
  return TEMPLATE_FONTS.find(font => font.name === name);
};

/**
 * Get fonts by category
 */
export const getFontsByCategory = (category: FontOption['category']): FontOption[] => {
  return TEMPLATE_FONTS.filter(font => font.category === category);
};

/**
 * Get font CSS family string
 */
export const getFontFamily = (name: string): string => {
  const font = getFontByName(name);
  return font?.family || "'Inter', sans-serif";
};

/**
 * Font categories with labels
 */
export const FONT_CATEGORIES = [
  { value: 'elegant', label: 'Zarif & Klasik', icon: '✨' },
  { value: 'modern', label: 'Modern & Temiz', icon: '🎯' },
  { value: 'script', label: 'El Yazısı', icon: '✍️' },
  { value: 'fun', label: 'Eğlenceli', icon: '🎉' },
  { value: 'serif', label: 'Geleneksel', icon: '📜' }
] as const;

/**
 * All available font names (for simple dropdown)
 */
export const ALL_FONTS = TEMPLATE_FONTS.map(font => font.name);

/**
 * FontFamily type - union of all font names
 */
export type FontFamily = typeof ALL_FONTS[number];

