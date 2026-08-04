import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/*
 * Framer Motion is DOM-only — it has no React Native renderer — so the motion
 * vocabulary the web app uses is rebuilt here on Reanimated, which is already a
 * dependency because the canvas drags through it. These three primitives cover
 * everything the redesign needs: staggered entrances, position transitions and
 * press feedback. Import from here rather than reaching for Reanimated directly
 * so the timings stay in one place.
 */

// One spring for the whole app. Sheets, presses and dock swaps all settle at the
// same rate, which is what makes separate animations read as one interface.
export const springConfig = { damping: 20, mass: 0.6, stiffness: 220 } as const;

const STAGGER_MS = 45;
const STAGGER_CAP = 6;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type EnterProps = PropsWithChildren<{
  /** Position in a list. Later items wait longer, up to a cap so long lists stay snappy. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}>;

/** Rises and fades in. For cards and rows arriving as a group. */
export function Enter({ children, index = 0, style }: EnterProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(260).delay(Math.min(index, STAGGER_CAP) * STAGGER_MS)}
      layout={LinearTransition.springify().damping(springConfig.damping).stiffness(springConfig.stiffness)}
      style={style}>
      {children}
    </Animated.View>
  );
}

/** Fades in place. For content that swaps inside a container that is already visible. */
export function Fade({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <Animated.View entering={FadeIn.duration(180)} style={style}>{children}</Animated.View>;
}

type TapProps = PressableProps & {
  /** How far down the control travels while held. Small controls need less. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pressable that dips under the finger. Replaces the `pressed && styles.pressed`
 * opacity flicker, which reads as a repaint rather than as touch.
 */
export function Tap({ children, scaleTo = 0.96, style, ...props }: TapProps) {
  const scale = useSharedValue(1);
  // `.get()`/`.set()` rather than `.value`: the React Compiler lint treats a
  // `.value` assignment as mutating something React owns, and these accessors
  // are the API Reanimated added for exactly that reason.
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        scale.set(withSpring(scaleTo, springConfig));
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withTiming(1, { duration: 140 }));
        props.onPressOut?.(event);
      }}
      style={[style, animatedStyle]}>
      {children}
    </AnimatedPressable>
  );
}
