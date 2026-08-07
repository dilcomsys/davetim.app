import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

import { decorationLayers, findDecoration } from '@/features/editor/decorations';
import {
  handleAnchors,
  resizeFromCorner,
  ROTATION_HANDLE_GAP,
  rotateFromHandle,
  type CanvasSize,
  type Corner,
  type Point,
  type TransformBox,
} from '@/features/editor/element-transform';
import { CANVAS_ASPECT, resolveElementText, type EditorDocument, type EditorElement } from '@/features/editor/editor-model';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

/*
 * Point sizes are stored against a nominal canvas this wide and scaled to
 * whatever the device actually gives us. It replaces a flat 0.45 multiplier,
 * which happened to be right for one phone width and made the same design
 * render at different relative sizes on a small phone and a tablet. The value
 * is chosen to match what 0.45 produced at the old canvas width, so invitations
 * saved before this change still look the same.
 */
const DESIGN_WIDTH = 760;

/*
 * Handle sizing. The knob stays small so it does not obscure the design it is
 * attached to; the slop around it is what gives a fingertip something to land
 * on. The canvas is scaled down while a panel is open, which shrinks both, so
 * the slop is generous rather than merely adequate.
 */
const HANDLE_SIZE = 20;
const HANDLE_SLOP = 16;
const TETHER_WIDTH = 1.5;

/*
 * The templates name web fonts — Cinzel, Playfair Display, Montserrat — that the
 * app does not bundle. An unknown family silently falls back to the system face,
 * which is a sans-serif, so a template built around an engraved serif opened
 * looking like a form. Mapping the names onto the faces that ship with the OS at
 * least preserves the serif/sans distinction the design was drawn around.
 */
const SERIF_FAMILIES = new Set(['cinzel', 'playfair display', 'georgia', 'times new roman', 'garamond', 'cormorant garamond', 'lora', 'merriweather', 'great vibes', 'dancing script']);

const SYSTEM_SERIF = Platform.select({ ios: 'Iowan Old Style', android: 'serif', default: 'Palatino' });
const SYSTEM_SANS = Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'system-ui' });

function resolveFontFamily(family: string | undefined) {
  if (!family) return typography.display;
  return SERIF_FAMILIES.has(family.trim().toLowerCase()) ? SYSTEM_SERIF : SYSTEM_SANS;
}

/** The parts of an element a canvas gesture can change. */
export type ElementTransform = Partial<TransformBox>;

type EditorCanvasProps = {
  document: EditorDocument;
  interactive?: boolean;
  onTransformEnd?: (id: string, transform: ElementTransform) => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  watermark?: boolean;
};

export function EditorCanvas({ document, interactive = true, onTransformEnd, onSelect, selectedId, watermark = false }: EditorCanvasProps) {
  const ordered = [...document.elements].sort((left, right) => left.zIndex - right.zIndex);
  const [canvasSize, setCanvasSize] = useState({ height: 1, width: 1 });
  /*
   * Where an element is while a gesture is still in progress. Held apart from
   * the document so a drag does not write a history entry per frame — the
   * committed value lands once, on release, and one undo takes the whole gesture
   * back rather than unwinding it a pixel at a time.
   */
  const [drafts, setDrafts] = useState<Record<string, ElementTransform>>({});

  function draft(id: string, transform: ElementTransform) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...transform } }));
  }

  function commit(id: string, transform: ElementTransform) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    onTransformEnd?.(id, transform);
  }

  const selected = ordered.find((item) => item.id === selectedId && item.visible) ?? null;

  return (
    <Pressable
      accessibilityLabel="Davet tasarım alanı"
      accessible={interactive}
      onLayout={(event) => setCanvasSize(event.nativeEvent.layout)}
      onPress={() => onSelect(null)}
      pointerEvents={interactive ? 'auto' : 'none'}
      style={[styles.canvas, { backgroundColor: document.colors.background }]}>
      {document.imageUrl ? <Image contentFit="cover" source={document.imageUrl} style={StyleSheet.absoluteFill} /> : null}
      {/* The veil sits between the photograph and the text, in the design's own
          background colour, so a palette drawn for paper still reads over a
          photograph. Skipped entirely at zero rather than drawn transparent. */}
      {document.imageUrl && document.backgroundVeil > 0 ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: document.colors.background, opacity: document.backgroundVeil }]}
        />
      ) : null}
      {ordered.map((item) => item.visible ? (
        <CanvasElement
          canvas={canvasSize}
          document={document}
          element={item}
          key={item.id}
          interactive={interactive}
          onDrag={(position) => draft(item.id, { position })}
          onDragEnd={(position) => commit(item.id, { position })}
          onSelect={onSelect}
          position={drafts[item.id]?.position ?? item.position}
          rotation={drafts[item.id]?.rotation ?? item.rotation}
          selected={selectedId === item.id}
          size={drafts[item.id]?.size ?? item.size}
        />
      ) : null)}

      {/* After the elements so the handles are never buried under a later one,
          and only while editing — during an export `selectedId` is cleared, which
          keeps the furniture out of the captured image. */}
      {interactive && selected && !selected.locked ? (
        <SelectionHandles
          canvas={canvasSize}
          committed={{ position: selected.position, rotation: selected.rotation, size: selected.size }}
          live={{
            position: drafts[selected.id]?.position ?? selected.position,
            rotation: drafts[selected.id]?.rotation ?? selected.rotation,
            size: drafts[selected.id]?.size ?? selected.size,
          }}
          onCommit={(transform) => commit(selected.id, transform)}
          onDraft={(transform) => draft(selected.id, transform)}
        />
      ) : null}
      {document.showQrOnDesign ? (
        <View style={styles.qrPlaceholder}>
          <Ionicons color={document.colors.primary} name="qr-code-outline" size={32} />
        </View>
      ) : null}
      {watermark ? <Text pointerEvents="none" style={styles.watermark}>davetim.app</Text> : null}
    </Pressable>
  );
}

function CanvasElement({
  canvas,
  document,
  element,
  interactive,
  onDrag,
  onDragEnd,
  onSelect,
  position,
  rotation,
  selected,
  size,
}: {
  canvas: CanvasSize;
  document: EditorDocument;
  element: EditorElement;
  interactive: boolean;
  onDrag: (position: { x: number; y: number }) => void;
  onDragEnd: (position: { x: number; y: number }) => void;
  onSelect: (id: string) => void;
  position: { x: number; y: number };
  rotation: number;
  selected: boolean;
  /** The element's own size, in canvas percentages. */
  size: { height: number; width: number };
}) {
  const left = `${Math.max(0, position.x - size.width / 2)}%` as `${number}%`;
  const top = `${Math.max(0, position.y - size.height / 2)}%` as `${number}%`;
  const width = `${size.width}%` as `${number}%`;
  const height = `${size.height}%` as `${number}%`;
  const elementStyle = {
    height,
    left,
    opacity: element.opacity,
    top,
    transform: [{ rotate: `${rotation}deg` }],
    width,
    zIndex: element.zIndex,
  };

  const pan = Gesture.Pan()
    .enabled(interactive && !element.locked)
    .runOnJS(true)
    .onStart(() => onSelect(element.id))
    .onUpdate((event) => onDrag({
      x: Math.min(100, Math.max(0, element.position.x + (event.translationX / canvas.width) * 100)),
      y: Math.min(100, Math.max(0, element.position.y + (event.translationY / canvas.height) * 100)),
    }))
    .onEnd((event) => onDragEnd({
      x: Math.min(100, Math.max(0, element.position.x + (event.translationX / canvas.width) * 100)),
      y: Math.min(100, Math.max(0, element.position.y + (event.translationY / canvas.height) * 100)),
    }));

  return (
    <GestureDetector gesture={pan}>
    <Pressable
      accessibilityLabel={`${element.name} öğesini seç`}
      accessibilityRole="button"
      onPress={(event) => {
        event.stopPropagation();
        onSelect(element.id);
      }}
      style={[styles.element, elementStyle, selected && styles.selected]}>
      {element.type === 'divider' ? (
        <View style={[styles.divider, { backgroundColor: element.style.color ?? document.colors.accent }]} />
      ) : element.type === 'image' || element.type === 'decoration' ? (
        <DecorationShape color={element.style.color ?? document.colors.accent} imageUrl={element.imageUrl} shapeId={element.shapeId} />
      ) : (
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.45}
          numberOfLines={4}
          style={{
            color: element.style.color ?? document.colors.text,
            fontFamily: resolveFontFamily(element.style.fontFamily),
            fontSize: Math.max(10, (element.style.fontSize ?? 24) * (canvas.width / DESIGN_WIDTH)),
            fontStyle: element.style.fontStyle === 'italic' ? 'italic' : 'normal',
            fontWeight: element.style.fontWeight === 'bold' ? '700' : '400',
            textAlign: element.style.textAlign ?? 'center',
            textDecorationLine: element.style.textDecoration === 'underline' ? 'underline' : 'none',
          }}>
          {resolveElementText(element, document)}
        </Text>
      )}
    </Pressable>
    </GestureDetector>
  );
}

const CORNERS: { corner: Corner; label: string }[] = [
  { corner: 'topLeft', label: 'sol üst' },
  { corner: 'topRight', label: 'sağ üst' },
  { corner: 'bottomLeft', label: 'sol alt' },
  { corner: 'bottomRight', label: 'sağ alt' },
];

/*
 * Resize and rotate handles, drawn over the canvas rather than inside the
 * element they belong to.
 *
 * Nesting them in the element would put their gestures inside its drag gesture,
 * where the two compete for the same touch and which one wins depends on
 * ordering rather than on intent. As a sibling layer each handle owns its touch
 * outright, and the element keeps a drag gesture that is only ever a drag.
 *
 * The layer lets touches through everywhere except on a handle, so tapping the
 * canvas still deselects and elements underneath stay draggable.
 */
function SelectionHandles({
  canvas,
  committed,
  live,
  onCommit,
  onDraft,
}: {
  canvas: CanvasSize;
  /** The element as stored, which every gesture measures its drag against. */
  committed: TransformBox;
  /** The element as currently shown, which is where the handles are drawn. */
  live: TransformBox;
  onCommit: (transform: ElementTransform) => void;
  onDraft: (transform: ElementTransform) => void;
}) {
  /*
   * The canvas clips to its own bounds, so a handle hung above an element that
   * is already near the top would simply not be drawn. Swapping it underneath
   * keeps it reachable; the placement is handed to the rotation maths too, which
   * measures the drag from wherever the handle actually started.
   *
   * Decided from the committed box rather than the live one so it cannot change
   * part-way through a gesture. Reading the live box would let a rotation drag
   * push the handle across the threshold it is being measured against, moving
   * the origin mid-drag and snapping the element half a turn.
   */
  const placement = handleAnchors(committed, canvas, 'above').rotation.y < HANDLE_SIZE ? 'below' : 'above';
  const anchors = handleAnchors(live, canvas, placement);
  const tetherMidpoint = {
    x: (anchors.tether.x + anchors.rotation.x) / 2,
    y: (anchors.tether.y + anchors.rotation.y) / 2,
  };

  return (
    <View pointerEvents="box-none" style={styles.handleLayer}>
      {/* Drawn before the handles so it passes under the knob rather than
          through it, and non-interactive so it never eats a rotation drag. */}
      <View
        pointerEvents="none"
        style={[
          styles.tether,
          {
            left: tetherMidpoint.x - TETHER_WIDTH / 2,
            top: tetherMidpoint.y - ROTATION_HANDLE_GAP / 2,
            transform: [{ rotate: `${live.rotation}deg` }],
          },
        ]}
      />

      <TransformHandle
        accessibilityLabel="Öğeyi döndür"
        at={anchors.rotation}
        onCommit={(delta) => onCommit({ rotation: rotateFromHandle({ box: committed, canvas, delta, placement }) })}
        onDraft={(delta) => onDraft({ rotation: rotateFromHandle({ box: committed, canvas, delta, placement }) })}
        round>
        <Ionicons color={colors.white} name="refresh-outline" size={13} />
      </TransformHandle>

      {CORNERS.map(({ corner, label }) => (
        <TransformHandle
          accessibilityLabel={`Öğeyi ${label} köşeden boyutlandır`}
          at={anchors[corner]}
          key={corner}
          onCommit={(delta) => onCommit(resizeFromCorner({ box: committed, canvas, corner, delta }))}
          onDraft={(delta) => onDraft(resizeFromCorner({ box: committed, canvas, corner, delta }))}
        />
      ))}
    </View>
  );
}

/**
 * One draggable knob. Reports the gesture's cumulative translation rather than
 * per-frame deltas, so the geometry is always derived from where the finger
 * started and rounding cannot accumulate over a long drag.
 */
function TransformHandle({
  accessibilityLabel,
  at,
  children,
  onCommit,
  onDraft,
  round = false,
}: {
  accessibilityLabel: string;
  at: Point;
  children?: React.ReactNode;
  onCommit: (delta: Point) => void;
  onDraft: (delta: Point) => void;
  round?: boolean;
}) {
  const pan = Gesture.Pan()
    .runOnJS(true)
    // The knob is drawn small enough not to hide the artwork it sits on, which
    // makes it smaller than a fingertip; the slop is what is actually pressed.
    .hitSlop({ bottom: HANDLE_SLOP, left: HANDLE_SLOP, right: HANDLE_SLOP, top: HANDLE_SLOP })
    .onUpdate((event) => onDraft({ x: event.translationX, y: event.translationY }))
    .onEnd((event) => onCommit({ x: event.translationX, y: event.translationY }));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
        style={[
          styles.handle,
          round && styles.handleRound,
          { left: at.x - HANDLE_SIZE / 2, top: at.y - HANDLE_SIZE / 2 },
        ]}>
        {children}
      </View>
    </GestureDetector>
  );
}

/**
 * A vector ornament from the decoration library, or an uploaded picture for the
 * `image` elements the web editor could produce. `preserveAspectRatio` lets the
 * shape letterbox itself inside whatever box the element was resized to.
 */
export function DecorationShape({
  color,
  imageUrl,
  shapeId,
}: {
  color: string;
  imageUrl?: string;
  shapeId?: string;
}) {
  const decoration = findDecoration(shapeId);
  if (decoration) {
    return (
      <Svg height="100%" preserveAspectRatio="xMidYMid meet" viewBox={decoration.viewBox ?? '0 0 50 50'} width="100%">
        {decorationLayers(decoration, color).map((layer, index) => (
          <Path
            d={layer.path}
            fill={layer.fill}
            // Layers are positional: nothing about a wreath's ninth leaf makes a
            // more stable key than where it sits in the list, and the list for a
            // given ornament never reorders.
            key={index}
            opacity={layer.opacity}
            stroke={layer.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={layer.strokeWidth}
            transform={layer.transform}
          />
        ))}
      </Svg>
    );
  }

  return imageUrl ? <Image contentFit="contain" source={imageUrl} style={StyleSheet.absoluteFill} /> : null;
}

const styles = StyleSheet.create({
  canvas: { ...shadow, aspectRatio: CANVAS_ASPECT, borderRadius: radius.md, overflow: 'hidden', position: 'relative', width: '100%' },
  element: { alignItems: 'center', justifyContent: 'center', padding: 2, position: 'absolute' },
  selected: { borderColor: colors.secondary, borderRadius: 4, borderStyle: 'dashed', borderWidth: 1.5 },

  // Above every element: an element with a high `zIndex` would otherwise cover
  // the handles of the one below it, which is precisely when they are needed.
  handleLayer: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 9999 },
  handle: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderColor: colors.white,
    borderRadius: 3,
    borderWidth: 1.5,
    height: HANDLE_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    width: HANDLE_SIZE,
  },
  handleRound: { borderRadius: HANDLE_SIZE / 2 },
  tether: { backgroundColor: colors.secondary, height: ROTATION_HANDLE_GAP, position: 'absolute', width: TETHER_WIDTH },
  divider: { borderRadius: radius.pill, height: 3, width: '100%' },
  qrPlaceholder: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: radius.sm, bottom: spacing.md, height: 48, justifyContent: 'center', position: 'absolute', right: spacing.md, width: 48 },
  watermark: { bottom: spacing.sm, color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 8, left: spacing.md, opacity: 0.7, position: 'absolute' },
});
