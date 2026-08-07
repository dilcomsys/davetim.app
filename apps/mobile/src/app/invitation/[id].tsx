import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SettingsGroup, SettingsPanel, SettingsRow } from '@/components/settings-list';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { featureFlags } from '@/config/feature-flags';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { useAuth } from '@/features/auth/auth-provider';
import { getInvitationForOwner, manageInvitationLifecycle } from '@/features/invitations/invitation-service';
import { getPublicInvitationUrl } from '@/features/invitations/invitation-links';
import { formatEventDate } from '@/lib/format';
import { useRemoteData } from '@/lib/remote-data';
import { useRefreshOnFocus } from '@/lib/use-refresh-on-focus';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

type Action = { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; route: (id: string) => string };

const actions: Action[] = [
  { icon: 'create-outline', label: 'Düzenle', route: (id) => `/editor/${id}` },
  { icon: 'people-outline', label: 'Davetliler', route: (id) => `/guests/${id}` },
  { icon: 'stats-chart-outline', label: 'Analiz', route: (id) => `/analytics/${id}` },
  { icon: 'images-outline', label: 'QR medya', route: (id) => `/media/manage/${id}` },
];

export default function InvitationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const loadInvitation = useCallback(
    () => getInvitationForOwner(id, user?.id ?? ''),
    [id, user?.id],
  );
  const { data: invitation, error, loading, refresh, refreshing, reload } = useRemoteData(loadInvitation, Boolean(id && user));
  // Coming back from the editor, the guest list or the media screen can all
  // change what this screen shows, so it refetches whenever it regains focus.
  useRefreshOnFocus(refresh);

  async function shareInvitation() {
    if (!invitation) return;
    const url = getPublicInvitationUrl(invitation.id);
    trackEvent(ANALYTICS_EVENTS.invitationShared, { channel: 'system_share', status: invitation.status });
    await Share.share({ message: `${invitation.title}\n${url}`, title: invitation.title, url });
  }

  async function copyInvitationLink() {
    if (!invitation) return;
    await Clipboard.setStringAsync(getPublicInvitationUrl(invitation.id));
    trackEvent(ANALYTICS_EVENTS.invitationLinkCopied);
    setNotice('Davet bağlantısı panoya kopyalandı.');
  }

  async function lifecycle(action: 'archive' | 'restore' | 'duplicate' | 'delete') {
    if (!invitation) return;
    setActionBusy(true); setNotice(null);
    try {
      const result = await manageInvitationLifecycle(invitation.id, action);
      trackEvent(ANALYTICS_EVENTS.invitationLifecycleAction, { action });
      if (action === 'delete') {
        router.replace('/(tabs)/invitations');
      } else if (action === 'duplicate' && result) {
        router.replace(`/editor/${result.id}` as Href);
      } else {
        setNotice(action === 'archive' ? 'Davet arşivlendi.' : 'Davet arşivden çıkarıldı.');
        reload();
      }
    } catch (nextError) {
      setNotice(getErrorMessage(nextError));
    } finally {
      setActionBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Daveti sil', 'Bu davet, davetli kayıtları ve bağlı medya silme sürecine alınır. Bu işlem geri alınamaz.', [
      { style: 'cancel', text: 'Vazgeç' },
      { style: 'destructive', text: 'Sil', onPress: () => void lifecycle('delete') },
    ]);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.secondary} size="large" /></View>;
  }

  if (error || !invitation) {
    return (
      <View style={styles.center}>
        <Ionicons color={colors.primaryText} name="alert-circle-outline" size={38} />
        <Text style={styles.error}>{error ?? 'Davet bulunamadı.'}</Text>
        <PrimaryButton accessibilityLabel="Daveti yeniden yükle" icon="refresh-outline" onPress={() => void reload()}>Tekrar dene</PrimaryButton>
      </View>
    );
  }

  return (
    <Screen
      onRefresh={refresh}
      refreshing={refreshing}
      action={<Pressable accessibilityLabel="Geri dön" accessibilityRole="button" onPress={() => router.back()}><Ionicons color={colors.ink} name="close" size={26} /></Pressable>}
      eyebrow={invitation.status === 'published' ? 'YAYINDA' : invitation.status === 'archived' ? 'ARŞİV' : 'TASLAK'}
      title={invitation.title}>
      <View style={styles.preview}>
        {invitation.imageUrl ? (
          <Image contentFit="cover" source={invitation.imageUrl} style={styles.image} />
        ) : (
          <View style={styles.previewFallback}>
            <Ionicons color={colors.secondary} name="mail-open-outline" size={52} />
            <Text style={styles.previewTitle}>{invitation.title}</Text>
          </View>
        )}
      </View>

      <View style={styles.eventCard}>
        <InfoRow icon="calendar-outline" text={`${formatEventDate(invitation.eventDate)}${invitation.eventTime ? ` · ${invitation.eventTime}` : ''}`} />
        <InfoRow icon="location-outline" text={invitation.eventLocationName ?? 'Konum eklenmedi'} />
        <InfoRow icon="eye-outline" text={`${invitation.viewCount} görüntülenme · ${invitation.rsvpCount} yanıt`} />
      </View>

      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            accessibilityLabel={action.label}
            accessibilityRole="button"
            key={action.label}
            onPress={() => router.push(action.route(invitation.id) as Href)}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Ionicons color={colors.secondary} name={action.icon} size={23} />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      {/*
        Two ways to send an invitation, and they answer different questions.
        Presented side by side because choosing between them is the decision a
        host actually faces, and until now the screen offered only the anonymous
        one while the tracked one was buried behind the Davetliler tile.
      */}
      {invitation.status === 'published' ? (
        <SettingsGroup label="PAYLAŞ">
          <SettingsRow
            detail="Herkese aynı bağlantı. Kimin açtığı ve kimin geleceği bilinmez."
            icon="link-outline"
            label="Herkese açık bağlantı"
            onPress={() => void shareInvitation()}
            trailingIcon="share-outline"
          />
          <SettingsRow
            detail="Kopyala, sosyal medyada veya grup sohbetinde paylaş."
            icon="copy-outline"
            label="Bağlantıyı kopyala"
            onPress={() => void copyInvitationLink()}
            trailingIcon="copy-outline"
          />
          <SettingsRow
            detail={`Herkese kendi bağlantısı gider, katılım yanıtı isme bağlanır.${
              invitation.rsvpCount > 0 ? ` Şu ana kadar ${invitation.rsvpCount} yanıt.` : ''
            }`}
            icon="people-outline"
            label="Davetli listesiyle gönder"
            onPress={() => router.push(`/guests/${invitation.id}` as Href)}
          />
          <SettingsPanel>
            <Text numberOfLines={1} style={styles.shareUrl}>{getPublicInvitationUrl(invitation.id)}</Text>
            {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
          </SettingsPanel>
        </SettingsGroup>
      ) : (
        <View style={styles.draftNotice}>
          <Ionicons color={colors.warning} name="information-circle-outline" size={22} />
          <Text style={styles.draftText}>Davet yalnızca yayınlandıktan sonra anonim bağlantıyla paylaşılabilir.</Text>
        </View>
      )}

      {/*
        Rows rather than three identical secondary buttons. Delete was the same
        shape and weight as Duplicate, one tap from each other, and permanent.
      */}
      <SettingsGroup label="DAVET İŞLEMLERİ">
        <SettingsRow
          detail="Tasarımın ve bilgilerin kopyasıyla yeni bir taslak açar."
          disabled={!featureFlags.backendWrites || actionBusy}
          icon="copy-outline"
          label="Çoğalt"
          onPress={() => void lifecycle('duplicate')}
        />
        <SettingsRow
          detail={invitation.status === 'archived' ? 'Listeye geri getirir.' : 'Listeden kaldırır, silmez.'}
          disabled={!featureFlags.backendWrites || actionBusy}
          icon={invitation.status === 'archived' ? 'arrow-undo-outline' : 'archive-outline'}
          label={invitation.status === 'archived' ? 'Arşivden çıkar' : 'Arşivle'}
          onPress={() => void lifecycle(invitation.status === 'archived' ? 'restore' : 'archive')}
        />
        <SettingsRow
          danger
          detail="Davetliler ve yanıtlar dahil kalıcı olarak silinir."
          disabled={!featureFlags.backendWrites || actionBusy}
          icon="trash-outline"
          label="Sil"
          onPress={confirmDelete}
        />
        {!featureFlags.backendWrites ? (
          <SettingsPanel>
            <Text style={styles.draftText}>
              Arşivleme, çoğaltma ve silme sunucu kontrolleri tamamlanana kadar kapalı.
            </Text>
          </SettingsPanel>
        ) : null}
      </SettingsGroup>
    </Screen>
  );
}

function InfoRow({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return <View style={styles.infoRow}><Ionicons color={colors.primaryText} name={icon} size={20} /><Text style={styles.infoText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  error: { color: colors.ink, fontFamily: typography.body, fontSize: 15, textAlign: 'center' },
  preview: { ...shadow, aspectRatio: 0.78, backgroundColor: colors.plum, borderRadius: radius.lg, overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
  previewFallback: { alignItems: 'center', flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  previewTitle: { color: colors.white, fontFamily: typography.display, fontSize: 30, fontWeight: '700', textAlign: 'center' },
  eventCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  infoText: { color: colors.ink, flex: 1, fontFamily: typography.body, fontSize: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  action: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderRadius: radius.md, gap: spacing.sm, padding: spacing.lg, width: '47.8%' },
  pressed: { opacity: 0.78 },
  actionLabel: { color: colors.secondary, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '800' },
  shareUrl: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12 },
  notice: { color: colors.success, fontFamily: typography.bodyMedium, fontSize: 12 },
  draftNotice: { alignItems: 'center', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  draftText: { color: colors.warning, flex: 1, fontFamily: typography.body, fontSize: 13, lineHeight: 19 },
});
