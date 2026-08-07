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
  | 'botanical'
  | 'love'
  | 'celebration'
  | 'party'
  | 'elegant'
  | 'frame'
  | 'baby'
  | 'birthday'
  | 'graduation'
  | 'corporate';

/*
 * One drawn part of an ornament.
 *
 * The original library gave each shape a single path and a single colour, which
 * is why everything in it read as a line icon: a rose can only be a rose if the
 * petals, the centre and the leaves are different colours, and one path cannot
 * be three colours. Layers are what turn an icon into a sticker.
 *
 * `transform` earns its place — a wreath is one leaf placed twelve times, and
 * spelling out twelve rotated copies of the same bezier by hand is how the
 * geometry ends up subtly wrong in one of them.
 */
export type DecorationLayer = {
  path: string;
  /** Omitted means "take the element's colour", which keeps a shape tintable. */
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  /** SVG transform applied to this layer only, e.g. `translate(50,50) rotate(30)`. */
  transform?: string;
};

export type Decoration = {
  id: string;
  name: string;
  category: DecorationCategory;
  /** Single-path ornaments. Ignored when `layers` is present. */
  path?: string;
  /** Layered ornaments. Drawn in order, so later layers sit on top. */
  layers?: DecorationLayer[];
  color: string;
  /** Width divided by height. Used to size the element so nothing arrives squashed. */
  aspect: number;
  /** Shapes whose geometry does not sit inside the default box declare their own. */
  viewBox?: string;
  /*
   * Most of the single-path shapes are line drawings — a ring is two concentric
   * circles, a gift box is a lid and a ribbon. Filling them collapses every
   * interior detail into one silhouette, which is what the web build did and why
   * its ring came out as a plain disc. Outline is the default; only shapes that
   * really are a solid silhouette opt into a fill.
   */
  filled?: boolean;
  /** Line weight in the shape's own viewBox units. */
  strokeWidth?: number;
};

export const DECORATION_CATEGORY_LABELS: Record<DecorationCategory, string> = {
  baby: 'Bebek',
  birthday: 'Doğum günü',
  botanical: 'Botanik',
  celebration: 'Kutlama',
  corporate: 'Kurumsal',
  elegant: 'Zarif',
  frame: 'Çerçeve',
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

/*
 * Building blocks for the layered ornaments below.
 *
 * Each is drawn around its own origin, pointing up where it has a direction, so
 * a transform is all it takes to place one: `translate(x,y) rotate(a) scale(s)`.
 * Authoring every rosette and wreath as literal coordinates was tried first and
 * abandoned — twelve hand-written copies of one leaf is twelve chances to get a
 * control point wrong, and the one that is wrong is not obvious until it renders.
 */
const LEAF = 'M0,0 C-5.5,-3.5 -7,-11 0,-15 C7,-11 5.5,-3.5 0,0 Z';
const PETAL = 'M0,0 C-6.5,-5 -6.5,-14 0,-18 C6.5,-14 6.5,-5 0,0 Z';
const DISC = 'M-10,0 A10,10 0 1,0 10,0 A10,10 0 1,0 -10,0 Z';
const SPARK = 'M0,-12 C1.6,-4 4,-1.6 12,0 C4,1.6 1.6,4 0,12 C-1.6,4 -4,1.6 -12,0 C-4,-1.6 -1.6,-4 0,-12 Z';
const HEART = 'M0,10 C-12,1 -10,-9.5 -4,-9.5 C-1.6,-9.5 0,-7.4 0,-6 C0,-7.4 1.6,-9.5 4,-9.5 C10,-9.5 12,1 0,10 Z';
const STAR = 'M0,-11 L2.8,-3.6 L10.6,-3.4 L4.4,1.4 L6.6,9 L0,4.6 L-6.6,9 L-4.4,1.4 L-10.6,-3.4 L-2.8,-3.6 Z';
const CHIP = 'M-2,-5 L2,-5 L2,5 L-2,5 Z';

/** Places one primitive. Angles are degrees clockwise, scale defaults to life size. */
function at(path: string, fill: string, x: number, y: number, angle = 0, scale = 1, opacity?: number): DecorationLayer {
  return { fill, opacity, path, transform: `translate(${x},${y}) rotate(${angle}) scale(${scale})` };
}

/**
 * Arranges a primitive evenly around a centre, each copy turned to face outward.
 * The rightmost transform runs first, so the shape is pushed out to `radius`
 * along its own axis and then swung into place — which is what keeps a wreath's
 * leaves pointing away from the middle rather than all pointing up.
 */
function ring(
  path: string,
  fill: string,
  { centre = 50, count, radius, scale = 1, start = 0 }: { centre?: number; count: number; radius: number; scale?: number; start?: number },
): DecorationLayer[] {
  return Array.from({ length: count }, (_unused, index) => {
    const angle = start + (360 / count) * index;
    return {
      fill,
      path,
      transform: `translate(${centre},${centre}) rotate(${angle}) translate(0,${-radius}) scale(${scale})`,
    };
  });
}

/**
 * Fans a primitive out from a single point, the way petals leave a flower's
 * centre. Distinct from `ring`, where the copies stand off at a radius and the
 * middle stays empty.
 */
function rosette(
  path: string,
  fill: string,
  { centre, count, scale = 1, start = 0 }: { centre: [number, number]; count: number; scale?: number; start?: number },
): DecorationLayer[] {
  return Array.from({ length: count }, (_unused, index) => ({
    fill,
    path,
    transform: `translate(${centre[0]},${centre[1]}) rotate(${start + (360 / count) * index}) scale(${scale})`,
  }));
}

/** A stem drawn as a line rather than a silhouette. */
function stem(path: string, stroke: string, strokeWidth = 2): DecorationLayer {
  return { path, stroke, strokeWidth };
}

const SAGE = '#8FA98A';
const SAGE_LIGHT = '#B3C7AE';
const SAGE_DARK = '#5F7A5A';
const GOLD = '#C9A96A';
const GOLD_DEEP = '#A8843F';
const BLUSH = '#E8A0AE';
const BLUSH_DEEP = '#CE7488';
const CREAM = '#F4E7D3';

/*
 * The sticker set: layered, multi-colour ornaments of the sort a wedding or
 * birthday invitation is actually built from. Kept in a second list purely for
 * readability — they are concatenated into DECORATIONS below and are ordinary
 * entries in every other respect.
 */
const STICKERS: Decoration[] = [
  // BOTANICAL
  {
    id: 'eucalyptus_sprig',
    name: 'Okaliptüs dalı',
    category: 'botanical',
    color: SAGE,
    aspect: 0.5,
    viewBox: '0 0 100 100',
    layers: [
      stem('M53,98 C46,76 48,46 55,8', SAGE_DARK, 2.2),
      at(DISC, SAGE, 38, 86, 0, 0.62),
      at(DISC, SAGE_LIGHT, 66, 82, 0, 0.55),
      at(DISC, SAGE, 37, 70, 0, 0.58),
      at(DISC, SAGE_LIGHT, 67, 65, 0, 0.5),
      at(DISC, SAGE, 40, 54, 0, 0.52),
      at(DISC, SAGE_LIGHT, 66, 48, 0, 0.45),
      at(DISC, SAGE, 45, 37, 0, 0.44),
      at(DISC, SAGE_LIGHT, 63, 30, 0, 0.38),
      at(DISC, SAGE, 54, 17, 0, 0.34),
    ],
  },
  {
    id: 'rose_bloom',
    // Not "Gül" — the older single-path ornament already has that name, and two
    // identically labelled tiles in the picker are indistinguishable.
    name: 'Bahçe gülü',
    category: 'botanical',
    color: BLUSH,
    aspect: 0.85,
    viewBox: '0 0 100 100',
    layers: [
      stem('M50,58 L50,96', SAGE_DARK, 2.4),
      at(LEAF, SAGE, 50, 84, -58, 1.15),
      at(LEAF, SAGE_DARK, 50, 74, 58, 1),
      ...rosette(PETAL, BLUSH, { centre: [50, 42], count: 6, scale: 1.7 }),
      ...rosette(PETAL, BLUSH_DEEP, { centre: [50, 42], count: 5, scale: 1.1, start: 30 }),
      ...rosette(PETAL, CREAM, { centre: [50, 42], count: 4, scale: 0.6, start: 15 }),
      at(DISC, GOLD, 50, 42, 0, 0.3),
    ],
  },
  {
    id: 'floral_wreath',
    name: 'Çiçek çelengi',
    category: 'botanical',
    color: SAGE,
    aspect: 1,
    viewBox: '0 0 100 100',
    layers: [
      ...ring(LEAF, SAGE_DARK, { count: 12, radius: 30, scale: 1.05 }),
      ...ring(LEAF, SAGE_LIGHT, { count: 12, radius: 34, scale: 0.75, start: 15 }),
      at(DISC, BLUSH, 50, 16, 0, 0.4),
      at(DISC, BLUSH_DEEP, 27, 68, 0, 0.32),
      at(DISC, BLUSH, 73, 68, 0, 0.32),
    ],
  },
  {
    id: 'lavender_sprig',
    name: 'Lavanta',
    category: 'botanical',
    color: '#8E7BB5',
    aspect: 0.42,
    viewBox: '0 0 100 100',
    layers: [
      stem('M50,98 C48,76 50,54 52,32', SAGE_DARK, 2.2),
      at(LEAF, SAGE, 44, 88, -50, 0.9),
      at(LEAF, SAGE, 58, 80, 50, 0.9),
      // Buds are ovals rather than discs, and large enough to read as a flower
      // spike; at disc-scale 0.3 the whole sprig came out as a bare stick.
      { fill: '#8E7BB5', path: DISC, transform: 'translate(44,64) rotate(-18) scale(0.42,0.6)' },
      { fill: '#A594C7', path: DISC, transform: 'translate(57,58) rotate(18) scale(0.4,0.58)' },
      { fill: '#8E7BB5', path: DISC, transform: 'translate(45,50) rotate(-15) scale(0.4,0.56)' },
      { fill: '#A594C7', path: DISC, transform: 'translate(56,43) rotate(15) scale(0.38,0.54)' },
      { fill: '#8E7BB5', path: DISC, transform: 'translate(47,35) rotate(-12) scale(0.36,0.5)' },
      { fill: '#A594C7', path: DISC, transform: 'translate(54,27) rotate(12) scale(0.32,0.46)' },
      { fill: '#8E7BB5', path: DISC, transform: 'translate(51,17) scale(0.28,0.42)' },
    ],
  },
  {
    id: 'fern_frond',
    name: 'Eğrelti',
    category: 'botanical',
    color: SAGE_DARK,
    aspect: 0.45,
    viewBox: '0 0 100 100',
    layers: [
      stem('M50,98 C48,70 50,40 52,6', SAGE_DARK, 1.8),
      ...[86, 76, 66, 56, 46, 36, 26].flatMap((y, index) => {
        const scale = 0.85 - index * 0.09;
        return [
          at(LEAF, SAGE, 49, y, -68, scale),
          at(LEAF, SAGE_LIGHT, 51, y - 5, 68, scale),
        ];
      }),
    ],
  },
  {
    id: 'wildflower_bunch',
    name: 'Kır çiçekleri',
    category: 'botanical',
    color: BLUSH,
    aspect: 0.8,
    viewBox: '0 0 100 100',
    layers: [
      stem('M50,96 C44,74 36,56 30,34', SAGE_DARK, 1.8),
      stem('M50,96 C50,72 50,52 50,28', SAGE_DARK, 1.8),
      stem('M50,96 C56,74 64,56 70,36', SAGE_DARK, 1.8),
      at(LEAF, SAGE, 42, 76, -55, 0.95),
      at(LEAF, SAGE, 58, 72, 55, 0.95),
      ...rosette(PETAL, BLUSH, { centre: [28, 30], count: 5, scale: 0.95 }),
      ...rosette(PETAL, CREAM, { centre: [50, 22], count: 5, scale: 1.1 }),
      ...rosette(PETAL, BLUSH_DEEP, { centre: [72, 32], count: 5, scale: 0.95 }),
      at(DISC, GOLD, 28, 30, 0, 0.3),
      at(DISC, GOLD, 50, 22, 0, 0.34),
      at(DISC, GOLD, 72, 32, 0, 0.3),
    ],
  },

  // ELEGANT
  {
    id: 'laurel_gold',
    name: 'Altın defne',
    category: 'elegant',
    color: GOLD,
    aspect: 1,
    viewBox: '0 0 100 100',
    layers: [
      stem('M50,94 C30,84 20,62 24,34', GOLD_DEEP, 1.6),
      stem('M50,94 C70,84 80,62 76,34', GOLD_DEEP, 1.6),
      ...[
        [30, 82, -35], [25, 70, -25], [22, 58, -15], [22, 46, -8], [25, 35, 2],
      ].map(([x, y, angle]) => at(LEAF, GOLD, x, y, angle, 0.85)),
      ...[
        [70, 82, 35], [75, 70, 25], [78, 58, 15], [78, 46, 8], [75, 35, -2],
      ].map(([x, y, angle]) => at(LEAF, GOLD, x, y, angle, 0.85)),
      at(STAR, GOLD_DEEP, 50, 26, 0, 0.5),
    ],
  },
  {
    id: 'sparkle_trio',
    name: 'Işıltı',
    category: 'elegant',
    color: GOLD,
    aspect: 1,
    viewBox: '0 0 100 100',
    layers: [
      at(SPARK, GOLD, 38, 38, 0, 1.5),
      at(SPARK, GOLD_DEEP, 70, 28, 0, 0.85),
      at(SPARK, GOLD, 64, 68, 0, 1.05),
    ],
  },
  {
    id: 'divider_floral',
    name: 'Çiçekli ayraç',
    category: 'elegant',
    color: GOLD,
    aspect: 3.4,
    viewBox: '0 0 100 100',
    layers: [
      stem('M2,50 C20,50 28,42 40,42', GOLD_DEEP, 2),
      stem('M98,50 C80,50 72,42 60,42', GOLD_DEEP, 2),
      at(LEAF, SAGE, 20, 50, -78, 1.5),
      at(LEAF, SAGE_LIGHT, 30, 46, -70, 1.3),
      at(LEAF, SAGE, 80, 50, 78, 1.5),
      at(LEAF, SAGE_LIGHT, 70, 46, 70, 1.3),
      ...rosette(PETAL, BLUSH, { centre: [50, 42], count: 6, scale: 1.3 }),
      ...rosette(PETAL, BLUSH_DEEP, { centre: [50, 42], count: 5, scale: 0.7, start: 30 }),
      at(DISC, GOLD, 50, 42, 0, 0.32),
    ],
  },
  {
    id: 'corner_flourish',
    name: 'Köşe süsü',
    category: 'elegant',
    color: GOLD,
    aspect: 1,
    viewBox: '0 0 100 100',
    /*
     * Three sprigs fanned out of the corner. The first attempt drew two bezier
     * arcs and then placed leaves at hand-picked coordinates, which put them
     * near the curves rather than on them — it read as a swirl with debris
     * around it. Rotating each branch out of a shared origin means a leaf
     * offset sideways from the branch axis lands beside that branch by
     * construction, at any angle.
     */
    layers: [105, 135, 165].flatMap((angle) => {
      const from = `translate(6,6) rotate(${angle})`;
      return [
        { path: 'M0,0 L0,-62', stroke: SAGE_DARK, strokeWidth: 1.8, transform: from } as DecorationLayer,
        ...[[20, 0.6], [33, 0.55], [45, 0.48], [56, 0.4]].flatMap(([distance, scale], index) => [
          { fill: index % 2 ? SAGE : SAGE_LIGHT, path: DISC, transform: `${from} translate(6,${-distance}) scale(${scale})` },
          { fill: index % 2 ? SAGE_LIGHT : SAGE, path: DISC, transform: `${from} translate(-6,${-distance - 5}) scale(${scale * 0.9})` },
        ]),
      ];
    }).concat([
      at(DISC, GOLD, 8, 8, 0, 0.42),
      at(DISC, CREAM, 8, 8, 0, 0.2),
    ]),
  },

  // FRAME
  {
    id: 'arch_gold',
    name: 'Altın kemer',
    category: 'frame',
    color: GOLD,
    aspect: 0.68,
    viewBox: '0 0 100 100',
    layers: [
      { path: 'M16,96 L16,44 A34,34 0 0,1 84,44 L84,96', stroke: GOLD, strokeWidth: 2.6 },
      { path: 'M23,96 L23,45 A27,27 0 0,1 77,45 L77,96', opacity: 0.55, stroke: GOLD_DEEP, strokeWidth: 1.2 },
      at(LEAF, SAGE, 20, 92, -25, 0.9),
      at(LEAF, SAGE_LIGHT, 27, 96, -8, 0.8),
      at(LEAF, SAGE, 80, 92, 25, 0.9),
      at(LEAF, SAGE_LIGHT, 73, 96, 8, 0.8),
    ],
  },
  {
    id: 'frame_oval_leaf',
    name: 'Yapraklı çerçeve',
    category: 'frame',
    color: SAGE,
    aspect: 0.78,
    viewBox: '0 0 100 100',
    layers: [
      { path: 'M50,8 C74,8 88,26 88,50 C88,74 74,92 50,92 C26,92 12,74 12,50 C12,26 26,8 50,8 Z', stroke: GOLD, strokeWidth: 2 },
      ...ring(LEAF, SAGE, { count: 5, radius: 40, scale: 0.8, start: 200 }),
      ...ring(LEAF, SAGE_LIGHT, { count: 5, radius: 40, scale: 0.65, start: 210 }),
      at(DISC, BLUSH, 50, 90, 0, 0.3),
    ],
  },

  // CELEBRATION
  {
    id: 'balloon_cluster',
    name: 'Balon demeti',
    category: 'celebration',
    color: '#C0362C',
    aspect: 0.78,
    viewBox: '0 0 100 100',
    layers: [
      stem('M32,48 C36,66 28,80 40,98', '#8A8A8A', 1.2),
      stem('M56,40 C58,62 50,78 46,98', '#8A8A8A', 1.2),
      stem('M74,54 C76,70 62,84 52,98', '#8A8A8A', 1.2),
      { fill: '#C0362C', path: DISC, transform: 'translate(32,32) scale(1.55,1.85)' },
      { fill: '#1B3FA0', path: DISC, transform: 'translate(56,24) scale(1.55,1.85)' },
      { fill: GOLD, path: DISC, transform: 'translate(74,40) scale(1.4,1.7)' },
      { fill: '#97281F', path: 'M-3,0 L3,0 L0,5 Z', transform: 'translate(32,51)' },
      { fill: '#14307A', path: 'M-3,0 L3,0 L0,5 Z', transform: 'translate(56,43)' },
      { fill: GOLD_DEEP, path: 'M-3,0 L3,0 L0,5 Z', transform: 'translate(74,58)' },
    ],
  },
  {
    id: 'confetti_burst',
    name: 'Konfeti',
    category: 'party',
    color: '#C0362C',
    aspect: 1,
    viewBox: '0 0 100 100',
    layers: [
      at(CHIP, '#C0362C', 20, 24, 25, 1),
      at(CHIP, '#1B3FA0', 42, 14, -35, 0.9),
      at(CHIP, GOLD, 66, 22, 55, 1),
      at(CHIP, '#3F9D6D', 84, 38, -20, 0.85),
      at(CHIP, BLUSH, 14, 50, 70, 0.9),
      at(CHIP, '#1B3FA0', 34, 44, 10, 0.8),
      at(CHIP, GOLD, 58, 50, -60, 0.95),
      at(CHIP, '#C0362C', 80, 62, 30, 0.9),
      at(CHIP, '#3F9D6D', 24, 74, -45, 0.95),
      at(CHIP, BLUSH, 48, 78, 15, 0.85),
      at(CHIP, GOLD, 70, 86, -25, 0.9),
      at(DISC, '#1B3FA0', 30, 60, 0, 0.22),
      at(DISC, '#C0362C', 62, 36, 0, 0.2),
      at(DISC, GOLD, 88, 76, 0, 0.22),
    ],
  },
  {
    id: 'banner_ribbon',
    name: 'Kurdele afiş',
    category: 'party',
    color: '#C0362C',
    aspect: 2.1,
    viewBox: '0 0 100 100',
    layers: [
      { fill: '#97281F', path: 'M2,32 L20,38 L20,66 L2,72 L9,52 Z' },
      { fill: '#97281F', path: 'M98,32 L80,38 L80,66 L98,72 L91,52 Z' },
      { fill: '#C0362C', path: 'M20,34 L80,34 L80,70 L20,70 Z' },
      { fill: '#D9584E', opacity: 0.6, path: 'M20,34 L80,34 L80,44 L20,44 Z' },
    ],
  },
  {
    id: 'champagne_toast',
    name: 'Kadeh tokuşturma',
    category: 'celebration',
    color: GOLD,
    aspect: 1,
    viewBox: '0 0 100 100',
    layers: [
      // Bowls first, then the gold wine inside them, then the stems on top —
      // drawn small and pale the pair read as two grey trapezoids.
      { fill: CREAM, path: 'M0,0 L26,0 L20,34 L6,34 Z', transform: 'translate(14,20) rotate(-16)' },
      { fill: CREAM, path: 'M0,0 L26,0 L20,34 L6,34 Z', transform: 'translate(60,20) rotate(16)' },
      { fill: GOLD, path: 'M0,0 L26,0 L23,17 L3,17 Z', transform: 'translate(14,20) rotate(-16)' },
      { fill: GOLD, path: 'M0,0 L26,0 L23,17 L3,17 Z', transform: 'translate(60,20) rotate(16)' },
      stem('M28,54 L22,88 M12,90 L34,90', GOLD_DEEP, 2.4),
      stem('M72,54 L78,88 M66,90 L88,90', GOLD_DEEP, 2.4),
      at(SPARK, GOLD, 50, 12, 0, 0.7),
      at(DISC, GOLD, 38, 6, 0, 0.16),
      at(DISC, GOLD, 63, 4, 0, 0.13),
    ],
  },

  // LOVE
  {
    id: 'double_hearts',
    name: 'İkili kalp',
    category: 'love',
    color: BLUSH,
    aspect: 1.25,
    viewBox: '0 0 100 100',
    layers: [
      at(HEART, BLUSH_DEEP, 62, 52, 12, 2.1),
      at(HEART, BLUSH, 38, 46, -10, 2.6),
      at(SPARK, CREAM, 24, 22, 0, 0.55),
    ],
  },
  {
    id: 'heart_wreath',
    name: 'Kalpli çelenk',
    category: 'love',
    color: SAGE,
    aspect: 1,
    viewBox: '0 0 100 100',
    layers: [
      ...ring(LEAF, SAGE, { count: 14, radius: 34, scale: 0.85 }),
      ...ring(LEAF, SAGE_LIGHT, { count: 7, radius: 29, scale: 0.6, start: 12 }),
      at(HEART, BLUSH_DEEP, 50, 50, 0, 1.7),
    ],
  },

  // BABY
  {
    id: 'cloud_stars',
    name: 'Bulut ve yıldızlar',
    category: 'baby',
    color: '#BFD7EA',
    aspect: 1.15,
    viewBox: '0 0 100 100',
    layers: [
      { fill: '#BFD7EA', path: 'M22,70 C10,70 8,54 20,52 C20,36 42,32 48,44 C56,34 76,38 76,52 C88,52 90,70 78,70 Z' },
      { fill: '#DCEAF5', opacity: 0.8, path: 'M28,62 C22,62 21,54 28,53 C29,45 40,43 44,49 C49,44 59,46 59,53 Z' },
      at(STAR, GOLD, 22, 26, 0, 0.5),
      at(STAR, '#F2D98F', 46, 16, 0, 0.36),
      at(STAR, GOLD, 78, 28, 0, 0.44),
      at(STAR, '#F2D98F', 88, 84, 0, 0.32),
    ],
  },
  {
    id: 'moon_stars',
    name: 'Ay ve yıldız',
    category: 'baby',
    color: GOLD,
    aspect: 1,
    viewBox: '0 0 100 100',
    layers: [
      { fill: GOLD, path: 'M62,10 A40,40 0 1,0 62,90 A32,32 0 1,1 62,10 Z' },
      { fill: CREAM, opacity: 0.45, path: 'M58,20 A32,32 0 1,0 58,80 A26,26 0 1,1 58,20 Z' },
      at(STAR, GOLD_DEEP, 78, 24, 0, 0.42),
      at(STAR, GOLD, 88, 52, 0, 0.3),
      at(STAR, GOLD_DEEP, 76, 78, 0, 0.34),
    ],
  },
];

DECORATIONS.push(...STICKERS);

/**
 * The drawing instructions for one ornament, with the element's own colour
 * filled in wherever a layer did not insist on its own.
 *
 * Single-path shapes are normalised into a one-layer list here rather than being
 * special-cased at the point of drawing, so the renderer only knows about layers
 * and the two kinds of ornament cannot drift apart.
 */
export function decorationLayers(decoration: Decoration, color: string) {
  if (decoration.layers) {
    return decoration.layers.map((layer) => ({
      fill: layer.fill ?? (layer.stroke ? 'none' : color),
      opacity: layer.opacity ?? 1,
      path: layer.path,
      stroke: layer.stroke ?? 'none',
      strokeWidth: layer.strokeWidth ?? 0,
      transform: layer.transform,
    }));
  }

  if (!decoration.path) return [];

  return [{
    fill: decoration.filled ? color : 'none',
    opacity: 1,
    path: decoration.path,
    stroke: color,
    strokeWidth: decoration.filled ? 0 : decoration.strokeWidth ?? 2,
    transform: undefined,
  }];
}

const byId = new Map(DECORATIONS.map((decoration) => [decoration.id, decoration]));

export function findDecoration(shapeId: string | undefined): Decoration | null {
  return shapeId ? byId.get(shapeId) ?? null : null;
}

export const DECORATION_CATEGORIES = Array.from(
  new Set(DECORATIONS.map((decoration) => decoration.category)),
);
