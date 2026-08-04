import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Tap } from '@/components/motion';
import { colors, engraved, radius, spacing, typography } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/*
 * Every control the editor panels are built from. They live together because
 * they share one rule: nothing is smaller than 44pt, because the whole point of
 * the rewrite is that a phone is the primary device rather than the fallback.
 */

export function FieldLabel({ children }: React.PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({
  keyboardType,
  label,
  multiline,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: 'default' | 'numeric';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
    </View>
  );
}

/** Two fields sharing a row. Use for values that are read together, like date and time. */
export function FieldRow({ children }: React.PropsWithChildren) {
  return <View style={styles.fieldRow}>{children}</View>;
}

/**
 * Value nudger. The old editor moved elements two units per tap with no way to
 * go faster; holding a direction here repeats, so crossing the canvas is one
 * gesture rather than twenty-five taps.
 */
export function Stepper({
  label,
  max,
  min,
  onChange,
  step = 2,
  suffix,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  value: number;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <View style={styles.stepper}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.stepperRow}>
        <Tap
          accessibilityLabel={`${label} azalt`}
          accessibilityRole="button"
          disabled={value <= min}
          onLongPress={() => onChange(clamp(value - step * 5))}
          onPress={() => onChange(clamp(value - step))}
          style={[styles.stepperButton, value <= min && styles.controlDisabled]}>
          <Ionicons color={colors.secondary} name="remove" size={20} />
        </Tap>
        <Text style={styles.stepperValue}>{Math.round(value)}{suffix}</Text>
        <Tap
          accessibilityLabel={`${label} artır`}
          accessibilityRole="button"
          disabled={value >= max}
          onLongPress={() => onChange(clamp(value + step * 5))}
          onPress={() => onChange(clamp(value + step))}
          style={[styles.stepperButton, value >= max && styles.controlDisabled]}>
          <Ionicons color={colors.secondary} name="add" size={20} />
        </Tap>
      </View>
    </View>
  );
}

/**
 * Colour choice by tapping, with the hex field kept for people who arrive with a
 * brand code. Typing `#C0362C` from memory was previously the only way to set a
 * colour at all.
 */
export function SwatchPicker({
  label,
  onChange,
  swatches,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  swatches: string[];
  value: string;
}) {
  // Case-insensitive, because a template's stored hex and the brand constant can
  // be the same colour written two ways and would otherwise both show up.
  const seen = new Set<string>();
  const unique = swatches.filter((swatch) => {
    const key = swatch.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.swatchRow}>
        {unique.map((swatch) => (
          <Tap
            accessibilityLabel={`${label}: ${swatch}`}
            accessibilityRole="button"
            key={swatch}
            onPress={() => onChange(swatch)}
            scaleTo={0.88}
            style={[
              styles.swatch,
              { backgroundColor: swatch },
              swatch.toLowerCase() === value.toLowerCase() && styles.swatchActive,
            ]}>
            {swatch.toLowerCase() === value.toLowerCase() ? (
              <Ionicons color={readableOn(swatch)} name="checkmark" size={16} />
            ) : null}
          </Tap>
        ))}
      </View>
      <TextInput
        autoCapitalize="characters"
        onChangeText={onChange}
        placeholder="#000000"
        placeholderTextColor={colors.inkMuted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

/** Rough luminance check, only ever used to keep a tick mark visible on a swatch. */
function readableOn(hex: string) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return colors.white;
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? colors.ink : colors.white;
}

/** Square icon-and-label button. The panels' primary action shape. */
export function ActionTile({
  disabled,
  icon,
  label,
  onPress,
  tone = 'neutral',
}: {
  disabled?: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'neutral' | 'accent';
}) {
  return (
    <Tap
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.tile, tone === 'accent' && styles.tileAccent, disabled && styles.controlDisabled]}>
      <Ionicons color={tone === 'accent' ? colors.white : colors.secondary} name={icon} size={22} />
      <Text style={[styles.tileLabel, tone === 'accent' && styles.tileLabelAccent]}>{label}</Text>
    </Tap>
  );
}

export function TileGrid({ children }: React.PropsWithChildren) {
  return <View style={styles.tileGrid}>{children}</View>;
}

/** Full-width row with a leading icon. Used for list-shaped choices inside panels. */
export function PanelRow({
  danger,
  disabled,
  icon,
  label,
  onPress,
  value,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
  value?: string;
}) {
  return (
    <Tap
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.985}
      style={[styles.panelRow, disabled && styles.controlDisabled]}>
      <Ionicons color={danger ? colors.primaryText : colors.secondary} name={icon} size={21} />
      <Text style={[styles.panelRowLabel, danger && styles.panelRowLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.panelRowValue}>{value}</Text> : null}
      <Ionicons color={colors.inkMuted} name="chevron-forward" size={17} />
    </Tap>
  );
}

/*
 * Segmented choice, labelled with words rather than icons. Ionicons has no
 * alignment glyphs, and the nearest lookalikes (`reorder-three`, `reorder-four`)
 * read as list icons and cannot distinguish left from right at all.
 */
export function SegmentedControl<Value extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: Value) => void;
  options: { label: string; value: Value }[];
  value: Value;
}) {
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <View style={styles.segment}>
        {options.map((option) => (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected: option.value === value }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segmentItem, option.value === value && styles.segmentItemActive]}>
            <Text style={[styles.segmentLabel, option.value === value && styles.segmentLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function PanelNote({ children, tone = 'info' }: React.PropsWithChildren<{ tone?: 'info' | 'warning' }>) {
  return (
    <View style={[styles.note, tone === 'warning' && styles.noteWarning]}>
      <Ionicons
        color={tone === 'warning' ? colors.warning : colors.secondary}
        name={tone === 'warning' ? 'lock-closed-outline' : 'information-circle-outline'}
        size={18}
      />
      <Text style={[styles.noteText, tone === 'warning' && styles.noteTextWarning]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...engraved, color: colors.inkMuted },
  field: { gap: spacing.sm },
  fieldRow: { flexDirection: 'row', gap: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: typography.body,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 92, textAlignVertical: 'top' },

  stepper: { flex: 1, gap: spacing.sm },
  stepperRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 3,
  },
  stepperButton: { alignItems: 'center', borderRadius: radius.sm, height: 40, justifyContent: 'center', width: 44 },
  stepperValue: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '700' },

  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  swatchActive: { borderColor: colors.ink, borderWidth: 2 },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.sm,
    flexGrow: 1,
    // Sized so four tiles still fit one row on a 390pt screen. At 88 the share
    // panel broke to three-plus-one, which reads as a mistake rather than a grid.
    flexBasis: 76,
    gap: 6,
    justifyContent: 'center',
    minHeight: 76,
    paddingHorizontal: spacing.sm,
  },
  tileAccent: { backgroundColor: colors.secondary },
  tileLabel: { color: colors.secondary, fontFamily: typography.bodyMedium, fontSize: 12, fontWeight: '700' },
  tileLabelAccent: { color: colors.white },

  panelRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  panelRowLabel: { color: colors.ink, flex: 1, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '700' },
  panelRowLabelDanger: { color: colors.primaryText },
  panelRowValue: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 13 },

  segment: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    padding: 3,
  },
  segmentItem: { alignItems: 'center', borderRadius: radius.sm, flex: 1, minHeight: 40, justifyContent: 'center' },
  segmentItemActive: { backgroundColor: colors.secondary },
  segmentLabel: { color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '700' },
  segmentLabelActive: { color: colors.white },

  note: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  noteWarning: { backgroundColor: colors.warningSoft },
  noteText: { color: colors.secondary, flex: 1, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  noteTextWarning: { color: colors.warning },

  controlDisabled: { opacity: 0.4 },
});
