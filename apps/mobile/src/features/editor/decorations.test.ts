import { describe, expect, it } from 'vitest';

import {
  DECORATION_CATEGORY_LABELS,
  DECORATIONS,
  decorationLayers,
  findDecoration,
} from '@/features/editor/decorations';

const TINT = '#123456';

describe('the decoration library', () => {
  it('has no duplicate ids', () => {
    const ids = DECORATIONS.map((decoration) => decoration.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every ornament something to draw', () => {
    for (const decoration of DECORATIONS) {
      expect(decorationLayers(decoration, TINT).length, decoration.id).toBeGreaterThan(0);
    }
  });

  it('gives every ornament a usable aspect and a label for its category', () => {
    for (const decoration of DECORATIONS) {
      expect(decoration.aspect, decoration.id).toBeGreaterThan(0);
      expect(DECORATION_CATEGORY_LABELS[decoration.category], decoration.id).toBeTruthy();
    }
  });

  it('draws nothing invisible', () => {
    // A layer with no fill and no stroke width renders as a blank — the shape is
    // in the data, costs a draw call and shows nothing.
    for (const decoration of DECORATIONS) {
      for (const [index, layer] of decorationLayers(decoration, TINT).entries()) {
        const visible = layer.fill !== 'none' || (layer.stroke !== 'none' && layer.strokeWidth > 0);
        expect(visible, `${decoration.id} layer ${index}`).toBe(true);
      }
    }
  });

  it('starts every path with a move command', () => {
    for (const decoration of DECORATIONS) {
      for (const [index, layer] of decorationLayers(decoration, TINT).entries()) {
        expect(layer.path.trimStart().startsWith('M'), `${decoration.id} layer ${index}`).toBe(true);
      }
    }
  });

  it('closes every filled subpath, so nothing renders as a torn silhouette', () => {
    /*
     * A filled subpath that neither says `Z` nor returns to where it started is
     * closed by the renderer along a straight line to the start point — so it
     * draws, but with an edge nobody designed. Checking for a trailing `Z` alone
     * would be wrong: SVG closes subpaths implicitly when filling, and several
     * of the older ornaments are built from petals that simply curve home.
     */
    for (const decoration of DECORATIONS) {
      for (const [index, layer] of decorationLayers(decoration, TINT).entries()) {
        if (layer.fill === 'none') continue;

        for (const subpath of layer.path.split(/(?=[Mm])/).filter((part) => part.trim())) {
          if (/[zZ]/.test(subpath)) continue;

          const numbers = subpath.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
          expect(numbers.length, `${decoration.id} layer ${index}`).toBeGreaterThanOrEqual(4);

          const startsAt = numbers.slice(0, 2);
          const endsAt = numbers.slice(-2);
          const returnsHome = Math.hypot(endsAt[0] - startsAt[0], endsAt[1] - startsAt[1]) < 0.01;

          expect(returnsHome, `${decoration.id} layer ${index}: "${subpath.trim()}"`).toBe(true);
        }
      }
    }
  });
});

describe('decorationLayers', () => {
  it('tints a single-path outline with the element colour', () => {
    const ring = findDecoration('ring_gold');
    const [layer] = decorationLayers(ring!, TINT);

    expect(layer.stroke).toBe(TINT);
    expect(layer.fill).toBe('none');
    expect(layer.strokeWidth).toBeGreaterThan(0);
  });

  it('fills a single-path silhouette with the element colour', () => {
    const heart = findDecoration('heart_red');
    const [layer] = decorationLayers(heart!, TINT);

    expect(layer.fill).toBe(TINT);
  });

  it('keeps a sticker layer’s own colour rather than tinting it', () => {
    const rose = findDecoration('rose_bloom');
    const layers = decorationLayers(rose!, TINT);

    expect(layers.some((layer) => layer.fill === TINT)).toBe(false);
    expect(layers.some((layer) => layer.fill !== 'none')).toBe(true);
  });

  it('treats a stroked layer as an outline rather than filling it', () => {
    const sprig = findDecoration('eucalyptus_sprig');
    const stemLayer = decorationLayers(sprig!, TINT).find((layer) => layer.stroke !== 'none');

    expect(stemLayer?.fill).toBe('none');
  });

  it('returns nothing for an ornament that is neither', () => {
    expect(decorationLayers({ aspect: 1, category: 'wedding', color: '#000', id: 'x', name: 'x' }, TINT)).toEqual([]);
  });
});

describe('findDecoration', () => {
  it('finds every ornament by its own id', () => {
    for (const decoration of DECORATIONS) {
      expect(findDecoration(decoration.id)?.id).toBe(decoration.id);
    }
  });

  it('returns null for an unknown or missing id', () => {
    expect(findDecoration('nope')).toBeNull();
    expect(findDecoration(undefined)).toBeNull();
  });
});
