import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { Link, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import type { InvitationStatus } from '@/domain/models';
import { listInvitations } from '@/features/invitations/invitation-service';
import { useAuth } from '@/features/auth/auth-provider';
import { formatEventDate } from '@/lib/format';
import { useRemoteData } from '@/lib/remote-data';
import { useRefreshOnFocus } from '@/lib/use-refresh-on-focus';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

const statusLabel = { archived: 'Arşiv', draft: 'Taslak', published: 'Yayında' } as const;

// Archive is deliberately last: it is where invitations go to stop being work.
const statusFilters: { label: string; value: InvitationStatus | 'all' }[] = [
  { label: 'Tümü', value: 'all' },
  { label: 'Taslak', value: 'draft' },
  { label: 'Yayında', value: 'published' },
  { label: 'Arşiv', value: 'archived' },
];

export default function InvitationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<InvitationStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const loadInvitations = useCallback(() => listInvitations(user?.id ?? ''), [user?.id]);
  const { data = [], error, loading, refresh, refreshing, reload } = useRemoteData(
    loadInvitations,
    Boolean(user),
  );
  useRefreshOnFocus(refresh);

  const invitations = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => ({
    all: invitations.length,
    archived: invitations.filter((item) => item.status === 'archived').length,
    draft: invitations.filter((item) => item.status === 'draft').length,
    published: invitations.filter((item) => item.status === 'published').length,
  }), [invitations]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    return invitations.filter((invitation) => (status === 'all' || invitation.status === status)
      && (!normalized
        || invitation.title.toLocaleLowerCase('tr-TR').includes(normalized)
        || invitation.eventLocationName?.toLocaleLowerCase('tr-TR').includes(normalized)));
  }, [invitations, query, status]);

  // Two different empty states. "You have none at all" wants the call to
  // action; "none match this filter" wants the filter back, and offering to
  // create an invitation there reads as if the app had lost the other ones.
  const emptyLibrary = !loading && !error && invitations.length === 0;
  const emptyFilter = !loading && !error && invitations.length > 0 && visible.length === 0;

  return (
    <Screen eyebrow="Kontrol merkezi" onRefresh={refresh} refreshing={refreshing} title="Davetlerin">
      {loading ? <ActivityIndicator color={colors.secondary} size="large" /> : null}
      {error ? (
        <Pressable accessibilityRole="button" onPress={() => void reload()} style={styles.stateCard}>
          <Ionicons color={colors.primaryText} name="refresh-outline" size={30} />
          <Text style={styles.emptyTitle}>{error}</Text>
          <Text style={styles.emptyText}>Tekrar denemek için dokunun.</Text>
        </Pressable>
      ) : null}
      {emptyLibrary ? (
        <View style={styles.stateCard}>
          <View style={styles.iconWrap}><Ionicons color={colors.secondary} name="mail-open-outline" size={44} /></View>
          <Text style={styles.emptyTitle}>Henüz bir davetin yok</Text>
          <Text style={styles.emptyText}>Bir şablon seçerek ilk taslağını oluştur.</Text>
          <Link asChild href="/(tabs)/templates">
            <PrimaryButton accessibilityLabel="İlk daveti oluştur">İlk daveti oluştur</PrimaryButton>
          </Link>
        </View>
      ) : null}

      {invitations.length > 0 ? (
        <>
          <View style={styles.searchWrap}>
            <Ionicons color={colors.inkMuted} name="search-outline" size={20} />
            <TextInput
              accessibilityLabel="Davet ara"
              onChangeText={setQuery}
              placeholder="Davet adı veya mekân ara"
              placeholderTextColor={colors.inkMuted}
              style={styles.search}
              value={query}
            />
            {query ? (
              <Pressable accessibilityLabel="Aramayı temizle" accessibilityRole="button" hitSlop={8} onPress={() => setQuery('')}>
                <Ionicons color={colors.inkMuted} name="close-circle" size={18} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.filterRow}>
            {statusFilters.map((filter) => (
              <Pressable
                accessibilityLabel={`${filter.label} filtresi, ${counts[filter.value]} davet`}
                accessibilityRole="button"
                accessibilityState={{ selected: status === filter.value }}
                key={filter.value}
                onPress={() => setStatus(filter.value)}
                style={[styles.filter, status === filter.value && styles.filterActive]}>
                <Text style={[styles.filterText, status === filter.value && styles.filterTextActive]}>
                  {filter.label} {counts[filter.value]}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {emptyFilter ? (
        <View style={styles.stateCard}>
          <Ionicons color={colors.inkMuted} name="funnel-outline" size={30} />
          <Text style={styles.emptyTitle}>Bu filtrede davet yok</Text>
          <Text style={styles.emptyText}>Aramayı veya durum seçimini değiştirin.</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {visible.map((invitation) => (
          <Pressable
            accessibilityLabel={`${invitation.title} davetini aç`}
            accessibilityRole="button"
            key={invitation.id}
            onPress={() => router.push(`/invitation/${invitation.id}` as Href)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.thumbnail}>
              {invitation.imageUrl ? <Image contentFit="cover" source={invitation.imageUrl} style={styles.image} /> : <Ionicons color={colors.secondary} name="mail-outline" size={30} />}
            </View>
            <View style={styles.cardCopy}>
              <View style={styles.cardTop}>
                <Text numberOfLines={1} style={styles.cardTitle}>{invitation.title}</Text>
                <Text style={[styles.status, invitation.status === 'published' && styles.statusPublished]}>{statusLabel[invitation.status]}</Text>
              </View>
              {/* `formatEventDate` and not the raw column: the row was printing
                  the stored "2026-09-12" while every other surface showed a
                  written-out Turkish date. */}
              <Text style={styles.meta}>{formatEventDate(invitation.eventDate)} · {invitation.eventLocationName ?? 'Konum eklenmedi'}</Text>
              <View style={styles.metrics}>
                <Text style={styles.metric}><Ionicons name="eye-outline" size={14} /> {invitation.viewCount}</Text>
                <Text style={styles.metric}><Ionicons name="people-outline" size={14} /> {invitation.rsvpCount}</Text>
              </View>
            </View>
            <Ionicons color={colors.inkMuted} name="chevron-forward" size={20} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stateCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.xxxl },
  iconWrap: { alignItems: 'center', backgroundColor: colors.surfaceWarm, borderRadius: radius.pill, height: 82, justifyContent: 'center', width: 82 },
  emptyTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  search: { color: colors.ink, flex: 1, fontFamily: typography.body, fontSize: 15, minHeight: 50 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  filterActive: { backgroundColor: colors.plum, borderColor: colors.plum },
  filterText: { color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 13 },
  filterTextActive: { color: colors.white, fontWeight: '700' },
  list: { gap: spacing.md },
  card: { ...shadow, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  pressed: { opacity: 0.82 },
  thumbnail: { alignItems: 'center', backgroundColor: colors.surfaceWarm, borderRadius: radius.sm, height: 74, justifyContent: 'center', overflow: 'hidden', width: 58 },
  image: { height: '100%', width: '100%' },
  cardCopy: { flex: 1, gap: 6 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  cardTitle: { color: colors.ink, flex: 1, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '800' },
  status: { backgroundColor: colors.surfaceWarm, borderRadius: radius.pill, color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 9, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4 },
  statusPublished: { backgroundColor: colors.successSoft, color: colors.success },
  meta: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12 },
  metrics: { flexDirection: 'row', gap: spacing.md },
  metric: { color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 11 },
});
