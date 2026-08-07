/*
 * Where the invitation has to sit so an open panel never covers it.
 *
 * Kept apart from the editor screen because it is the only part of that screen
 * that is pure arithmetic, and it is arithmetic that fails quietly: an offset
 * with the wrong sign or a centre computed against the wrong box still renders
 * a plausible-looking canvas, just one that drifts under the panel on some
 * screen sizes and not others. Here it can be checked directly.
 *
 * All coordinates are in window space, because the panel is positioned against
 * the window rather than against the mat it has to avoid.
 */

/**
 * Shrinking past this stops being a preview and starts being a thumbnail. The
 * panel height cap should keep the fit well above it; reaching it means a panel
 * has grown too tall, not that the floor is doing its job.
 */
export const MIN_CANVAS_SCALE = 0.35;

export type CanvasFitInput = {
  /** Laid-out height of the canvas, before any scaling. */
  canvasHeight: number;
  /** Height of the mat the canvas is centred in. */
  matHeight: number;
  /** Top edge of the mat, in window coordinates. */
  matTop: number;
  /** Breathing room kept between the canvas and the mat's edges. */
  padding: number;
  /** Gap left between the canvas and the top of an open panel. */
  panelGap: number;
  /** Top edge of the open panel in window coordinates, or null when none is open. */
  sheetTop: number | null;
};

export type CanvasFit = {
  /** Vertical shift from the mat's centre, negative being upward. */
  offset: number;
  /** Uniform scale to apply about the canvas centre. */
  scale: number;
};

const IDENTITY: CanvasFit = { offset: 0, scale: 1 };

/**
 * Fits the canvas into the strip of mat an open panel leaves free, returning the
 * transform that puts it there. With no panel open the canvas already fits, so
 * the result is the identity transform.
 */
export function fitCanvas({ canvasHeight, matHeight, matTop, padding, panelGap, sheetTop }: CanvasFitInput): CanvasFit {
  if (canvasHeight <= 0 || matHeight <= 0) return IDENTITY;

  const top = matTop + padding;
  const bottom = Math.min(
    matTop + matHeight - padding,
    sheetTop === null ? Number.POSITIVE_INFINITY : sheetTop - panelGap,
  );
  const available = bottom - top;
  // A panel taller than the mat leaves nothing to fit into. Holding the canvas
  // still is the honest response: scaling towards zero would animate it into a
  // speck on the way to being covered anyway.
  if (available <= 0) return IDENTITY;

  return {
    offset: (top + bottom) / 2 - (matTop + matHeight / 2),
    scale: Math.max(MIN_CANVAS_SCALE, Math.min(1, available / canvasHeight)),
  };
}
