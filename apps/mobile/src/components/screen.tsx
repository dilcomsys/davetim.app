import type { PropsWithChildren, ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { colors, engraved, spacing, typography } from '@/theme/tokens';

type ScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  /** Supplying this turns on pull-to-refresh. Omit it on screens with nothing to refetch. */
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

export function Screen({ action, children, eyebrow, onRefresh, refreshing = false, title }: ScreenProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh
          ? <RefreshControl colors={[colors.secondary]} onRefresh={onRefresh} refreshing={refreshing} tintColor={colors.secondary} />
          : undefined}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandMark />
          {action}
        </View>
        {title ? (
          <View style={styles.titleBlock}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  content: { gap: spacing.xl, paddingBottom: 120, paddingHorizontal: spacing.xl },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  titleBlock: { gap: spacing.sm },
  // The engraved label and the tight serif heading are the landing page's two
  // recurring type gestures. Sharing them is what makes the app read as the
  // same brand rather than a companion product.
  eyebrow: { ...engraved, color: colors.secondary },
  title: {
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 34,
    fontWeight: '500',
    letterSpacing: -0.9,
    lineHeight: 37,
  },
});
