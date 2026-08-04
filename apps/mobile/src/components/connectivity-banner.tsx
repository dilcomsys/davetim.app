import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme/tokens';

export function ConnectivityBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => NetInfo.addEventListener((state) => {
    setOffline(state.isConnected === false || state.isInternetReachable === false);
  }), []);

  if (!offline) return null;
  return <View accessibilityLiveRegion="polite" pointerEvents="none" style={styles.banner}><Text style={styles.text}>Çevrimdışısınız · değişiklikler kaydedilemez</Text></View>;
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', backgroundColor: colors.warning, bottom: 74, left: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, position: 'absolute', right: spacing.lg, zIndex: 100 },
  text: { color: colors.white, fontFamily: typography.bodyMedium, fontSize: 12, fontWeight: '700' },
});
