import Ionicons from '@expo/vector-icons/Ionicons';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { springConfig } from '@/components/motion';
import { colors, engraved, radius, spacing, typography } from '@/theme/tokens';

/*
 * The editor's panels live here rather than in a full-screen route because the
 * point of the redesign is that you never lose sight of the invitation while you
 * edit it.
 *
 * `heightRatio` caps how much of the screen a panel may claim. The canvas scales
 * into whatever is left rather than being covered, so this is a legibility
 * budget rather than a visibility one: every extra tenth here is a tenth off the
 * invitation the user is trying to watch while they edit it. Panels scroll, the
 * canvas cannot — prefer letting a long panel scroll over raising this.
 */
type BottomSheetProps = PropsWithChildren<{
  /** Fraction of screen height the sheet may occupy. Canvas keeps the rest. */
  heightRatio?: number;
  onClose: () => void;
  /**
   * Reports the sheet's top edge in window coordinates so whatever is behind it
   * can move out of the way instead of being covered. `null` means no sheet is
   * claiming any space — the caller would otherwise keep reserving room for a
   * panel that has closed.
   */
  onSheetTop?: (topInWindow: number | null) => void;
  /** Right-hand slot in the header, for a panel-specific action. */
  action?: React.ReactNode;
  subtitle?: string;
  title: string;
}>;

// Drag further than this and letting go dismisses instead of springing back.
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 700;

export function BottomSheet({ action, children, heightRatio = 0.52, onClose, onSheetTop, subtitle, title }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(0);

  // Through a ref so the unmount effect stays a mount-only effect. Depending on
  // the prop instead would fire the "sheet is gone" report on every render that
  // passed a fresh callback, which is every render for an inline arrow.
  const report = useRef(onSheetTop);
  useEffect(() => { report.current = onSheetTop; }, [onSheetTop]);
  useEffect(() => () => report.current?.(null), []);

  /*
   * The top edge is derived from the overlay's window rect plus the sheet's own
   * layout height, rather than measuring the sheet directly. Both inputs are
   * animation-free: the overlay never moves, and layout height is settled before
   * the entrance transform runs. Measuring the sheet itself would sample it
   * mid-slide and report a top edge a screen-height too low.
   *
   * Deriving it from `useWindowDimensions` and the bottom inset would be simpler
   * and wrong — whether an absolutely positioned overlay stops at the safe area
   * or runs to the hardware edge is exactly the kind of thing that differs per
   * device, and a wrong answer here shifts the canvas by the inset.
   */
  const overlayRef = useRef<View>(null);
  const overlayBottom = useRef(0);
  const sheetHeight = useRef(0);

  function publish() {
    if (overlayBottom.current > 0 && sheetHeight.current > 0) {
      report.current?.(overlayBottom.current - sheetHeight.current);
    }
  }

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      // Upward drags do nothing: the sheet is already at its full height, and
      // letting it rubber-band up would imply there is more content above.
      translateY.set(Math.max(0, event.translationY));
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        runOnJS(onClose)();
        return;
      }
      translateY.set(withSpring(0, springConfig));
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));

  return (
    <View
      onLayout={() => overlayRef.current?.measureInWindow((_x, y, _width, measuredHeight) => {
        overlayBottom.current = y + measuredHeight;
        publish();
      })}
      pointerEvents="box-none"
      ref={overlayRef}
      style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(120)} style={StyleSheet.absoluteFill}>
        <Pressable accessibilityLabel="Paneli kapat" onPress={onClose} style={styles.backdrop} />
      </Animated.View>

      {/*
        Plain timing rather than a spring. A spring on a surface this large
        overshoots and settles visibly, and panels are opened dozens of times in
        one editing session — the bounce that reads as lively on the first open
        is tiring by the tenth. The spring is kept only for the drag snap-back
        below, where it is following a finger rather than performing.
      */}
      <Animated.View
        entering={SlideInDown.duration(200)}
        exiting={SlideOutDown.duration(160)}
        onLayout={(event) => { sheetHeight.current = event.nativeEvent.layout.height; publish(); }}
        style={[styles.sheet, { maxHeight: height * heightRatio }, sheetStyle]}>
        <GestureDetector gesture={pan}>
          <View style={styles.handleArea}>
            <View style={styles.grabber} />
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text accessibilityRole="header" style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              {action}
              <Pressable accessibilityLabel="Paneli kapat" accessibilityRole="button" hitSlop={10} onPress={onClose}>
                <Ionicons color={colors.inkMuted} name="close" size={22} />
              </Pressable>
            </View>
          </View>
        </GestureDetector>

        {/*
          `flexShrink` is load-bearing. The sheet has a maxHeight but no fixed
          height, so without it this wrapper keeps its full content height, the
          ScrollView never becomes scrollable, and anything past the cap is
          silently clipped — the last note in a long panel simply vanished.
        */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.scrollArea}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Near-black rather than navy. A cobalt scrim over the already-cobalt
  // workspace turned the invitation slate-grey, which read as "disabled" rather
  // than "behind a panel"; the point of the sheet is that the design stays legible.
  // Barely there, and that is the point. The dark mat already separates the
  // invitation from the porcelain sheet, so this only has to catch the
  // tap-to-dismiss and hint at depth. At the 0.4 a modal would normally use —
  // even at 0.18 — the artwork you came here to look at went grey.
  backdrop: { backgroundColor: 'rgba(8,14,32,0.08)', flex: 1 },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  // The grabber and header are one gesture surface. Making only the 4pt bar
  // draggable is a target nobody hits on the first try.
  handleArea: { flexShrink: 0, paddingTop: spacing.sm },
  scrollArea: { flexShrink: 1 },
  grabber: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 4,
    width: 38,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontFamily: typography.display, fontSize: 20, fontWeight: '600' },
  subtitle: { ...engraved, color: colors.inkMuted },
  content: { gap: spacing.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
});
