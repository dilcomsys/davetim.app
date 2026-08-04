import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, engraved, radius, spacing, typography } from '@/theme/tokens';

/*
 * The printed-card device from the landing page, as a mobile component.
 *
 * A davetiye has a rule printed just inside its trimmed edge, and this is that
 * rule: a hairline frame inset from the card, with a short gold bar under the
 * heading. `.paper-invite` in apps/landing/src/App.css draws the same two
 * things, so the guest-facing screens and the website read as one product.
 */

export function PaperCard({ children }: PropsWithChildren) {
  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.frame} />
      {children}
    </View>
  );
}

/** The short gold bar that separates a card's heading from its detail. */
export function GoldRule() {
  return <View style={styles.goldRule} />;
}

/** Uppercase, tracked, cobalt: the one label treatment both surfaces share. */
export function Engraved({ children }: PropsWithChildren) {
  return <Text style={styles.engraved}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  frame: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    bottom: spacing.sm,
    left: spacing.sm,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  goldRule: {
    alignSelf: 'center',
    backgroundColor: colors.gold,
    height: 1,
    width: 44,
  },
  engraved: { ...engraved, color: colors.secondary },
});

export const paperText = StyleSheet.create({
  /** Centred serif, the way invitation copy is set. */
  display: {
    color: colors.plum,
    fontFamily: typography.display,
    fontSize: 30,
    fontWeight: '500',
    letterSpacing: -0.6,
    lineHeight: 34,
    textAlign: 'center',
  },
  body: {
    color: colors.inkMuted,
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
});
