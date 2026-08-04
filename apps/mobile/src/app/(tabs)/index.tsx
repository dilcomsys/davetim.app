import Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import type { Invitation } from '@/domain/models';
import { useAuth } from '@/features/auth/auth-provider';
import { listInvitations } from '@/features/invitations/invitation-service';
import { formatEventDate } from '@/lib/format';
import { useRemoteData } from '@/lib/remote-data';
import { useRefreshOnFocus } from '@/lib/use-refresh-on-focus';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const load = useCallback(() => listInvitations(user?.id ?? ''), [user?.id]);
  const { data = [], error, loading, refresh, refreshing, reload } = useRemoteData(load, Boolean(user));
  useRefreshOnFocus(refresh);
  const fullName = typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name : '';
  const firstName = fullName.trim().split(/\s+/)[0] || 'merhaba';
  const stats = useMemo(() => ({
    invitations: data?.length ?? 0,
    published: data?.filter((item) => item.status === 'published').length ?? 0,
    rsvps: data?.reduce((sum, item) => sum + item.rsvpCount, 0) ?? 0,
    views: data?.reduce((sum, item) => sum + item.viewCount, 0) ?? 0,
  }), [data]);
  const recent = data?.slice(0, 3) ?? [];

  return (
    <Screen eyebrow="BUGÜN" onRefresh={refresh} refreshing={refreshing} title={`${firstName}, davetlerin burada.`}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons color={colors.secondary} name="sparkles" size={26} /></View>
        <View style={styles.heroCopy}><Text style={styles.heroTitle}>{stats.published > 0 ? `${stats.published} davetin yayında` : 'Yeni bir hikâye başlat'}</Text><Text style={styles.heroText}>Tasarla, paylaş ve yanıtları tek yerden izle.</Text></View>
        <PrimaryButton accessibilityLabel="Yeni davet oluşturmak için şablon seç" icon="add" onPress={() => router.push('/(tabs)/templates')}>Yeni davet</PrimaryButton>
      </View>

      <View style={styles.stats}>
        <Stat icon="mail-outline" label="Toplam davet" value={stats.invitations} />
        <Stat icon="people-outline" label="Yanıt" value={stats.rsvps} />
        <Stat icon="eye-outline" label="Görüntüleme" value={stats.views} />
      </View>

      <View style={styles.sectionHeader}><Text accessibilityRole="header" style={styles.sectionTitle}>Son davetler</Text><Pressable onPress={() => router.push('/(tabs)/invitations')}><Text style={styles.link}>Tümünü gör</Text></Pressable></View>
      {loading ? <View style={styles.state}><Text style={styles.helper}>Davetler yükleniyor…</Text></View> : null}
      {error ? <Pressable onPress={() => void reload()} style={styles.state}><Text style={styles.error}>{error}</Text><Text style={styles.helper}>Tekrar denemek için dokunun.</Text></Pressable> : null}
      {!loading && !error && recent.length === 0 ? <View style={styles.empty}><Ionicons color={colors.secondary} name="mail-open-outline" size={38} /><Text style={styles.emptyTitle}>Henüz davetin yok</Text><Text style={styles.helper}>Bir şablon seçerek ilk davetini hazırlayabilirsin.</Text></View> : null}
      <View style={styles.list}>{recent.map((invitation) => <InvitationRow invitation={invitation} key={invitation.id} onPress={() => router.push(`/invitation/${invitation.id}` as Href)} />)}</View>

      <View style={styles.rewardCard}><Ionicons color={colors.primaryText} name="play-circle-outline" size={27} /><View style={styles.heroCopy}><Text style={styles.rewardTitle}>Reklam yalnızca sen seçersen</Text><Text style={styles.rewardText}>Temel davet ve RSVP akışları reklamsızdır. Ödüllü reklamlar yalnızca seçtiğin tekil ek hakkı açar.</Text></View></View>
    </Screen>
  );
}

function Stat({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: number }) {
  return <View style={styles.stat}><Ionicons color={colors.secondary} name={icon} size={21} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function InvitationRow({ invitation, onPress }: { invitation: Invitation; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.invitation, pressed && styles.pressed]}><View style={styles.invitationIcon}><Ionicons color={invitation.status === 'published' ? colors.success : colors.warning} name={invitation.status === 'published' ? 'radio-button-on' : 'create-outline'} size={20} /></View><View style={styles.invitationCopy}><Text numberOfLines={1} style={styles.invitationTitle}>{invitation.title}</Text><Text style={styles.helper}>{formatEventDate(invitation.eventDate)} · {invitation.rsvpCount} yanıt</Text></View><Ionicons color={colors.inkMuted} name="chevron-forward" size={18} /></Pressable>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'flex-start', backgroundColor: colors.plum, borderRadius: radius.lg, gap: spacing.md, padding: spacing.xl },
  heroIcon: { alignItems: 'center', backgroundColor: colors.surfaceWarm, borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 },
  heroCopy: { flex: 1, gap: spacing.xs },
  heroTitle: { color: colors.white, fontFamily: typography.display, fontSize: 25, fontWeight: '700' },
  // `onPlum` is the pale blue for text sitting on the navy hero. It is not a
  // general body colour: reused on the cream reward card below it was invisible.
  heroText: { color: colors.onPlum, fontFamily: typography.body, fontSize: 13, lineHeight: 19 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: 3, padding: spacing.md },
  statValue: { color: colors.ink, fontFamily: typography.display, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 10, textAlign: 'center' },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: colors.plum, fontFamily: typography.display, fontSize: 25, fontWeight: '700' },
  link: { color: colors.secondary, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '700' },
  state: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.sm, padding: spacing.xl },
  error: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 13, textAlign: 'center' },
  helper: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  empty: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderStyle: 'dashed', borderWidth: 1, gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 20, fontWeight: '700' },
  list: { gap: spacing.sm },
  invitation: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  pressed: { opacity: 0.76 },
  invitationIcon: { alignItems: 'center', backgroundColor: colors.surfaceWarm, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 },
  invitationCopy: { flex: 1, gap: 2 },
  invitationTitle: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '700' },
  rewardCard: { alignItems: 'flex-start', backgroundColor: colors.surfaceWarm, borderColor: colors.gold, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  rewardTitle: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '800' },
  rewardText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 19 },
});
