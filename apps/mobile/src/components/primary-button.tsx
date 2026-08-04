import Ionicons from '@expo/vector-icons/Ionicons';
import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

/*
 * Buttons follow the landing page: cobalt carries the action, bole is kept for
 * the one destructive case. Before this they were bole with dark ink on top,
 * which both clashed with the site and failed contrast on the red fill.
 */
type PrimaryButtonProps = PropsWithChildren<{
  accessibilityLabel: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  variant?: 'primary' | 'secondary' | 'destructive';
}>;

export function PrimaryButton({
  accessibilityLabel,
  children,
  disabled = false,
  icon = 'arrow-forward',
  loading = false,
  onPress,
  variant = 'primary',
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'destructive' && styles.destructive,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}>
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{children}</Text>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.secondary : colors.white} size="small" />
      ) : (
        <Ionicons color={variant === 'secondary' ? colors.secondary : colors.white} name={icon} size={19} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: 20,
  },
  secondary: { backgroundColor: colors.secondarySoft },
  destructive: { backgroundColor: colors.primary },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  label: {
    color: colors.white,
    fontFamily: typography.bodyMedium,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryLabel: { color: colors.secondary },
});
