import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { listGuests } from '@/features/guests/guest-service';
import { getInvitationForOwner } from '@/features/invitations/invitation-service';
import { shareCsv } from '@/lib/csv';
import { formatDateTime } from '@/lib/format';
import { useRemoteData } from '@/lib/remote-data';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function AnalyticsScreen() {
  const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [exportError, setExportError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [invitation, guests] = await Promise.all([
      getInvitationForOwner(invitationId, user?.id ?? ''),
      listGuests(invitationId),
    ]);
    return { guests, invitation };
  }, [invitationId, user?.id]);
  const { data, error, loading, refresh, refreshing, reload } = useRemoteData(load, Boolean(invitationId && user));
  const stats = useMemo(() => {
    const guests = data?.guests ?? [];
    const attending = guests.filter((guest) => guest.rsvpStatus === 'attending');
    return {
      attending: attending.length,
      companions: attending.reduce((total, guest) => total + guest.companionCount, 0),
      declined: guests.filter((guest) => guest.rsvpStatus === 'declined').length,
      pending: guests.filter((guest) => guest.rsvpStatus === 'pending').length,
      total: guests.length,
    };
  }, [data]);

  async function exportReport() {
    if (!data) return;
    setExportError(null);
    try {
      await shareCsv('davet-analizi.csv', [
        ['Davet', 'Durum', 'Görüntülenme', 'Toplam Davetli', 'Katılıyor', 'Ek Kişi', 'Katılamıyor', 'Bekliyor', 'Güncellendi'],
        [data.invitation.title, data.invitation.status, String(data.invitation.viewCount), String(stats.total), String(stats.attending), String(stats.companions), String(stats.declined), String(stats.pending), formatDateTime(data.invitation.updatedAt)],
      ]);
    } catch (nextError) {
      setExportError(getErrorMessage(nextError));
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.secondary} size="large" /></View>;
  if (error || !data) return <View style={styles.center}><Text style={styles.error}>{error ?? 'Analiz yüklenemedi.'}</Text><PrimaryButton accessibilityLabel="Analizi yeniden yükle" icon="refresh-outline" onPress={() => void reload()}>Tekrar dene</PrimaryButton></View>;

  const responseTotal = stats.attending + stats.declined;
  const responseRate = stats.total ? Math.round((responseTotal / stats.total) * 100) : 0;
  return (
    <Screen action={<Pressable accessibilityLabel="Davet ayrıntısına dön" onPress={() => router.back()}><Ionicons color={colors.ink} name="close" size={26} /></Pressable>} eyebrow="GERÇEK VERİ" onRefresh={refresh} refreshing={refreshing} title={`${data.invitation.title} analizi`}>
      <View style={styles.metrics}>
        <Metric icon="eye-outline" label="Görüntülenme" value={data.invitation.viewCount} />
        <Metric icon="people-outline" label="Davetli" value={stats.total} />
        <Metric icon="analytics-outline" label="Yanıt oranı" suffix="%" value={responseRate} />
        <Metric icon="person-add-outline" label="Toplam katılım" value={stats.attending + stats.companions} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>RSVP dağılımı</Text>
        <Bar color={colors.success} label="Katılıyor" total={stats.total} value={stats.attending} />
        <Bar color={colors.primaryText} label="Katılamıyor" total={stats.total} value={stats.declined} />
        <Bar color={colors.warning} label="Bekliyor" total={stats.total} value={stats.pending} />
      </View>

      <View style={styles.insight}>
        <Ionicons color={colors.secondary} name="information-circle-outline" size={24} />
        <View style={styles.insightCopy}><Text style={styles.insightTitle}>Doğrulanabilir analiz</Text><Text style={styles.insightText}>Günlük görüntülenme geçmişi backend olay tablosu doğrulanana kadar uydurulmaz; burada yalnızca mevcut sayaçlar ve gerçek RSVP kayıtları gösterilir.</Text></View>
      </View>

      {exportError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{exportError}</Text> : null}
      <PrimaryButton accessibilityLabel="Analizi CSV olarak dışa aktar" icon="download-outline" onPress={() => void exportReport()} variant="secondary">CSV raporu paylaş</PrimaryButton>
    </Screen>
  );
}

function Metric({ icon, label, suffix = '', value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; suffix?: string; value: number }) {
  return <View style={styles.metric}><Ionicons color={colors.primaryText} name={icon} size={22} /><Text style={styles.metricValue}>{value}{suffix}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Bar({ color, label, total, value }: { color: string; label: string; total: number; value: number }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  return <View style={styles.barGroup}><View style={styles.barHeader}><Text style={styles.barLabel}>{label}</Text><Text style={styles.barValue}>{value} · %{percentage}</Text></View><View style={styles.barTrack}><View style={[styles.barFill, { backgroundColor: color, width: `${percentage}%` }]} /></View></View>;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: 4, padding: spacing.lg, width: '47.8%' },
  metricValue: { color: colors.plum, fontFamily: typography.display, fontSize: 27, fontWeight: '800' },
  metricLabel: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.lg, padding: spacing.lg },
  cardTitle: { color: colors.plum, fontFamily: typography.display, fontSize: 22, fontWeight: '700' },
  barGroup: { gap: 6 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '700' },
  barValue: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12 },
  barTrack: { backgroundColor: colors.border, borderRadius: radius.pill, height: 10, overflow: 'hidden' },
  barFill: { borderRadius: radius.pill, height: '100%', minWidth: 2 },
  insight: { alignItems: 'flex-start', backgroundColor: colors.secondarySoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  insightCopy: { flex: 1, gap: 4 },
  insightTitle: { color: colors.secondary, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '800' },
  insightText: { color: colors.secondary, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  error: { color: colors.primaryText, fontFamily: typography.body, fontSize: 13, textAlign: 'center' },
});
