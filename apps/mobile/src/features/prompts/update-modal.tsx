import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { colors, engraved, radius, spacing, typography } from '@/theme/tokens';

/*
 * The update sheet.
 *
 * A real `Modal` rather than an absolutely positioned overlay, because the
 * blocking variant has to sit above everything including the tab bar and the
 * editor's own bottom sheets, and it must swallow the Android back button. An
 * overlay inside the navigator can do neither.
 *
 * Two variants, one layout. The blocking one drops the dismiss affordances —
 * no close button, no backdrop tap, `onRequestClose` is a no-op — so there is
 * no path past it except the store. The optional one keeps all three, because
 * an update the user can ignore that they cannot dismiss is just a trap.
 *
 * The card is capped and scrolls internally so long release notes lengthen the
 * text and never push the buttons off a small screen.
 */
export function UpdateModal({
  blocking,
  notes,
  onDismiss,
  onUpdate,
  version,
}: {
  blocking: boolean;
  notes: string | null;
  onDismiss: () => void;
  onUpdate: () => void;
  version: string | null;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="none"
      onRequestClose={blocking ? () => undefined : onDismiss}
      statusBarTranslucent
      transparent
      visible>
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={styles.backdropLayer}>
        <Pressable
          accessibilityElementsHidden={blocking}
          accessibilityLabel={blocking ? undefined : 'Güncelleme penceresini kapat'}
          disabled={blocking}
          onPress={blocking ? undefined : onDismiss}
          style={styles.backdrop}
        />
      </Animated.View>

      <View pointerEvents="box-none" style={[styles.center, { paddingBottom: insets.bottom + spacing.lg, paddingTop: insets.top + spacing.lg }]}>
        <Animated.View entering={SlideInDown.duration(220)} style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons color={colors.secondary} name={blocking ? 'shield-checkmark' : 'sparkles'} size={28} />
          </View>

          <Text style={styles.eyebrow}>{blocking ? 'Güncelleme gerekli' : 'Yeni sürüm hazır'}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {blocking ? 'Devam etmek için güncelle' : 'Davetim güncellendi'}
          </Text>

          <ScrollView
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            style={styles.body}>
            <Text style={styles.text}>
              {blocking
                ? 'Kullandığın sürüm artık desteklenmiyor. Davetlerinin ve davetli listenin güvenle çalışması için mağazadan güncellemen gerekiyor.'
                : 'Yeni sürümde iyileştirmeler var. Güncellemek birkaç saniye sürer.'}
            </Text>
            {notes ? <Text style={styles.notes}>{notes}</Text> : null}
            {version ? <Text style={styles.version}>Sürüm {version}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <PrimaryButton accessibilityLabel="Mağazada güncelle" icon="open-outline" onPress={onUpdate}>
              Güncelle
            </PrimaryButton>
            {blocking ? null : (
              <Pressable accessibilityLabel="Daha sonra güncelle" accessibilityRole="button" hitSlop={8} onPress={onDismiss} style={styles.later}>
                <Text style={styles.laterText}>Daha sonra</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropLayer: StyleSheet.absoluteFill,
  backdrop: { backgroundColor: 'rgba(8,14,32,0.45)', flex: 1 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    gap: spacing.sm,
    // Capped so long notes scroll inside the card instead of pushing the
    // buttons past the bottom of a small screen.
    maxHeight: '82%',
    maxWidth: 420,
    padding: spacing.xl,
    width: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 56,
  },
  eyebrow: { ...engraved, color: colors.secondary },
  title: { color: colors.ink, fontFamily: typography.display, fontSize: 26, fontWeight: '600', letterSpacing: -0.6, lineHeight: 30 },
  body: { flexGrow: 0 },
  bodyContent: { gap: spacing.sm, paddingTop: spacing.xs },
  text: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 15, lineHeight: 22 },
  notes: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 20,
    padding: spacing.md,
  },
  version: { ...engraved, color: colors.inkMuted, fontSize: 10 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  later: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  laterText: { color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '700' },
});
