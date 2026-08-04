import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

import { findDecoration } from '@/features/editor/decorations';
import { CANVAS_ASPECT, type EditorDocument, type EditorElement } from '@/features/editor/editor-model';
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

type EditorCanvasProps = {
  document: EditorDocument;
  interactive?: boolean;
  onMoveEnd?: (id: string, position: { x: number; y: number }) => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  watermark?: boolean;
};

export function EditorCanvas({ document, interactive = true, onMoveEnd, onSelect, selectedId, watermark = false }: EditorCanvasProps) {
  const ordered = [...document.elements].sort((left, right) => left.zIndex - right.zIndex);
  const [canvasSize, setCanvasSize] = useState({ height: 1, width: 1 });
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

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
          document={document}
          element={item}
          key={item.id}
          interactive={interactive}
          onDrag={(position) => setDragPositions((current) => ({ ...current, [item.id]: position }))}
          onDragEnd={(position) => {
            setDragPositions((current) => {
              const next = { ...current };
              delete next[item.id];
              return next;
            });
            onMoveEnd?.(item.id, position);
          }}
          onSelect={onSelect}
          position={dragPositions[item.id] ?? item.position}
          selected={selectedId === item.id}
          size={canvasSize}
        />
      ) : null)}
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
  document,
  element,
  interactive,
  onDrag,
  onDragEnd,
  onSelect,
  position,
  selected,
  size,
}: {
  document: EditorDocument;
  element: EditorElement;
  interactive: boolean;
  onDrag: (position: { x: number; y: number }) => void;
  onDragEnd: (position: { x: number; y: number }) => void;
  onSelect: (id: string) => void;
  position: { x: number; y: number };
  selected: boolean;
  size: { height: number; width: number };
}) {
  const left = `${Math.max(0, position.x - element.size.width / 2)}%` as `${number}%`;
  const top = `${Math.max(0, position.y - element.size.height / 2)}%` as `${number}%`;
  const width = `${element.size.width}%` as `${number}%`;
  const height = `${element.size.height}%` as `${number}%`;
  const elementStyle = {
    height,
    left,
    opacity: element.opacity,
    top,
    transform: [{ rotate: `${element.rotation}deg` }],
    width,
    zIndex: element.zIndex,
  };

  const pan = Gesture.Pan()
    .enabled(interactive && !element.locked)
    .runOnJS(true)
    .onStart(() => onSelect(element.id))
    .onUpdate((event) => onDrag({
      x: Math.min(100, Math.max(0, element.position.x + (event.translationX / size.width) * 100)),
      y: Math.min(100, Math.max(0, element.position.y + (event.translationY / size.height) * 100)),
    }))
    .onEnd((event) => onDragEnd({
      x: Math.min(100, Math.max(0, element.position.x + (event.translationX / size.width) * 100)),
      y: Math.min(100, Math.max(0, element.position.y + (event.translationY / size.height) * 100)),
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
            fontSize: Math.max(10, (element.style.fontSize ?? 24) * (size.width / DESIGN_WIDTH)),
            fontStyle: element.style.fontStyle === 'italic' ? 'italic' : 'normal',
            fontWeight: element.style.fontWeight === 'bold' ? '700' : '400',
            textAlign: element.style.textAlign ?? 'center',
            textDecorationLine: element.style.textDecoration === 'underline' ? 'underline' : 'none',
          }}>
          {element.content}
        </Text>
      )}
      {selected ? <View style={styles.selectionDot} /> : null}
    </Pressable>
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
        <Path
          d={decoration.path}
          fill={decoration.filled ? color : 'none'}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={decoration.filled ? 0 : decoration.strokeWidth ?? 2}
        />
      </Svg>
    );
  }

  return imageUrl ? <Image contentFit="contain" source={imageUrl} style={StyleSheet.absoluteFill} /> : null;
}

const styles = StyleSheet.create({
  canvas: { ...shadow, aspectRatio: CANVAS_ASPECT, borderRadius: radius.md, overflow: 'hidden', position: 'relative', width: '100%' },
  element: { alignItems: 'center', justifyContent: 'center', padding: 2, position: 'absolute' },
  selected: { borderColor: colors.secondary, borderRadius: 4, borderStyle: 'dashed', borderWidth: 1.5 },
  selectionDot: { backgroundColor: colors.secondary, borderColor: colors.white, borderRadius: 6, borderWidth: 1, height: 10, position: 'absolute', right: -5, top: -5, width: 10 },
  divider: { borderRadius: radius.pill, height: 3, width: '100%' },
  qrPlaceholder: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: radius.sm, bottom: spacing.md, height: 48, justifyContent: 'center', position: 'absolute', right: spacing.md, width: 48 },
  watermark: { bottom: spacing.sm, color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 8, left: spacing.md, opacity: 0.7, position: 'absolute' },
});
