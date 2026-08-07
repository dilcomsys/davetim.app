import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/motion';
import { DecorationShape } from '@/features/editor/editor-canvas';
import {
  DECORATION_CATEGORIES,
  DECORATION_CATEGORY_LABELS,
  DECORATIONS,
  type DecorationCategory,
} from '@/features/editor/decorations';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/*
 * The ornament gallery. Each tile draws the real shape rather than an icon
 * standing in for it, because the whole decision here is "does this look right
 * on my invitation" and a generic glyph answers nothing.
 */
export function DecorationPicker({ onPick }: { onPick: (shapeId: string) => void }) {
  const [category, setCategory] = useState<DecorationCategory | null>(null);
  const visible = category ? DECORATIONS.filter((item) => item.category === category) : DECORATIONS;

  return (
    <>
      {/* Scrolls sideways rather than wrapping. The picker lives in a tray now,
          and eleven categories wrapped onto three lines would spend most of that
          tray on filters instead of on the ornaments being chosen. */}
      <ScrollView
        contentContainerStyle={styles.filterRow}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: category === null }}
          onPress={() => setCategory(null)}
          style={[styles.filter, category === null && styles.filterActive]}>
          <Text style={[styles.filterText, category === null && styles.filterTextActive]}>Tümü</Text>
        </Pressable>
        {DECORATION_CATEGORIES.map((item) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: category === item }}
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.filter, category === item && styles.filterActive]}>
            <Text style={[styles.filterText, category === item && styles.filterTextActive]}>
              {DECORATION_CATEGORY_LABELS[item]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {visible.map((decoration) => (
          <Tap
            accessibilityLabel={`${decoration.name} ekle`}
            accessibilityRole="button"
            key={decoration.id}
            onPress={() => onPick(decoration.id)}
            scaleTo={0.92}
            style={styles.tile}>
            <View style={styles.tileArt}>
              <DecorationShape color={decoration.color} shapeId={decoration.id} />
            </View>
            <Text numberOfLines={1} style={styles.tileLabel}>{decoration.name}</Text>
          </Tap>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  filterScroll: { flexGrow: 0, marginHorizontal: -spacing.lg },
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  filter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  filterText: { color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: colors.white },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: 6,
    // Four to a row on a 390pt screen, which keeps the shape big enough to
    // recognise without the panel turning into a scroll marathon.
    flexBasis: '22.4%',
    flexGrow: 1,
    paddingBottom: spacing.sm,
    paddingTop: spacing.md,
  },
  tileArt: { height: 42, width: 42 },
  tileLabel: {
    color: colors.inkMuted,
    fontFamily: typography.bodyMedium,
    fontSize: 9,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
});
