import Ionicons from '@expo/vector-icons/Ionicons';
import type { PropsWithChildren, ReactElement } from 'react';
import { Children, Fragment, isValidElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/motion';
import { colors, engraved, radius, spacing, typography } from '@/theme/tokens';

/*
 * Grouped settings rows, the shape both account screens are built from. One card
 * per group with hairline rules between rows reads as a settings surface people
 * already know; the previous treatment gave every item its own bordered card,
 * which made twelve unrelated things look equally important.
 */

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function touchesPanel(above: ReactElement, below: ReactElement) {
  return above.type === SettingsPanel || below.type === SettingsPanel;
}

export function SettingsGroup({ children, label }: PropsWithChildren<{ label?: string }>) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.group}>
      {label ? <Text style={styles.groupLabel}>{label}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {/*
              Rules are inset past the icon column, the way a settings list
              normally reads. A panel has no icon column, so an inset rule above
              or below one hangs in mid-air — those run the full width instead.
            */}
            {index > 0 ? (
              <View style={touchesPanel(rows[index - 1], row) ? styles.ruleFull : styles.rule} />
            ) : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

export function SettingsRow({
  danger,
  detail,
  disabled,
  icon,
  label,
  onPress,
  trailingIcon = 'chevron-forward',
}: {
  danger?: boolean;
  /** Secondary line under the label. For state, not for instructions. */
  detail?: string;
  disabled?: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
  trailingIcon?: IconName;
}) {
  return (
    <Tap
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.99}
      style={[styles.row, disabled && styles.disabled]}>
      <Ionicons color={danger ? colors.primaryText : colors.secondary} name={icon} size={21} />
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <Ionicons color={colors.inkMuted} name={trailingIcon} size={17} />
    </Tap>
  );
}

/** Non-interactive row, for facts the screen shows but you cannot change here. */
export function SettingsFact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons color={colors.inkMuted} name={icon} size={21} />
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDetail}>{value}</Text>
      </View>
    </View>
  );
}

/** Free-form content inside a group, for a form field or a paragraph. */
export function SettingsPanel({ children }: PropsWithChildren) {
  return <View style={styles.panel}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  groupLabel: { ...engraved, color: colors.inkMuted, paddingHorizontal: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rule: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginLeft: 52 },
  ruleFull: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowCopy: { flex: 1, gap: 2 },
  rowLabel: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '700' },
  rowLabelDanger: { color: colors.primaryText },
  rowDetail: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 18 },
  panel: { gap: spacing.md, padding: spacing.lg },
  disabled: { opacity: 0.45 },
});
