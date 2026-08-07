import { describe, expect, it } from 'vitest';

import { fitCanvas, MIN_CANVAS_SCALE } from '@/features/editor/canvas-fit';

// A mat that starts below a top bar and a canvas that already fits inside it,
// which is what the editor lays out before any panel opens.
const BASE = {
  canvasHeight: 500,
  matHeight: 600,
  matTop: 100,
  padding: 16,
  panelGap: 12,
  sheetTop: null,
};

describe('fitCanvas', () => {
  it('leaves the canvas alone when no panel is open', () => {
    expect(fitCanvas(BASE)).toEqual({ offset: 0, scale: 1 });
  });

  it('does not enlarge a canvas that is smaller than the mat', () => {
    expect(fitCanvas({ ...BASE, canvasHeight: 200 }).scale).toBe(1);
  });

  it('lifts and shrinks the canvas into the strip a panel leaves', () => {
    // Mat spans 100..700; the panel starts at 500, so the free strip is
    // 116..488 — 372 tall, centred on 302 rather than the mat's centre of 400.
    const fit = fitCanvas({ ...BASE, sheetTop: 500 });

    expect(fit.scale).toBeCloseTo(372 / 500, 5);
    expect(fit.offset).toBeCloseTo(-98, 5);
  });

  it('moves the canvas up, never down', () => {
    expect(fitCanvas({ ...BASE, sheetTop: 500 }).offset).toBeLessThan(0);
  });

  it('keeps the scaled canvas inside the free strip', () => {
    const sheetTop = 460;
    const fit = fitCanvas({ ...BASE, sheetTop });
    const centre = BASE.matTop + BASE.matHeight / 2 + fit.offset;
    const scaledBottom = centre + (BASE.canvasHeight * fit.scale) / 2;

    expect(scaledBottom).toBeLessThanOrEqual(sheetTop - BASE.panelGap);
    expect(centre - (BASE.canvasHeight * fit.scale) / 2).toBeGreaterThanOrEqual(BASE.matTop + BASE.padding);
  });

  it('ignores a panel that starts below the mat', () => {
    // The mat ends at 700, so a panel at 900 constrains nothing.
    expect(fitCanvas({ ...BASE, sheetTop: 900 })).toEqual({ offset: 0, scale: 1 });
  });

  it('will not shrink the invitation past the legibility floor', () => {
    expect(fitCanvas({ ...BASE, sheetTop: 200 }).scale).toBe(MIN_CANVAS_SCALE);
  });

  it('holds still when a panel covers the mat entirely', () => {
    expect(fitCanvas({ ...BASE, sheetTop: 100 })).toEqual({ offset: 0, scale: 1 });
  });

  it('holds still before the mat has been measured', () => {
    expect(fitCanvas({ ...BASE, matHeight: 0, sheetTop: 500 })).toEqual({ offset: 0, scale: 1 });
    expect(fitCanvas({ ...BASE, canvasHeight: 0, sheetTop: 500 })).toEqual({ offset: 0, scale: 1 });
  });
});
