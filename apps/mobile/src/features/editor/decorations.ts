/*
 * The decorative shape library. The web editor shipped one of these and the
 * mobile rewrite did not, so "Ekle" offered a text box, a rule and nothing else.
 *
 * These are vector paths rather than the web build's PNG set: a shape stays
 * crisp at any canvas size, recolours to the invitation's palette, and costs a
 * few hundred bytes instead of a bundled image per ornament. The geometry is
 * carried over from the web library so a design made there reads the same here.
 */

export type DecorationCategory =
  | 'wedding'
  | 'love'
  | 'celebration'
  | 'party'
  | 'elegant'
  | 'baby'
  | 'birthday'
  | 'graduation'
  | 'corporate';

export type Decoration = {
  id: string;
  name: string;
  category: DecorationCategory;
  path: string;
  color: string;
  /** Width divided by height. Used to size the element so nothing arrives squashed. */
  aspect: number;
  /** Shapes whose geometry does not sit inside the default box declare their own. */
  viewBox?: string;
  /*
   * Most of these paths are line drawings — a ring is two concentric circles, a
   * gift box is a lid and a ribbon. Filling them collapses every interior detail
   * into one silhouette, which is what the web build did and why its ring came
   * out as a plain disc. Outline is the default; only shapes that really are a
   * solid silhouette opt into a fill.
   */
  filled?: boolean;
  /** Line weight in the shape's own viewBox units. */
  strokeWidth?: number;
};

export const DECORATION_CATEGORY_LABELS: Record<DecorationCategory, string> = {
  baby: 'Bebek',
  birthday: 'Doğum günü',
  celebration: 'Kutlama',
  corporate: 'Kurumsal',
  elegant: 'Zarif',
  graduation: 'Mezuniyet',
  love: 'Aşk',
  party: 'Parti',
  wedding: 'Düğün',
};

export const DECORATIONS: Decoration[] = [
  // WEDDING
  {
    id: 'ring_gold',
    strokeWidth: 1.6,
    name: 'Altın alyans',
    category: 'wedding',
    color: '#C0A062',
    aspect: 1,
    path: 'M25,15 Q15,15 15,25 Q15,35 25,35 Q35,35 35,25 Q35,15 25,15 M25,18 Q20,18 20,25 Q20,32 25,32 Q30,32 30,25 Q30,18 25,18 M25,10 L25,15 M20,12 L23,15 M30,12 L27,15',
  },
  {
    id: 'ring_silver',
    strokeWidth: 1.6,
    name: 'Gümüş alyans',
    category: 'wedding',
    color: '#B9BDC4',
    aspect: 1,
    path: 'M25,15 Q15,15 15,25 Q15,35 25,35 Q35,35 35,25 Q35,15 25,15 M25,18 Q20,18 20,25 Q20,32 25,32 Q30,32 30,25 Q30,18 25,18',
  },
  {
    // Replaces the web library's dove, whose path was a scribble in any renderer.
    id: 'olive_branch',
    name: 'Zeytin dalı',
    category: 'wedding',
    color: '#6E7F5C',
    aspect: 1,
    path: 'M10,40 Q25,30 40,12 M18,33 Q14,26 20,24 Q24,29 18,33 M18,33 Q24,35 26,29 Q20,27 18,33 M26,26 Q22,19 28,17 Q32,22 26,26 M26,26 Q32,28 34,22 Q28,20 26,26 M33,19 Q29,13 35,11 Q38,16 33,19',
    viewBox: '6 8 38 36',
    strokeWidth: 1.4,
  },
  {
    id: 'champagne_glass',
    name: 'Şampanya kadehi',
    category: 'celebration',
    color: '#C0A062',
    aspect: 0.7,
    path: 'M15,5 L25,25 L25,40 L20,40 L20,45 L30,45 L30,40 L25,40 L25,25 L35,5 Z M15,5 L35,5 M18,10 Q20,15 25,15 Q30,15 32,10',
    viewBox: '12 2 26 46',
    strokeWidth: 1.6,
  },

  // LOVE
  {
    id: 'heart_red',
    filled: true,
    name: 'Kırmızı kalp',
    category: 'love',
    color: '#C0362C',
    aspect: 1,
    path: 'M25,45 L10,30 Q5,25 5,18 Q5,10 12,10 Q18,10 25,17 Q32,10 38,10 Q45,10 45,18 Q45,25 40,30 Z',
  },
  {
    id: 'heart_pink',
    filled: true,
    name: 'Pembe kalp',
    category: 'love',
    color: '#E8A0AE',
    aspect: 1,
    path: 'M25,45 L10,30 Q5,25 5,18 Q5,10 12,10 Q18,10 25,17 Q32,10 38,10 Q45,10 45,18 Q45,25 40,30 Z',
  },

  // ELEGANT
  {
    id: 'flower_rose',
    filled: true,
    name: 'Gül',
    category: 'elegant',
    color: '#D96A86',
    aspect: 1,
    path: 'M25,25 Q20,20 20,15 Q20,10 25,10 Q30,10 30,15 Q30,20 25,25 M25,25 Q30,20 35,20 Q40,20 40,25 Q40,30 35,30 Q30,30 25,25 M25,25 Q30,30 30,35 Q30,40 25,40 Q20,40 20,35 Q20,30 25,25 M25,25 Q20,30 15,30 Q10,30 10,25 Q10,20 15,20 Q20,20 25,25',
  },
  {
    id: 'ribbon_bow',
    strokeWidth: 1.6,
    name: 'Kurdele',
    category: 'elegant',
    color: '#C0362C',
    aspect: 1.5,
    path: 'M30,20 Q25,15 20,15 Q15,15 15,20 Q15,25 20,25 Q25,25 30,20 M30,20 Q35,15 40,15 Q45,15 45,20 Q45,25 40,25 Q35,25 30,20 M30,20 L30,35 M25,35 L35,35',
    viewBox: '12 12 36 26',
  },

  // CELEBRATION
  {
    id: 'star_gold',
    filled: true,
    name: 'Altın yıldız',
    category: 'celebration',
    color: '#C0A062',
    aspect: 1,
    path: 'M20,2 L25,15 L38,15 L28,23 L32,36 L20,28 L8,36 L12,23 L2,15 L15,15 Z',
    viewBox: '0 0 40 38',
  },
  {
    id: 'star_silver',
    filled: true,
    name: 'Gümüş yıldız',
    category: 'celebration',
    color: '#B9BDC4',
    aspect: 1,
    path: 'M20,2 L25,15 L38,15 L28,23 L32,36 L20,28 L8,36 L12,23 L2,15 L15,15 Z',
    viewBox: '0 0 40 38',
  },
  {
    id: 'gift_box',
    strokeWidth: 1.8,
    name: 'Hediye kutusu',
    category: 'celebration',
    color: '#C0362C',
    aspect: 1,
    path: 'M10,20 L40,20 L40,45 L10,45 Z M25,5 Q20,5 20,10 L20,20 M25,5 Q30,5 30,10 L30,20 M10,20 L10,15 Q10,10 15,10 L35,10 Q40,10 40,15 L40,20 M25,20 L25,45',
  },

  // PARTY
  {
    id: 'balloon_blue',
    name: 'Mavi balon',
    category: 'party',
    color: '#1B3FA0',
    aspect: 0.59,
    // Redrawn: the web path's tail crossed the body and read as a pin, not a balloon.
    path: 'M25,6 Q11,6 11,22 Q11,34 25,44 Q39,34 39,22 Q39,6 25,6 M22,45 L25,43 L28,45 L26,49 L24,49 Z M25,49 Q31,54 25,59',
    viewBox: '8 3 34 58',
    strokeWidth: 1.8,
  },
  {
    id: 'balloon_pink',
    name: 'Pembe balon',
    category: 'party',
    color: '#E8A0AE',
    aspect: 0.59,
    path: 'M25,6 Q11,6 11,22 Q11,34 25,44 Q39,34 39,22 Q39,6 25,6 M22,45 L25,43 L28,45 L26,49 L24,49 Z M25,49 Q31,54 25,59',
    viewBox: '8 3 34 58',
    strokeWidth: 1.8,
  },
  {
    id: 'confetti_multi',
    strokeWidth: 2.5,
    name: 'Konfeti',
    category: 'party',
    color: '#C0362C',
    aspect: 1,
    path: 'M10,10 L12,12 M20,5 L22,7 M30,15 L32,17 M15,25 L17,27 M25,30 L27,32 M35,20 L37,22 M40,10 L42,12 M45,25 L47,27',
  },
  {
    id: 'party_hat',
    strokeWidth: 1.8,
    name: 'Parti şapkası',
    category: 'party',
    color: '#C0362C',
    aspect: 0.8,
    path: 'M20,5 L5,40 L35,40 Z M5,40 Q5,45 10,45 L30,45 Q35,45 35,40',
    viewBox: '2 2 36 46',
  },
  {
    id: 'music_note',
    strokeWidth: 1.6,
    name: 'Nota',
    category: 'party',
    color: '#171A2B',
    aspect: 0.8,
    path: 'M20,10 L20,35 Q20,40 15,40 Q10,40 10,35 Q10,30 15,30 Q20,30 20,35 M20,10 L30,8 L30,33 Q30,38 25,38 Q20,38 20,33 Q20,28 25,28 Q30,28 30,33 M20,10 L30,8',
    viewBox: '8 6 26 36',
  },

  // BIRTHDAY
  {
    id: 'cake_birthday',
    strokeWidth: 1.6,
    name: 'Pasta',
    category: 'birthday',
    color: '#E8A0AE',
    aspect: 1.2,
    path: 'M10,30 L50,30 L50,45 L10,45 Z M15,20 L45,20 L45,30 L15,30 Z M20,10 L40,10 L40,20 L20,20 Z M25,5 L25,10 M30,5 L30,10 M35,5 L35,10',
    viewBox: '8 3 44 44',
  },
  {
    id: 'candle_birthday',
    name: 'Mum',
    category: 'birthday',
    color: '#C0A062',
    aspect: 0.25,
    path: 'M11,14 L19,14 L19,44 Q19,47 15,47 Q11,47 11,44 Z M15,14 L15,10 M15,10 Q11,7 15,2 Q19,7 15,10 Z',
    viewBox: '9 0 12 49',
    strokeWidth: 1.4,
  },

  // BABY
  {
    id: 'baby_footprint',
    name: 'Bebek ayak izi',
    category: 'baby',
    color: '#8FB8D8',
    aspect: 0.73,
    // Redrawn as one foot with its toes; the web path was five loose circles.
    path: 'M20,14 Q13,14 13,22 Q13,30 18,34 Q24,37 27,32 Q30,26 27,20 Q25,14 20,14 M14,10 Q11,10 11,12.5 Q11,15 14,15 Q17,15 17,12.5 Q17,10 14,10 M20,7 Q17.5,7 17.5,9.5 Q17.5,12 20,12 Q22.5,12 22.5,9.5 Q22.5,7 20,7 M25,8 Q23,8 23,10 Q23,12 25,12 Q27,12 27,10 Q27,8 25,8 M29,11 Q27,11 27,13 Q27,15 29,15 Q31,15 31,13 Q31,11 29,11',
    viewBox: '9 5 24 33',
    strokeWidth: 1.4,
  },
  {
    id: 'baby_onesie',
    name: 'Bebek zıbını',
    category: 'baby',
    color: '#E8A0AE',
    aspect: 1.1,
    // Replaces the web library's pram, which stroked into an unreadable trolley.
    path: 'M18,10 L18,14 Q25,18 32,14 L32,10 L40,13 L37,21 L33,20 L33,34 Q25,37 17,34 L17,20 L13,21 L10,13 Z',
    viewBox: '8 8 34 31',
    strokeWidth: 1.6,
  },
  {
    id: 'baby_bottle',
    name: 'Biberon',
    category: 'baby',
    color: '#8FB8D8',
    aspect: 0.3,
    path: 'M13,10 L17,10 L17,6 Q17,3 15,3 Q13,3 13,6 Z M10,12 Q10,10 12,10 L18,10 Q20,10 20,12 L20,42 Q20,46 15,46 Q10,46 10,42 Z M10,18 L20,18 M12,24 L15,24 M12,29 L15,29 M12,34 L15,34',
    viewBox: '8 1 14 47',
    strokeWidth: 1.3,
  },

  // GRADUATION
  {
    id: 'graduation_cap',
    name: 'Mezuniyet kepi',
    category: 'graduation',
    color: '#171A2B',
    aspect: 1.47,
    path: 'M25,10 L6,18 L25,26 L44,18 Z M13,22 L13,32 Q25,38 37,32 L37,22 M44,18 L44,30 M42,30 Q44,36 46,30 Z',
    viewBox: '4 8 44 30',
    strokeWidth: 1.6,
  },
  {
    id: 'diploma_scroll',
    strokeWidth: 1.4,
    name: 'Diploma',
    category: 'graduation',
    color: '#E3D3AE',
    aspect: 1.25,
    path: 'M10,10 L40,10 Q45,10 45,15 L45,35 Q45,40 40,40 L10,40 Q5,40 5,35 L5,15 Q5,10 10,10 M25,20 L35,20 M25,25 L35,25 M25,30 L35,30 M20,35 Q25,32 30,35',
    viewBox: '3 8 44 34',
  },

  // CORPORATE
  {
    id: 'briefcase',
    strokeWidth: 1.6,
    name: 'Evrak çantası',
    category: 'corporate',
    color: '#5A4632',
    aspect: 1.2,
    path: 'M10,20 L50,20 L50,45 L10,45 Z M20,20 L20,15 Q20,10 25,10 L35,10 Q40,10 40,15 L40,20 M10,30 L50,30 M25,30 L25,35 L35,35 L35,30',
    viewBox: '8 8 44 39',
  },
];

const byId = new Map(DECORATIONS.map((decoration) => [decoration.id, decoration]));

export function findDecoration(shapeId: string | undefined): Decoration | null {
  return shapeId ? byId.get(shapeId) ?? null : null;
}

export const DECORATION_CATEGORIES = Array.from(
  new Set(DECORATIONS.map((decoration) => decoration.category)),
);
