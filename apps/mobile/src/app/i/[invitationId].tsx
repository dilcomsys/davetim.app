import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { Engraved, GoldRule, PaperCard, paperText } from '@/components/paper-card';
import { PrimaryButton } from '@/components/primary-button';
import { createEditorDocument } from '@/features/editor/editor-model';
import { EditorCanvas } from '@/features/editor/editor-canvas';
import { getPublicInvitation } from '@/features/invitations/public-invitation-service';
import { getPublicInvitationUrl } from '@/features/invitations/invitation-links';
import { formatEventDate } from '@/lib/format';
import { useRemoteData } from '@/lib/remote-data';
import { colors, engraved, spacing, typography } from '@/theme/tokens';

export default function PublicInvitationScreen() {
  const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
  const [notice, setNotice] = useState<string | null>(null);
  const load = useCallback(() => getPublicInvitation(invitationId), [invitationId]);
  const { data: invitation, error, loading, reload } = useRemoteData(load, Boolean(invitationId));

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.secondary} size="large" /><Text style={styles.muted}>Davet açılıyor…</Text></View>;
  if (error || !invitation) {
    return <View style={styles.center}><Ionicons color={colors.primaryText} name="mail-unread-outline" size={46} /><Text style={styles.error}>{error ?? 'Davet bulunamadı.'}</Text><PrimaryButton accessibilityLabel="Daveti yeniden yükle" icon="refresh-outline" onPress={() => void reload()}>Tekrar dene</PrimaryButton></View>;
  }

  const currentInvitation = invitation;
  const document = createEditorDocument(currentInvitation, null);
  const url = getPublicInvitationUrl(currentInvitation.id);

  async function shareInvitation() {
    await Share.share({ message: `${currentInvitation.title}\n${url}`, title: currentInvitation.title, url });
  }

  async function copyLink() {
    await Clipboard.setStringAsync(url);
    setNotice('Bağlantı kopyalandı.');
  }

  /*
   * This is the page every guest opens from the shared link, and it was a
   * fixed `View`: a full-bleed invitation canvas, the message card, the share
   * buttons and the footer, none of which fit on a phone. Everything below the
   * canvas was simply cut off, so on most devices the guest could not reach the
   * event details at all. It scrolls, and it respects the notch.
   */
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><BrandMark /><Text style={styles.badge}>Davetlisiniz</Text></View>
      <EditorCanvas document={document} interactive={false} onSelect={() => undefined} selectedId={null} />
      <View style={styles.copy}>
        <PaperCard>
          <Engraved>Davetiye</Engraved>
          <Text accessibilityRole="header" style={paperText.display}>{invitation.title}</Text>
          <GoldRule />
          {document.customMessage ? <Text style={paperText.body}>{document.customMessage}</Text> : null}
          <View style={styles.details}>
            <Detail icon="calendar-outline" text={`${formatEventDate(invitation.eventDate)}${invitation.eventTime ? ` · ${invitation.eventTime}` : ''}`} />
            <Detail icon="location-outline" text={invitation.eventLocationName ?? 'Konum bilgisi yakında'} />
            {invitation.eventLocationAddress ? <Text style={styles.address}>{invitation.eventLocationAddress}</Text> : null}
          </View>
        </PaperCard>
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text> : null}
        <View style={styles.actions}>
          <PrimaryButton accessibilityLabel="Daveti paylaş" icon="share-outline" onPress={() => void shareInvitation()}>Paylaş</PrimaryButton>
          <PrimaryButton accessibilityLabel="Davet bağlantısını kopyala" icon="copy-outline" onPress={() => void copyLink()} variant="secondary">Kopyala</PrimaryButton>
        </View>
      </View>
      <Text style={styles.footer}>Davetim ile hazırlandı</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return <View style={styles.detail}><Ionicons color={colors.secondary} name={icon} size={21} /><Text style={styles.detailText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  // `gap` on a ScrollView content container, not `flex: 1`: the content is
  // taller than the viewport, which is the entire point.
  page: { gap: spacing.xl, paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  center: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  badge: { ...engraved, color: colors.secondary },
  copy: { alignItems: 'center', gap: spacing.lg },
  // Rows separated by a hairline rather than boxed in their own card: the
  // same list device the landing page uses for its steps and questions.
  details: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.sm },
  detail: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, paddingTop: spacing.md },
  detailText: { color: colors.ink, flex: 1, fontFamily: typography.bodyMedium, fontSize: 14 },
  address: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 19, marginLeft: 33 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  success: { color: colors.success, fontFamily: typography.bodyMedium, fontSize: 13 },
  footer: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, textAlign: 'center' },
  error: { color: colors.ink, fontFamily: typography.body, fontSize: 15, textAlign: 'center' },
  muted: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 14 },
});
