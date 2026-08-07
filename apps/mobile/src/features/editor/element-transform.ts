/*
 * Geometry for dragging an element's own handles on the canvas.
 *
 * Two coordinate systems meet here and mixing them is the whole difficulty.
 * The document stores position and size as percentages of a canvas that is
 * taller than it is wide, so one horizontal percent is a different number of
 * pixels from one vertical percent. Rotation, meanwhile, happens in pixel space:
 * it is what the eye sees, and rotating a percentage pair would shear the
 * element instead of turning it. Everything below converts to pixels, does the
 * work there, and converts back at the end.
 *
 * Pure so the arithmetic can be checked without a touch screen — a resize that
 * drifts a few percent per gesture, or a rotation that is subtly wrong only for
 * already-rotated elements, is invisible in a screenshot and obvious in a test.
 */

export type Corner = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
export type Point = { x: number; y: number };
export type CanvasSize = { height: number; width: number };

/** The part of an element this module cares about, in document percentages. */
export type TransformBox = {
  position: Point;
  /** Degrees, clockwise. */
  rotation: number;
  size: { height: number; width: number };
};

/** Matches the floors the panel's steppers enforce, so the two agree. */
export const MIN_WIDTH = 5;
export const MIN_HEIGHT = 2;

/** How far the rotation handle floats off the element's edge, in pixels. */
export const ROTATION_HANDLE_GAP = 34;

/**
 * Which side of the element the rotation handle hangs from. The canvas clips to
 * its own bounds, so an element near the top has no room above it and the handle
 * has to swap sides or be invisible — and a rotation handle you cannot reach is
 * the same as not having one.
 */
export type RotationPlacement = 'above' | 'below';

/** The handle's resting place in the element's own frame. */
function rotationOffset(halfHeight: number, placement: RotationPlacement): Point {
  const distance = halfHeight + ROTATION_HANDLE_GAP;
  return { x: 0, y: placement === 'above' ? -distance : distance };
}

/**
 * Rotations land on a multiple of this when the finger comes within
 * ROTATION_SNAP_TOLERANCE of one. Upright and square-on are what people are
 * almost always reaching for, and hitting them exactly by hand on a phone is
 * luck rather than skill.
 */
const ROTATION_SNAP_STEP = 45;
const ROTATION_SNAP_TOLERANCE = 3;

const SIGNS: Record<Corner, { sx: number; sy: number }> = {
  bottomLeft: { sx: -1, sy: 1 },
  bottomRight: { sx: 1, sy: 1 },
  topLeft: { sx: -1, sy: -1 },
  topRight: { sx: 1, sy: -1 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Rotates a pixel offset clockwise by `degrees`, matching the CSS transform. */
function rotate(point: Point, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}

/** Centre and half-extents of the element, in canvas pixels. */
function toPixels(box: TransformBox, canvas: CanvasSize) {
  return {
    cx: (box.position.x / 100) * canvas.width,
    cy: (box.position.y / 100) * canvas.height,
    halfHeight: (box.size.height / 200) * canvas.height,
    halfWidth: (box.size.width / 200) * canvas.width,
  };
}

/** Brings any angle into (-180, 180] so the stepper and the handle agree. */
export function normalizeRotation(degrees: number) {
  const wrapped = ((degrees % 360) + 360) % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped;
}

function snapRotation(degrees: number) {
  const nearest = Math.round(degrees / ROTATION_SNAP_STEP) * ROTATION_SNAP_STEP;
  if (Math.abs(degrees - nearest) <= ROTATION_SNAP_TOLERANCE) return normalizeRotation(nearest);
  return normalizeRotation(Math.round(degrees));
}

/**
 * Where each handle sits, in pixels relative to the canvas's top-left. Corners
 * follow the element's rotation, so the handles stay on the corners they name
 * however far the element has been turned.
 */
export function handleAnchors(box: TransformBox, canvas: CanvasSize, placement: RotationPlacement = 'above') {
  const { cx, cy, halfHeight, halfWidth } = toPixels(box, canvas);
  const place = (local: Point) => {
    const turned = rotate(local, box.rotation);
    return { x: cx + turned.x, y: cy + turned.y };
  };

  return {
    bottomLeft: place({ x: -halfWidth, y: halfHeight }),
    bottomRight: place({ x: halfWidth, y: halfHeight }),
    /** Where the rotation handle's tether meets the element. */
    tether: place({ x: 0, y: placement === 'above' ? -halfHeight : halfHeight }),
    topLeft: place({ x: -halfWidth, y: -halfHeight }),
    topRight: place({ x: halfWidth, y: -halfHeight }),
    rotation: place(rotationOffset(halfHeight, placement)),
  };
}

/**
 * Resizes by dragging one corner, holding the opposite corner still — the
 * behaviour a corner handle implies, as against growing about the centre, which
 * makes the element appear to slide away from the finger.
 *
 * `delta` is the gesture's total translation in pixels since it began, and `box`
 * is the element as it was at that moment; both together describe the drag, so
 * the result does not accumulate rounding the way per-frame deltas would.
 *
 * Dragging a corner past its anchor clamps rather than flips: an element mirrored
 * mid-gesture is almost never what was meant, and the model has no way to record
 * it anyway.
 */
export function resizeFromCorner({
  box,
  canvas,
  corner,
  delta,
}: {
  box: TransformBox;
  canvas: CanvasSize;
  corner: Corner;
  delta: Point;
}): { position: Point; size: { height: number; width: number } } {
  if (canvas.width <= 0 || canvas.height <= 0) return { position: box.position, size: box.size };

  const { cx, cy, halfHeight, halfWidth } = toPixels(box, canvas);
  const { sx, sy } = SIGNS[corner];

  const anchorOffset = rotate({ x: -sx * halfWidth, y: -sy * halfHeight }, box.rotation);
  const anchor = { x: cx + anchorOffset.x, y: cy + anchorOffset.y };

  const draggedOffset = rotate({ x: sx * halfWidth, y: sy * halfHeight }, box.rotation);
  const dragged = { x: cx + draggedOffset.x + delta.x, y: cy + draggedOffset.y + delta.y };

  // Back into the element's own frame, where the diagonal is axis-aligned and
  // its components are simply the new width and height.
  const diagonal = rotate({ x: dragged.x - anchor.x, y: dragged.y - anchor.y }, -box.rotation);

  const width = clamp(((diagonal.x * sx) / canvas.width) * 100, MIN_WIDTH, 100);
  const height = clamp(((diagonal.y * sy) / canvas.height) * 100, MIN_HEIGHT, 100);

  // Re-derived from the clamped percentages rather than the raw drag, so the
  // anchor still holds exactly once a floor has been hit.
  const newHalfWidth = (width / 200) * canvas.width;
  const newHalfHeight = (height / 200) * canvas.height;
  const centreOffset = rotate({ x: sx * newHalfWidth, y: sy * newHalfHeight }, box.rotation);

  return {
    position: {
      x: clamp(((anchor.x + centreOffset.x) / canvas.width) * 100, 0, 100),
      y: clamp(((anchor.y + centreOffset.y) / canvas.height) * 100, 0, 100),
    },
    size: { height, width },
  };
}

/**
 * Turns the element by dragging the handle above it. The angle is measured from
 * the centre to the handle, so the element follows the finger around rather than
 * responding to how far it travelled.
 */
export function rotateFromHandle({
  box,
  canvas,
  delta,
  placement = 'above',
}: {
  box: TransformBox;
  canvas: CanvasSize;
  delta: Point;
  /** Must match the side the handle was drawn on, or the result is half a turn out. */
  placement?: RotationPlacement;
}): number {
  if (canvas.width <= 0 || canvas.height <= 0) return box.rotation;

  const { halfHeight } = toPixels(box, canvas);
  const start = rotate(rotationOffset(halfHeight, placement), box.rotation);
  const current = { x: start.x + delta.x, y: start.y + delta.y };

  // A finger dragged exactly onto the centre leaves no direction to read.
  if (current.x === 0 && current.y === 0) return box.rotation;

  const swept = Math.atan2(current.y, current.x) - Math.atan2(start.y, start.x);
  return snapRotation(box.rotation + (swept * 180) / Math.PI);
}
