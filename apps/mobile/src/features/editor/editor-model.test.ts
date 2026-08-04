import { describe, expect, it } from 'vitest';

import type { InvitationTemplate } from '@/domain/models';
import {
  alignElements,
  createDecorationElement,
  createEditorDocument,
  createTextElement,
  distributeElements,
  serializeEditorDocument,
} from '@/features/editor/editor-model';

function template(overrides: Partial<InvitationTemplate> = {}): InvitationTemplate {
  return {
    id: 'template-1',
    name: 'Klasik Düğün',
    description: null,
    category: 'wedding',
    subcategory: null,
    tier: 'free',
    thumbnailUrl: null,
    defaultImageUrl: null,
    colorPalette: {},
    textFields: [],
    decorativeElements: [],
    availableFonts: [],
    isFeatured: false,
    sortOrder: 0,
    updatedAt: '',
    ...overrides,
  };
}

describe('editor model', () => {
  it('keeps a stable mobile document version and separates text layers', () => {
    const document = createEditorDocument(null, null);
    document.elements = [createTextElement(1)];
    document.customMessage = 'Hoş geldiniz';
    const serialized = serializeEditorDocument(document);
    expect(serialized.content.mobileEditorVersion).toBe(1);
    expect(serialized.content.textElements).toHaveLength(1);
    expect(serialized.content.decorativeElements).toHaveLength(0);
  });

  it('does not persist whitespace-only location fields', () => {
    const document = createEditorDocument(null, null);
    document.locationName = '   ';
    expect(serializeEditorDocument(document).event_location_name).toBeNull();
  });

  // The seeded templates carry styling but no coordinates, so every field
  // decoded to the same centre point and the template opened as one illegible
  // pile instead of the design the gallery advertises.
  it('stacks positionless template text fields down the canvas', () => {
    const document = createEditorDocument(null, template({
      textFields: [
        { id: 'names', label: 'İsimler', defaultValue: 'Zeynep & Kerem', style: { fontSize: 44 } },
        { id: 'message', label: 'Mesaj', defaultValue: 'Bizimle olun', style: { fontSize: 14 } },
        { id: 'date', label: 'Tarih', defaultValue: '14 Şubat 2026', style: { fontSize: 16 } },
      ],
    }));

    const ys = document.elements.map((item) => item.position.y);
    expect(new Set(ys).size).toBe(3);
    expect(ys).toEqual([...ys].sort((left, right) => left - right));
    expect(Math.min(...ys)).toBeGreaterThan(0);
    expect(Math.max(...ys)).toBeLessThan(100);
    expect(document.elements.every((item) => item.position.x === 50)).toBe(true);
  });

  it('honours coordinates when a template field carries them', () => {
    const document = createEditorDocument(null, template({
      textFields: [{ id: 'names', label: 'İsimler', position: { x: 20, y: 70 } }],
    }));
    expect(document.elements[0].position).toEqual({ x: 20, y: 70 });
  });

  it('opens a template with its decorative elements, not only its text', () => {
    const document = createEditorDocument(null, template({
      textFields: [{ id: 'names', label: 'İsimler', defaultValue: 'Zeynep & Kerem' }],
      decorativeElements: [
        { id: 'ring', type: 'decoration', shapeId: 'ring_gold', position: { x: 50, y: 12 }, size: { width: 18, height: 12 } },
      ],
    }));

    expect(document.elements).toHaveLength(2);
    const decoration = document.elements.find((item) => item.type === 'decoration');
    expect(decoration?.shapeId).toBe('ring_gold');
    expect(decoration?.position).toEqual({ x: 50, y: 12 });
  });

  it('round-trips a decoration through the saved document', () => {
    const document = createEditorDocument(null, null);
    document.elements = [createDecorationElement('heart_red', 1)];
    const serialized = serializeEditorDocument(document);
    expect(serialized.content.decorativeElements).toHaveLength(1);

    const reopened = createEditorDocument(
      { content: serialized.content } as never,
      null,
    );
    expect(reopened.elements[0].shapeId).toBe('heart_red');
  });

  // The seeded palettes were drawn against the web editor's opaque overlay, so a
  // template opened over its own dark photograph with near-black text.
  it('veils a background photo by default and remembers the choice', () => {
    const withPhoto = createEditorDocument(null, template({ defaultImageUrl: 'https://cdn.example.com/a.jpg' }));
    expect(withPhoto.backgroundVeil).toBeGreaterThan(0);

    const withoutPhoto = createEditorDocument(null, template());
    expect(withoutPhoto.backgroundVeil).toBe(0);

    withPhoto.backgroundVeil = 0;
    const reopened = createEditorDocument(
      { content: serializeEditorDocument(withPhoto).content, imageUrl: 'https://cdn.example.com/a.jpg' } as never,
      null,
    );
    expect(reopened.backgroundVeil).toBe(0);
  });

  describe('bulk alignment', () => {
    const elements = [
      { ...createTextElement(1), id: 'a', position: { x: 20, y: 10 } },
      { ...createTextElement(2), id: 'b', position: { x: 60, y: 50 }, size: { width: 40, height: 12 } },
      { ...createTextElement(3), id: 'c', position: { x: 80, y: 90 }, locked: true },
    ];

    it('centres every unlocked element horizontally and leaves locked ones alone', () => {
      const aligned = alignElements(elements, 'center');
      expect(aligned.map((item) => item.position.x)).toEqual([50, 50, 80]);
      expect(aligned.map((item) => item.position.y)).toEqual([10, 50, 90]);
    });

    it('aligns to the canvas edges by the element box, not its centre', () => {
      const left = alignElements(elements, 'left');
      expect(left[0].position.x).toBe(40); // 80% wide text box, so its centre sits at 40
      expect(left[1].position.x).toBe(20);

      const right = alignElements(elements, 'right');
      expect(right[0].position.x).toBe(60);
      expect(right[1].position.x).toBe(80);
    });

    it('spreads unlocked elements evenly between the first and last', () => {
      const spread = distributeElements(elements, 'vertical');
      expect(spread.map((item) => item.position.y)).toEqual([10, 50, 90]);

      const bunched = distributeElements(
        elements.map((item, index) => ({ ...item, locked: false, position: { x: item.position.x, y: index === 2 ? 90 : 10 } })),
        'vertical',
      );
      expect(bunched.map((item) => item.position.y)).toEqual([10, 50, 90]);
    });
  });
});
