/**
 * Decorative Elements Library
 * Real graphics for invitations (Unsplash-based)
 */

import { DecorativeElementLibrary } from '../types/template';

export const DECORATIVE_ELEMENTS: DecorativeElementLibrary = {
  // BALLOONS
  balloon_red: {
    type: 'balloon',
    category: 'party',
    defaultSize: { width: 80, height: 120 },
    defaultColor: '#FF6B6B',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=200&h=300&fit=crop',
    svgPath: ''
  },
  balloon_blue: {
    type: 'balloon',
    category: 'party',
    defaultSize: { width: 40, height: 60 },
    defaultColor: '#4ECDC4',
    svgPath: 'M20,10 Q20,0 30,5 Q40,0 40,10 Q40,25 30,30 Q20,25 20,10 M30,30 L30,50 M28,50 Q30,55 32,50'
  },
  balloon_pink: {
    type: 'balloon',
    category: 'party',
    defaultSize: { width: 40, height: 60 },
    defaultColor: '#FFB6C1',
    svgPath: 'M20,10 Q20,0 30,5 Q40,0 40,10 Q40,25 30,30 Q20,25 20,10 M30,30 L30,50 M28,50 Q30,55 32,50'
  },

  // HEARTS
  heart_red: {
    type: 'heart',
    category: 'love',
    defaultSize: { width: 50, height: 50 },
    defaultColor: '#FF6B6B',
    svgPath: 'M25,45 L10,30 Q5,25 5,18 Q5,10 12,10 Q18,10 25,17 Q32,10 38,10 Q45,10 45,18 Q45,25 40,30 Z'
  },
  heart_pink: {
    type: 'heart',
    category: 'love',
    defaultSize: { width: 50, height: 50 },
    defaultColor: '#FFB6C1',
    svgPath: 'M25,45 L10,30 Q5,25 5,18 Q5,10 12,10 Q18,10 25,17 Q32,10 38,10 Q45,10 45,18 Q45,25 40,30 Z'
  },

  // STARS
  star_gold: {
    type: 'star',
    category: 'celebration',
    defaultSize: { width: 40, height: 40 },
    defaultColor: '#FFD700',
    svgPath: 'M20,2 L25,15 L38,15 L28,23 L32,36 L20,28 L8,36 L12,23 L2,15 L15,15 Z'
  },
  star_silver: {
    type: 'star',
    category: 'celebration',
    defaultSize: { width: 40, height: 40 },
    defaultColor: '#C0C0C0',
    svgPath: 'M20,2 L25,15 L38,15 L28,23 L32,36 L20,28 L8,36 L12,23 L2,15 L15,15 Z'
  },

  // CONFETTI
  confetti_multi: {
    type: 'confetti',
    category: 'party',
    defaultSize: { width: 60, height: 60 },
    defaultColor: '#FF6B6B',
    svgPath: 'M10,10 L12,12 M20,5 L22,7 M30,15 L32,17 M15,25 L17,27 M25,30 L27,32 M35,20 L37,22 M40,10 L42,12 M45,25 L47,27'
  },

  // FLOWERS
  flower_rose: {
    type: 'flower',
    category: 'elegant',
    defaultSize: { width: 50, height: 50 },
    defaultColor: '#FF69B4',
    svgPath: 'M25,25 Q20,20 20,15 Q20,10 25,10 Q30,10 30,15 Q30,20 25,25 M25,25 Q30,20 35,20 Q40,20 40,25 Q40,30 35,30 Q30,30 25,25 M25,25 Q30,30 30,35 Q30,40 25,40 Q20,40 20,35 Q20,30 25,25 M25,25 Q20,30 15,30 Q10,30 10,25 Q10,20 15,20 Q20,20 25,25'
  },

  // CANDLES
  candle_birthday: {
    type: 'candle',
    category: 'birthday',
    defaultSize: { width: 30, height: 50 },
    defaultColor: '#FFD700',
    svgPath: 'M15,5 Q15,2 17,2 Q19,2 19,5 L19,40 Q19,45 15,45 Q11,45 11,40 L11,5 M17,2 L17,0 Q17,-2 15,-2 Q13,-2 13,0 L13,2'
  },

  // PARTY HATS
  party_hat: {
    type: 'party_hat',
    category: 'party',
    defaultSize: { width: 40, height: 50 },
    defaultColor: '#FF6B6B',
    svgPath: 'M20,5 L5,40 L35,40 Z M5,40 Q5,45 10,45 L30,45 Q35,45 35,40'
  },

  // GIFT BOX
  gift_box: {
    type: 'gift',
    category: 'celebration',
    defaultSize: { width: 50, height: 50 },
    defaultColor: '#FF6B6B',
    svgPath: 'M10,20 L40,20 L40,45 L10,45 Z M25,5 Q20,5 20,10 L20,20 M25,5 Q30,5 30,10 L30,20 M10,20 L10,15 Q10,10 15,10 L35,10 Q40,10 40,15 L40,20 M25,20 L25,45'
  },

  // CAKE
  cake_birthday: {
    type: 'cake',
    category: 'birthday',
    defaultSize: { width: 60, height: 50 },
    defaultColor: '#FFB6C1',
    svgPath: 'M10,30 L50,30 L50,45 L10,45 Z M15,20 L45,20 L45,30 L15,30 Z M20,10 L40,10 L40,20 L20,20 Z M25,5 L25,10 M30,5 L30,10 M35,5 L35,10'
  },

  // RIBBONS
  ribbon_bow: {
    type: 'ribbon',
    category: 'elegant',
    defaultSize: { width: 60, height: 40 },
    defaultColor: '#FF6B6B',
    svgPath: 'M30,20 Q25,15 20,15 Q15,15 15,20 Q15,25 20,25 Q25,25 30,20 M30,20 Q35,15 40,15 Q45,15 45,20 Q45,25 40,25 Q35,25 30,20 M30,20 L30,35 M25,35 L35,35'
  },

  // RINGS (Wedding)
  ring_gold: {
    type: 'ring',
    category: 'wedding',
    defaultSize: { width: 50, height: 50 },
    defaultColor: '#FFD700',
    svgPath: 'M25,15 Q15,15 15,25 Q15,35 25,35 Q35,35 35,25 Q35,15 25,15 M25,18 Q20,18 20,25 Q20,32 25,32 Q30,32 30,25 Q30,18 25,18 M25,10 L25,15 M20,12 L23,15 M30,12 L27,15'
  },
  ring_silver: {
    type: 'ring',
    category: 'wedding',
    defaultSize: { width: 50, height: 50 },
    defaultColor: '#C0C0C0',
    svgPath: 'M25,15 Q15,15 15,25 Q15,35 25,35 Q35,35 35,25 Q35,15 25,15 M25,18 Q20,18 20,25 Q20,32 25,32 Q30,32 30,25 Q30,18 25,18'
  },

  // CHAMPAGNE
  champagne_glass: {
    type: 'champagne',
    category: 'celebration',
    defaultSize: { width: 40, height: 60 },
    defaultColor: '#FFD700',
    svgPath: 'M15,5 L25,25 L25,40 L20,40 L20,45 L30,45 L30,40 L25,40 L25,25 L35,5 Z M15,5 L35,5 M18,10 Q20,15 25,15 Q30,15 32,10'
  },

  // DOVE (Peace)
  dove_white: {
    type: 'dove',
    category: 'wedding',
    defaultSize: { width: 60, height: 40 },
    defaultColor: '#FFFFFF',
    svgPath: 'M10,20 Q10,15 15,15 Q20,15 25,20 L35,15 Q40,13 45,15 Q50,17 50,20 Q50,25 45,25 L35,23 L30,25 Q25,27 20,25 Q15,23 10,20 M25,20 L25,18 Q25,15 27,15 Q29,15 29,18'
  },

  // BABY ITEMS
  baby_bottle: {
    type: 'bottle',
    category: 'baby',
    defaultSize: { width: 30, height: 50 },
    defaultColor: '#87CEEB',
    svgPath: 'M12,10 L18,10 L18,5 Q18,2 15,2 Q12,2 12,5 Z M10,10 L20,10 L20,40 Q20,45 15,45 Q10,45 10,40 Z M12,15 L18,15 M12,20 L18,20 M12,25 L18,25'
  },
  baby_stroller: {
    type: 'stroller',
    category: 'baby',
    defaultSize: { width: 60, height: 50 },
    defaultColor: '#FFB6C1',
    svgPath: 'M10,20 L40,20 L40,30 Q40,35 35,35 L15,35 Q10,35 10,30 Z M40,20 L45,10 L50,10 M15,35 Q15,40 10,40 Q5,40 5,35 Q5,30 10,30 M35,35 Q35,40 40,40 Q45,40 45,35 Q45,30 40,30'
  },
  baby_footprint: {
    type: 'footprint',
    category: 'baby',
    defaultSize: { width: 40, height: 50 },
    defaultColor: '#87CEEB',
    svgPath: 'M20,10 Q15,10 15,15 Q15,20 20,20 Q25,20 25,15 Q25,10 20,10 M15,25 Q13,25 13,27 Q13,29 15,29 Q17,29 17,27 Q17,25 15,25 M20,28 Q18,28 18,30 Q18,32 20,32 Q22,32 22,30 Q22,28 20,28 M25,25 Q23,25 23,27 Q23,29 25,29 Q27,29 27,27 Q27,25 25,25 M28,30 Q26,30 26,32 Q26,34 28,34 Q30,34 30,32 Q30,30 28,30'
  },

  // GRADUATION
  graduation_cap: {
    type: 'cap',
    category: 'graduation',
    defaultSize: { width: 60, height: 40 },
    defaultColor: '#000000',
    svgPath: 'M5,20 L30,10 L55,20 L30,30 Z M30,30 L30,40 M25,40 L35,40 M28,42 L32,42 M30,10 L30,5 M28,5 L32,5'
  },
  diploma_scroll: {
    type: 'diploma',
    category: 'graduation',
    defaultSize: { width: 50, height: 40 },
    defaultColor: '#F5DEB3',
    svgPath: 'M10,10 L40,10 Q45,10 45,15 L45,35 Q45,40 40,40 L10,40 Q5,40 5,35 L5,15 Q5,10 10,10 M25,20 L35,20 M25,25 L35,25 M25,30 L35,30 M20,35 Q25,32 30,35'
  },

  // MUSIC
  music_note: {
    type: 'music',
    category: 'party',
    defaultSize: { width: 40, height: 50 },
    defaultColor: '#000000',
    svgPath: 'M20,10 L20,35 Q20,40 15,40 Q10,40 10,35 Q10,30 15,30 Q20,30 20,35 M20,10 L30,8 L30,33 Q30,38 25,38 Q20,38 20,33 Q20,28 25,28 Q30,28 30,33 M20,10 L30,8'
  },

  // CORPORATE
  briefcase: {
    type: 'briefcase',
    category: 'corporate',
    defaultSize: { width: 60, height: 50 },
    defaultColor: '#8B4513',
    svgPath: 'M10,20 L50,20 L50,45 L10,45 Z M20,20 L20,15 Q20,10 25,10 L35,10 Q40,10 40,15 L40,20 M10,30 L50,30 M25,30 L25,35 L35,35 L35,30'
  },

  // EMOJIS
  emoji_smile: {
    type: 'emoji',
    category: 'fun',
    defaultSize: { width: 50, height: 50 },
    defaultColor: '#FFD700',
    svgPath: 'M25,5 Q10,5 5,20 Q5,35 20,40 Q35,40 40,25 Q40,10 25,5 M18,18 Q18,15 20,15 Q22,15 22,18 M28,18 Q28,15 30,15 Q32,15 32,18 M15,25 Q20,32 25,32 Q30,32 35,25'
  },
  emoji_heart_eyes: {
    type: 'emoji',
    category: 'fun',
    defaultSize: { width: 50, height: 50 },
    defaultColor: '#FFD700',
    svgPath: 'M25,5 Q10,5 5,20 Q5,35 20,40 Q35,40 40,25 Q40,10 25,5 M15,18 L12,15 Q10,13 12,11 Q14,9 16,11 L18,13 L20,11 Q22,9 24,11 Q26,13 24,15 L21,18 M26,18 L23,15 Q21,13 23,11 Q25,9 27,11 L29,13 L31,11 Q33,9 35,11 Q37,13 35,15 L32,18 M15,28 Q20,33 25,33 Q30,33 35,28'
  },
  emoji_party: {
    type: 'emoji',
    category: 'fun',
    defaultSize: { width: 50, height: 50 },
    defaultColor: '#FFD700',
    svgPath: 'M25,5 Q10,5 5,20 Q5,35 20,40 Q35,40 40,25 Q40,10 25,5 M18,18 Q18,15 20,15 Q22,15 22,18 M28,18 Q28,15 30,15 Q32,15 32,18 M15,25 Q20,32 25,32 Q30,32 35,25 M20,5 L18,2 M25,3 L25,0 M30,5 L32,2 M35,8 L38,6'
  }
};

/**
 * Get decorative elements by category
 */
export const getElementsByCategory = (category: string) => {
  return Object.entries(DECORATIVE_ELEMENTS)
    .filter(([_, element]) => element.category === category)
    .map(([id, element]) => ({ id, ...element }));
};

/**
 * Get decorative elements by type
 */
export const getElementsByType = (type: string) => {
  return Object.entries(DECORATIVE_ELEMENTS)
    .filter(([_, element]) => element.type === type)
    .map(([id, element]) => ({ id, ...element }));
};

/**
 * Get all categories
 */
export const getCategories = () => {
  const categories = new Set(
    Object.values(DECORATIVE_ELEMENTS).map(el => el.category)
  );
  return Array.from(categories);
};

/**
 * Render SVG element
 */
export const renderSVGElement = (
  elementId: string,
  color?: string,
  size?: { width: number; height: number }
) => {
  const element = DECORATIVE_ELEMENTS[elementId];
  if (!element) return null;

  const finalColor = color || element.defaultColor;
  const finalSize = size || element.defaultSize;

  return `
    <svg 
      width="${finalSize.width}" 
      height="${finalSize.height}" 
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="${element.svgPath}" 
        fill="${finalColor}" 
        stroke="${finalColor}"
        stroke-width="1"
      />
    </svg>
  `;
};

