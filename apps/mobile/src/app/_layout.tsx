import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAnalyticsBootstrap } from '@/features/analytics/use-analytics-bootstrap';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { NotificationProvider } from '@/features/notifications/notification-provider';
import { PromptProvider } from '@/features/prompts/prompt-provider';
import { ConnectivityBanner } from '@/components/connectivity-banner';
import { colors, spacing, typography } from '@/theme/tokens';
import { PrimaryButton } from '@/components/primary-button';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <View style={styles.errorBoundary}><Text accessibilityRole="header" style={styles.errorTitle}>Bir şeyler yolunda gitmedi.</Text><Text style={styles.loadingText}>Güvenli biçimde yeniden deneyebilir veya uygulamayı tekrar açabilirsiniz.</Text><PrimaryButton accessibilityLabel="Ekranı yeniden dene" icon="refresh-outline" onPress={retry}>Tekrar dene</PrimaryButton></View>;
}

function RootNavigator() {
  const { status } = useAuth();
  useAnalyticsBootstrap();

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.secondary} size="large" />
        <Text style={styles.loadingText}>Davetlerin hazırlanıyor…</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.canvas },
        headerShown: false,
      }}>
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="invitation/[id]" />
        <Stack.Screen name="editor/[invitationId]" />
        <Stack.Screen name="guests/[invitationId]" />
        <Stack.Screen name="analytics/[invitationId]" />
        <Stack.Screen name="media/manage/[invitationId]" />
        <Stack.Screen name="account" />
        <Stack.Screen name="notifications" />
      </Stack.Protected>
      <Stack.Protected guard={status !== 'authenticated'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="i/[invitationId]" />
      <Stack.Screen name="rsvp/[guestToken]" />
      <Stack.Screen name="media/[qrCode]" />
      <Stack.Screen name="legal/[document]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          {/* Prompts wrap the navigator so a blocking update sheet covers every
              route, including the auth stack — an unsupported build must not be
              able to sign in and start writing. */}
          <NotificationProvider>
            <PromptProvider>
              <RootNavigator />
              <ConnectivityBanner />
            </PromptProvider>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.md, justifyContent: 'center' },
  loadingText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 15 },
  errorBoundary: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  errorTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 28, fontWeight: '700', textAlign: 'center' },
});
