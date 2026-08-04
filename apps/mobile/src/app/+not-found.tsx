import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { colors, spacing, typography } from '@/theme/tokens';

export default function NotFoundScreen() {
  return <View style={styles.page}><Ionicons color={colors.secondary} name="compass-outline" size={48} /><Text accessibilityRole="header" style={styles.title}>Bu sayfa bulunamadı.</Text><Text style={styles.copy}>Bağlantı hatalı veya artık kullanılmıyor olabilir.</Text><Link asChild href="/"><PrimaryButton accessibilityLabel="Ana sayfaya dön" icon="home-outline">Ana sayfaya dön</PrimaryButton></Link></View>;
}

const styles = StyleSheet.create({
  page: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  title: { color: colors.ink, fontFamily: typography.display, fontSize: 28, fontWeight: '700', textAlign: 'center' },
  copy: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 14, textAlign: 'center' },
});
