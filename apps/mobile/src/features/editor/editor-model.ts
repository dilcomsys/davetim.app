import type { Invitation, InvitationTemplate, JsonObject, PublicInvitation } from '@/domain/models';
import { findDecoration } from '@/features/editor/decorations';

export type EditorElementType = 'text' | 'image' | 'decoration' | 'divider';
export type TextAlignment = 'left' | 'center' | 'right';

/**
 * The canvas is taller than it is wide, so a shape sized only by its width
 * percentage comes out stretched. Everything that converts a shape's own aspect
 * into canvas percentages goes through this. Kept in step with the canvas's
 * `aspectRatio` style.
 */
export const CANVAS_ASPECT = 0.72;

export type EditorElement = {
  id: string;
  type: EditorElementType;
  name: string;
  content?: string;
  imageUrl?: string;
  /** Identifies a vector ornament from the decoration library. */
  shapeId?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  style: {
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    color?: string;
    textAlign?: TextAlignment;
    fontStyle?: string;
    textDecoration?: string;
  };
};

export type EditorColors = {
  background: string;
  text: string;
  accent: string;
  primary: string;
  secondary: string;
};

export type EditorDocument = {
  title: string;
  eventDate: string;
  eventTime: string;
  locationName: string;
  locationAddress: string;
  customMessage: string;
  imageUrl: string | null;
  colors: EditorColors;
  elements: EditorElement[];
  showQrOnDesign: boolean;
  /*
   * How strongly the background colour veils the background photo, 0–1.
   * The seeded templates pair near-black text with a dark photograph, because
   * the web editor always laid its palette over the image at 80% and the text
   * colours were picked against that, not against the photo. Without a veil the
   * template opens as an unreadable design; with one it reads as intended, and
   * anyone who wants the bare photograph can take it back to zero.
   */
  backgroundVeil: number;
};

const defaultColors: EditorColors = {
  accent: '#C0362C',
  background: '#FAF8F3',
  primary: '#142E77',
  secondary: '#1B3FA0',
  text: '#171A2B',
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function finite(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function alignment(value: unknown): TextAlignment {
  return value === 'left' || value === 'right' ? value : 'center';
}

function element(value: unknown, index: number): EditorElement | null {
  const source = record(value);
  if (!source) return null;
  const rawType = source.type;
  const type: EditorElementType = rawType === 'image' || rawType === 'decoration' || rawType === 'divider' ? rawType : 'text';
  const position = record(source.position);
  const size = record(source.size);
  const style = record(source.style);

  return {
    id: text(source.id, `element-${index}`),
    type,
    name: text(source.name, type === 'text' ? 'Metin' : 'Öğe'),
    content: typeof source.content === 'string' ? source.content : undefined,
    imageUrl: typeof source.imageUrl === 'string' ? source.imageUrl : undefined,
    shapeId: typeof source.shapeId === 'string' ? source.shapeId : undefined,
    position: {
      x: clamp(finite(position?.x, 50), 0, 100),
      y: clamp(finite(position?.y, 50), 0, 100),
    },
    size: {
      width: clamp(finite(size?.width, type === 'text' ? 80 : 30), 2, 100),
      height: clamp(finite(size?.height, type === 'text' ? 12 : 20), 1, 100),
    },
    rotation: clamp(finite(source.rotation, 0), -180, 180),
    opacity: clamp(finite(source.opacity, 1), 0, 1),
    visible: source.visible !== false,
    locked: source.locked === true,
    zIndex: finite(source.zIndex, index + 1),
    style: {
      color: text(style?.color, defaultColors.text),
      fontFamily: text(style?.fontFamily, 'Georgia'),
      fontSize: clamp(finite(style?.fontSize, 24), 8, 96),
      fontStyle: text(style?.fontStyle, 'normal'),
      fontWeight: text(style?.fontWeight, 'normal'),
      textAlign: alignment(style?.textAlign),
      textDecoration: text(style?.textDecoration, 'none'),
    },
  };
}

/*
 * The seeded templates describe each field's wording and styling but carry no
 * coordinates — the web editor laid them out itself. Reading a missing position
 * as the default centre put every field on the same spot, so opening a template
 * showed one illegible pile rather than the design the gallery advertises.
 *
 * A field is placed under the previous one, with the band's height taken from
 * its point size so a 44pt couple's name is not given the same strip as a 14pt
 * line. Any field that does bring coordinates keeps them.
 */
function stackedPosition(fontSize: number, cursor: number) {
  const height = fontSize >= 32 ? 17 : fontSize >= 20 ? 13 : 11;
  return { cursor: cursor + height + 3, height, y: Math.min(94, cursor + height / 2) };
}

function templateTextElements(template: InvitationTemplate): EditorElement[] {
  let cursor = 16;

  return template.textFields.map((field, index) => {
    const source = record(field) ?? {};
    const style = record(source.style);
    const saved = record(source.position);
    const band = stackedPosition(finite(style?.fontSize, 16), cursor);
    cursor = band.cursor;
    const savedSize = record(source.size);

    return element({
      id: text(source.id, `template-text-${index}`),
      type: 'text',
      name: text(source.label, 'Metin'),
      content: text(source.defaultValue, text(source.placeholder, 'Metin')),
      position: saved ?? { x: 50, y: band.y },
      size: savedSize ?? { width: 80, height: band.height },
      zIndex: index + 10,
      style,
    }, index);
  }).filter((item): item is EditorElement => item !== null);
}

function templateElements(template: InvitationTemplate | null): EditorElement[] {
  if (!template) return [];

  // Ornaments are stored element-shaped already, and were being dropped
  // entirely: a template's flourishes never made it onto the mobile canvas.
  const decorations = template.decorativeElements
    .map((item, index) => {
      const source = record(item);
      if (!source) return null;
      return element({ name: 'Süsleme', ...source, type: text(source.type, 'decoration') }, index);
    })
    .filter((item): item is EditorElement => item !== null);

  return [...templateTextElements(template), ...decorations];
}

function colorsFrom(source: unknown, template: InvitationTemplate | null): EditorColors {
  const contentColors = record(source);
  const templateColors = template?.colorPalette ?? {};
  return {
    accent: text(contentColors?.accent, text(templateColors.accent, defaultColors.accent)),
    background: text(contentColors?.background, text(templateColors.background, defaultColors.background)),
    primary: text(contentColors?.primary, text(templateColors.primary, defaultColors.primary)),
    secondary: text(contentColors?.secondary, text(templateColors.secondary, defaultColors.secondary)),
    text: text(contentColors?.text, text(templateColors.text, defaultColors.text)),
  };
}

export function createEditorDocument(invitation: Invitation | PublicInvitation | null, template: InvitationTemplate | null): EditorDocument {
  const content = invitation?.content ?? {};
  const settings = invitation?.settings ?? {};
  const savedElements = [
    ...(Array.isArray(content.textElements) ? content.textElements : []),
    ...(Array.isArray(content.decorativeElements) ? content.decorativeElements : []),
  ].map(element).filter((item): item is EditorElement => item !== null);

  const imageUrl = invitation?.imageUrl ?? template?.defaultImageUrl ?? null;

  return {
    title: invitation?.title ?? template?.name ?? 'Yeni davet',
    eventDate: invitation?.eventDate ?? '',
    eventTime: invitation?.eventTime ?? '',
    locationName: invitation?.eventLocationName ?? '',
    locationAddress: invitation?.eventLocationAddress ?? '',
    customMessage: text(content.message),
    imageUrl,
    colors: colorsFrom(content.colors, template),
    elements: savedElements.length > 0 ? savedElements : templateElements(template),
    showQrOnDesign: settings.showQrOnDesign === true,
    backgroundVeil: clamp(finite(content.backgroundVeil, imageUrl ? 0.4 : 0), 0, 1),
  };
}

export function serializeEditorDocument(document: EditorDocument): {
  title: string;
  event_date: string | null;
  event_time: string | null;
  event_location_name: string | null;
  event_location_address: string | null;
  image_url: string | null;
  content: JsonObject;
  settings: JsonObject;
} {
  return {
    title: document.title.trim() || 'İsimsiz davet',
    event_date: document.eventDate || null,
    event_time: document.eventTime || null,
    event_location_name: document.locationName.trim() || null,
    event_location_address: document.locationAddress.trim() || null,
    image_url: document.imageUrl,
    content: {
      message: document.customMessage,
      colors: document.colors,
      backgroundVeil: document.backgroundVeil,
      mobileEditorVersion: 1,
      textElements: document.elements.filter((item) => item.type === 'text' || item.type === 'divider'),
      decorativeElements: document.elements.filter((item) => item.type === 'decoration' || item.type === 'image'),
    },
    settings: { showQrOnDesign: document.showQrOnDesign },
  };
}

export function createTextElement(zIndex: number): EditorElement {
  return {
    id: `text-${Date.now()}`,
    type: 'text',
    name: 'Yeni metin',
    content: 'Yeni metin',
    position: { x: 50, y: 50 },
    size: { width: 80, height: 12 },
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    style: { color: defaultColors.text, fontFamily: 'Georgia', fontSize: 24, fontWeight: 'normal', textAlign: 'center' },
  };
}

export function createDecorationElement(shapeId: string, zIndex: number): EditorElement {
  const decoration = findDecoration(shapeId);
  const width = 26;

  return {
    id: `decoration-${Date.now()}`,
    type: 'decoration',
    name: decoration?.name ?? 'Süsleme',
    shapeId,
    position: { x: 50, y: 50 },
    // Height follows the shape's own proportions through the canvas aspect, so
    // a tall balloon does not arrive as wide as a cake.
    size: { width, height: clamp((width * CANVAS_ASPECT) / (decoration?.aspect ?? 1), 4, 60) },
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    style: { color: decoration?.color ?? defaultColors.accent },
  };
}

export function createDividerElement(zIndex: number): EditorElement {
  return {
    id: `divider-${Date.now()}`,
    type: 'divider',
    name: 'Ayırıcı çizgi',
    position: { x: 50, y: 50 },
    size: { width: 45, height: 1 },
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex,
    style: { color: defaultColors.accent },
  };
}

export type AlignEdge = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributeAxis = 'horizontal' | 'vertical';

/*
 * Tidying a design one element at a time meant nudging each of five lines to the
 * same column by eye. These operate on the whole canvas at once, which is the
 * job the steppers were being used for.
 *
 * Positions are the element's centre, so aligning to an edge has to account for
 * half the element's own box or the design ends up hanging over the paper.
 * Locked elements are left where they are — locking is how you pin a piece down
 * before rearranging everything else around it.
 */
function alignedCentre(element: EditorElement, edge: AlignEdge) {
  switch (edge) {
    case 'left': return { x: element.size.width / 2, y: element.position.y };
    case 'center': return { x: 50, y: element.position.y };
    case 'right': return { x: 100 - element.size.width / 2, y: element.position.y };
    case 'top': return { x: element.position.x, y: element.size.height / 2 };
    case 'middle': return { x: element.position.x, y: 50 };
    case 'bottom': return { x: element.position.x, y: 100 - element.size.height / 2 };
  }
}

export function alignElements(elements: EditorElement[], edge: AlignEdge): EditorElement[] {
  return elements.map((item) => item.locked
    ? item
    : { ...item, position: alignedCentre(item, edge) });
}

export function distributeElements(elements: EditorElement[], axis: DistributeAxis): EditorElement[] {
  const axisKey = axis === 'vertical' ? 'y' : 'x';
  const movable = elements.filter((item) => !item.locked);
  // Two elements are already as evenly spread as two elements can be.
  if (movable.length < 3) return elements;

  const ordered = [...movable].sort((left, right) => left.position[axisKey] - right.position[axisKey]);
  const first = ordered[0].position[axisKey];
  const last = ordered[ordered.length - 1].position[axisKey];
  const step = (last - first) / (ordered.length - 1);
  const placed = new Map(ordered.map((item, index) => [item.id, first + step * index]));

  return elements.map((item) => {
    const next = placed.get(item.id);
    return next === undefined ? item : { ...item, position: { ...item.position, [axisKey]: next } };
  });
}
