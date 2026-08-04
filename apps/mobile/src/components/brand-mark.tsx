import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, typography } from '@/theme/tokens';

/*
 * The Davetim seal, drawn to match apps/landing/src/Seal.tsx exactly.
 *
 * The D is a path rather than text so the two platforms render the same
 * letterform instead of each substituting its own serif. The previous mark was
 * built from a rotated View and a border-triangle, which read as a clip-art
 * envelope; this is the monogram a printer would strike on a davetiye.
 *
 * Change this and the landing seal together, or the brand splits in two.
 */

export function SealMark({ size = 40, tone = 'dark' }: { size?: number; tone?: 'dark' | 'light' }) {
  const ring = tone === 'light' ? 'rgba(250, 248, 243, 0.85)' : colors.secondary;
  const hairline = tone === 'light' ? 'rgba(250, 248, 243, 0.4)' : 'rgba(27, 63, 160, 0.35)';
  const letter = tone === 'light' ? colors.canvas : colors.plum;

  return (
    <Svg height={size} viewBox="0 0 64 64" width={size}>
      <Circle cx="32" cy="32" fill="none" r="30.6" stroke={ring} strokeWidth="1.5" />
      <Circle cx="32" cy="32" fill="none" r="26.6" stroke={hairline} strokeWidth="0.8" />
      <Path
        d="M24 19.6h9.6c8.1 0 13.4 5 13.4 12.4S41.7 44.4 33.6 44.4H24Zm5.8 4.9v15h3.6c4.7 0 7.6-2.9 7.6-7.5s-2.9-7.5-7.6-7.5Z"
        fill={letter}
        fillRule="evenodd"
      />
      <Rect fill={letter} height="2.3" width="9.4" x="20.4" y="19.6" />
      <Rect fill={letter} height="2.3" width="9.4" x="20.4" y="42.1" />
      <Circle cx="5.4" cy="32" fill={colors.gold} r="1.5" />
      <Circle cx="58.6" cy="32" fill={colors.gold} r="1.5" />
    </Svg>
  );
}

export function BrandMark() {
  return (
    <View accessibilityLabel="Davetim" accessible style={styles.root}>
      <SealMark size={38} />
      <Text style={styles.wordmark}>davetim</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  wordmark: {
    color: colors.plum,
    fontFamily: typography.display,
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
});
