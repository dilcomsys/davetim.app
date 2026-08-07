import { describe, expect, it } from 'vitest';

import {
  handleAnchors,
  MIN_HEIGHT,
  MIN_WIDTH,
  normalizeRotation,
  resizeFromCorner,
  ROTATION_HANDLE_GAP,
  rotateFromHandle,
  type TransformBox,
} from '@/features/editor/element-transform';

// Deliberately not square: a canvas where one horizontal percent and one
// vertical percent are the same number of pixels would hide every place the two
// axes are confused for each other.
const CANVAS = { height: 1000, width: 500 };

// Centred, 20% x 10% — 100 x 100 pixels on the canvas above, so an unrotated
// element's corners land on round numbers.
const BOX: TransformBox = {
  position: { x: 50, y: 50 },
  rotation: 0,
  size: { height: 10, width: 20 },
};

describe('handleAnchors', () => {
  it('puts the corners on the element box', () => {
    const anchors = handleAnchors(BOX, CANVAS);

    expect(anchors.topLeft).toEqual({ x: 200, y: 450 });
    expect(anchors.bottomRight).toEqual({ x: 300, y: 550 });
  });

  it('floats the rotation handle above the top edge', () => {
    const anchors = handleAnchors(BOX, CANVAS);

    expect(anchors.tether).toEqual({ x: 250, y: 450 });
    expect(anchors.rotation).toEqual({ x: 250, y: 450 - ROTATION_HANDLE_GAP });
  });

  it('can hang the rotation handle underneath instead', () => {
    const anchors = handleAnchors(BOX, CANVAS, 'below');

    expect(anchors.tether).toEqual({ x: 250, y: 550 });
    expect(anchors.rotation).toEqual({ x: 250, y: 550 + ROTATION_HANDLE_GAP });
    // The corners are unaffected by where the rotation handle went.
    expect(anchors.topLeft).toEqual({ x: 200, y: 450 });
  });

  it('carries the handles around with the element', () => {
    const anchors = handleAnchors({ ...BOX, rotation: 90 }, CANVAS);

    // A quarter turn clockwise puts the top-left corner where the bottom-left was.
    expect(anchors.topLeft.x).toBeCloseTo(250 + 50, 5);
    expect(anchors.topLeft.y).toBeCloseTo(500 - 50, 5);
    expect(anchors.rotation.x).toBeCloseTo(250 + 50 + ROTATION_HANDLE_GAP, 5);
    expect(anchors.rotation.y).toBeCloseTo(500, 5);
  });
});

describe('resizeFromCorner', () => {
  it('grows towards the drag and holds the opposite corner still', () => {
    const result = resizeFromCorner({ box: BOX, canvas: CANVAS, corner: 'bottomRight', delta: { x: 50, y: 100 } });

    // 100px wider on a 500px canvas is 20 more percent; 100px taller on 1000px is 10.
    expect(result.size.width).toBeCloseTo(30, 5);
    expect(result.size.height).toBeCloseTo(20, 5);

    const anchors = handleAnchors({ ...BOX, ...result }, CANVAS);
    expect(anchors.topLeft.x).toBeCloseTo(200, 5);
    expect(anchors.topLeft.y).toBeCloseTo(450, 5);
  });

  it('holds the opposite corner for every corner', () => {
    const opposites = {
      bottomLeft: 'topRight',
      bottomRight: 'topLeft',
      topLeft: 'bottomRight',
      topRight: 'bottomLeft',
    } as const;

    for (const [corner, opposite] of Object.entries(opposites)) {
      const before = handleAnchors(BOX, CANVAS)[opposite];
      const result = resizeFromCorner({
        box: BOX,
        canvas: CANVAS,
        corner: corner as keyof typeof opposites,
        delta: { x: 30, y: 40 },
      });
      const after = handleAnchors({ ...BOX, ...result }, CANVAS)[opposite];

      expect(after.x).toBeCloseTo(before.x, 5);
      expect(after.y).toBeCloseTo(before.y, 5);
    }
  });

  it('reads the drag in the element frame when it is rotated', () => {
    const rotated = { ...BOX, rotation: 90 };
    // A quarter turn clockwise leaves the element's own width axis pointing down
    // the screen, so a downward drag lengthens the width and leaves the height
    // untouched. The element is 100px square here, so only the frame can explain
    // which measurement moved.
    const result = resizeFromCorner({ box: rotated, canvas: CANVAS, corner: 'bottomRight', delta: { x: 0, y: 100 } });

    expect(result.size.width).toBeCloseTo(40, 5);
    expect(result.size.height).toBeCloseTo(10, 5);
  });

  it('shortens the same axis when that drag is reversed', () => {
    const rotated = { ...BOX, rotation: 90 };
    const result = resizeFromCorner({ box: rotated, canvas: CANVAS, corner: 'bottomRight', delta: { x: 0, y: -100 } });

    // The corner has been pulled the element's whole width back onto its anchor.
    expect(result.size.width).toBe(MIN_WIDTH);
    expect(result.size.height).toBeCloseTo(10, 5);
  });

  it('still holds the anchor when the element is rotated', () => {
    const rotated = { ...BOX, rotation: 33 };
    const before = handleAnchors(rotated, CANVAS).topLeft;
    const result = resizeFromCorner({ box: rotated, canvas: CANVAS, corner: 'bottomRight', delta: { x: 20, y: 60 } });
    const after = handleAnchors({ ...rotated, ...result }, CANVAS).topLeft;

    expect(after.x).toBeCloseTo(before.x, 5);
    expect(after.y).toBeCloseTo(before.y, 5);
  });

  it('clamps rather than flipping when dragged past the anchor', () => {
    const result = resizeFromCorner({ box: BOX, canvas: CANVAS, corner: 'bottomRight', delta: { x: -400, y: -400 } });

    expect(result.size.width).toBe(MIN_WIDTH);
    expect(result.size.height).toBe(MIN_HEIGHT);
  });

  it('keeps the anchor exact after clamping', () => {
    const before = handleAnchors(BOX, CANVAS).topLeft;
    const result = resizeFromCorner({ box: BOX, canvas: CANVAS, corner: 'bottomRight', delta: { x: -400, y: -400 } });
    const after = handleAnchors({ ...BOX, ...result }, CANVAS).topLeft;

    expect(after.x).toBeCloseTo(before.x, 5);
    expect(after.y).toBeCloseTo(before.y, 5);
  });

  it('does not exceed the canvas', () => {
    const result = resizeFromCorner({ box: BOX, canvas: CANVAS, corner: 'bottomRight', delta: { x: 5000, y: 5000 } });

    expect(result.size.width).toBe(100);
    expect(result.size.height).toBe(100);
    expect(result.position.x).toBeLessThanOrEqual(100);
    expect(result.position.y).toBeLessThanOrEqual(100);
  });

  it('holds still before the canvas has been measured', () => {
    const result = resizeFromCorner({
      box: BOX,
      canvas: { height: 0, width: 0 },
      corner: 'bottomRight',
      delta: { x: 40, y: 40 },
    });

    expect(result).toEqual({ position: BOX.position, size: BOX.size });
  });
});

describe('rotateFromHandle', () => {
  it('follows the finger around the centre', () => {
    // The handle starts directly above the centre. Carrying it round to the
    // element's right-hand side is a quarter turn.
    const start = handleAnchors(BOX, CANVAS).rotation;
    const turned = handleAnchors({ ...BOX, rotation: 90 }, CANVAS).rotation;

    const result = rotateFromHandle({
      box: BOX,
      canvas: CANVAS,
      delta: { x: turned.x - start.x, y: turned.y - start.y },
    });

    expect(result).toBe(90);
  });

  it('snaps onto the square angles a hand cannot hit exactly', () => {
    const { rotation } = handleAnchors(BOX, CANVAS);
    const reach = 500 - rotation.y;
    // Two pixels shy of a clean quarter turn.
    const result = rotateFromHandle({ box: BOX, canvas: CANVAS, delta: { x: reach, y: reach - 2 } });

    expect(result).toBe(90);
  });

  it('leaves angles between the snap points alone', () => {
    // Placed by hand a fifth of a turn round, well outside the snap tolerance.
    const start = handleAnchors(BOX, CANVAS).rotation;
    const turned = handleAnchors({ ...BOX, rotation: 20 }, CANVAS).rotation;

    const result = rotateFromHandle({
      box: BOX,
      canvas: CANVAS,
      delta: { x: turned.x - start.x, y: turned.y - start.y },
    });

    expect(result).toBe(20);
  });

  it('adds to the rotation the element already had', () => {
    const spun = { ...BOX, rotation: 45 };
    const start = handleAnchors(spun, CANVAS).rotation;
    // Move the handle to where a further quarter turn would put it.
    const turned = handleAnchors({ ...spun, rotation: 135 }, CANVAS).rotation;

    const result = rotateFromHandle({
      box: spun,
      canvas: CANVAS,
      delta: { x: turned.x - start.x, y: turned.y - start.y },
    });

    expect(result).toBe(135);
  });

  it('stays within a single turn', () => {
    const spun = { ...BOX, rotation: 170 };
    const turned = handleAnchors({ ...spun, rotation: 260 }, CANVAS).rotation;
    const start = handleAnchors(spun, CANVAS).rotation;

    const result = rotateFromHandle({
      box: spun,
      canvas: CANVAS,
      delta: { x: turned.x - start.x, y: turned.y - start.y },
    });

    expect(result).toBe(-100);
  });

  it('measures from the underside when the handle hangs there', () => {
    const start = handleAnchors(BOX, CANVAS, 'below').rotation;
    const turned = handleAnchors({ ...BOX, rotation: 90 }, CANVAS, 'below').rotation;

    const result = rotateFromHandle({
      box: BOX,
      canvas: CANVAS,
      delta: { x: turned.x - start.x, y: turned.y - start.y },
      placement: 'below',
    });

    expect(result).toBe(90);
  });

  it('reads the same drag differently depending on the side', () => {
    // The identical finger movement means the opposite turn when the handle it
    // started from was on the other side of the element.
    const delta = { x: 40, y: 30 };
    const above = rotateFromHandle({ box: BOX, canvas: CANVAS, delta, placement: 'above' });
    const below = rotateFromHandle({ box: BOX, canvas: CANVAS, delta, placement: 'below' });

    expect(above).not.toBe(below);
  });

  it('holds still before the canvas has been measured', () => {
    expect(rotateFromHandle({ box: BOX, canvas: { height: 0, width: 0 }, delta: { x: 40, y: 0 } })).toBe(BOX.rotation);
  });
});

describe('normalizeRotation', () => {
  it('brings angles into a single turn', () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(180)).toBe(180);
    expect(normalizeRotation(190)).toBe(-170);
    expect(normalizeRotation(-190)).toBe(170);
    expect(normalizeRotation(540)).toBe(180);
  });
});
