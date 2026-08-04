import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { colors, spacing, typography } from '@/theme/tokens';

export default function AuthCallbackScreen() {
  const { status } = useAuth();
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;
    router.replace((flow === 'reset-password' ? '/reset-password' : '/(tabs)') as Href);
  }, [flow, router, status]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.secondary} size="large" />
      <Text style={styles.title}>Güvenli bağlantı doğrulanıyor</Text>
      <Text style={styles.text}>Bu ekranı kapatmadan kısa bir süre bekleyin.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl },
  title: { color: colors.plum, fontFamily: typography.display, fontSize: 24, fontWeight: '700' },
  text: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 15, textAlign: 'center' },
});
