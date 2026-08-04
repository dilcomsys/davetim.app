import Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Enter, Fade, Tap } from '@/components/motion';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SettingsGroup, SettingsRow } from '@/components/settings-list';
import { featureFlags } from '@/config/feature-flags';
import { rewardedFeatures } from '@/features/ads/rewarded-feature';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { openSupportMail } from '@/lib/contact-link';
import { SUPPORT_ADDRESS } from '@/lib/mailto';
import { colors, engraved, radius, spacing, typography } from '@/theme/tokens';

const legalItems = [
  { icon: 'shield-checkmark-outline' as const, label: 'Gizlilik politikası', href: '/legal/privacy' },
  { icon: 'document-text-outline' as const, label: 'Kullanım koşulları', href: '/legal/terms' },
  { icon: 'reader-outline' as const, label: 'KVKK aydınlatma metni', href: '/legal/kvkk' },
];

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const fullName = typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name : null;
  const displayName = fullName || 'Davetim kullanıcısı';
  const avatarLabel = (fullName || user?.email || 'D').slice(0, 1).toLocaleUpperCase('tr-TR');
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [contactNotice, setContactNotice] = useState<string | null>(null);

  async function contact(subject: string) {
    const outcome = await openSupportMail(subject);
    setContactNotice(outcome.kind === 'opened'
      ? null
      : `Bu cihazda e-posta uygulaması bulunamadı. ${outcome.address} panoya kopyalandı.`);
  }

  async function submitSignOut() {
    setSignOutError(null);
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(getErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen eyebrow="Hesap" title="Davetim deneyimin">
      {/* The identity card is the way into account settings, so the row that used
          to say "Hesap ve veriler" is gone: one door instead of two. */}
      <Enter>
        <Tap
          accessibilityHint="Profil, veri indirme ve hesap silme ayarlarını açar"
          accessibilityLabel={`${displayName} hesap ayarları`}
          accessibilityRole="button"
          onPress={() => router.push('/account' as Href)}
          scaleTo={0.98}
          style={styles.identityCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{avatarLabel}</Text></View>
          <View style={styles.identityCopy}>
            <Text numberOfLines={1} style={styles.identityName}>{displayName}</Text>
            <Text numberOfLines={1} style={styles.identityEmail}>{user?.email}</Text>
          </View>
          <Ionicons color={colors.onPlum} name="chevron-forward" size={20} />
        </Tap>
      </Enter>

      <Enter index={1}>
        <SettingsGroup label="Reklamla açılabilecek haklar">
          {rewardedFeatures.map((feature) => (
            <View key={feature.key} style={styles.rewardRow}>
              <Ionicons color={colors.primaryText} name="play-circle-outline" size={21} />
              <View style={styles.rewardCopy}>
                <Text style={styles.rewardTitle}>{feature.title}</Text>
                <Text style={styles.rewardText}>{feature.description}</Text>
                {/* The cost sits under the description rather than in a trailing
                    pill. As a pill it had to compete with the description for
                    width and broke "1 reklam · 1 çıktı" across three lines. */}
                <Text style={styles.rewardCost}>{feature.rewardLabel}</Text>
              </View>
            </View>
          ))}
        </SettingsGroup>
      </Enter>
      <Text style={styles.groupFootnote}>
        {featureFlags.rewardedAds
          ? 'Reklam izlemek zorunlu değil. Her reklam yalnızca seçtiğin tek bir hakkı açar.'
          : 'Canlı reklam gösterimi ve ödül kaydı bu sürümde kapalı.'}
      </Text>

      <Enter index={2}>
        <SettingsGroup label="Bildirimler">
          <SettingsRow
            detail="Davetli yanıtları, galeri paylaşımları ve etkinlik hatırlatmaları"
            icon="notifications-outline"
            label="Bildirim ayarları"
            onPress={() => router.push('/notifications' as Href)}
          />
        </SettingsGroup>
      </Enter>

      <Enter index={3}>
        <SettingsGroup label="Yardım">
          {/* The address is shown, not just linked. If the mail client never
              opens, the row still tells you where to write. */}
          <SettingsRow
            detail={SUPPORT_ADDRESS}
            icon="help-circle-outline"
            label="Destek"
            onPress={() => void contact('Davetim Destek')}
            trailingIcon="open-outline"
          />
          {/* Store policy requires a reachable ad-reporting path wherever
              rewarded ads can appear. */}
          <SettingsRow
            detail={SUPPORT_ADDRESS}
            icon="flag-outline"
            label="Reklam bildir"
            onPress={() => void contact('Davetim reklam bildirimi')}
            trailingIcon="open-outline"
          />
        </SettingsGroup>
      </Enter>
      {contactNotice ? (
        <Fade key={contactNotice}>
          <View style={styles.contactNotice}>
            <Ionicons color={colors.secondary} name="clipboard-outline" size={18} />
            <Text accessibilityLiveRegion="polite" style={styles.contactNoticeText}>{contactNotice}</Text>
          </View>
        </Fade>
      ) : null}

      <Enter index={4}>
        <SettingsGroup label="Yasal">
          {legalItems.map((item) => (
            <SettingsRow icon={item.icon} key={item.href} label={item.label} onPress={() => router.push(item.href as Href)} />
          ))}
        </SettingsGroup>
      </Enter>

      <Text style={styles.about}>
        Davetim ile dijital davet tasarlar, bağlantıyla paylaşır ve katılım yanıtlarını takip edersin.
        Uygulama içi satın alma veya abonelik yok; tüm temel özellikler ücretsiz.
        {'\n\n'}
        Yayıncı: Diligent Computer Systems & Digital Commerce — Dilek Aydemir.
      </Text>

      {signOutError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{signOutError}</Text> : null}
      <PrimaryButton accessibilityLabel="Hesaptan çıkış yap" icon="log-out-outline" loading={signingOut} onPress={submitSignOut} variant="secondary">
        Çıkış yap
      </PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    alignItems: 'center',
    backgroundColor: colors.plum,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  avatar: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 },
  // The card and the avatar are both dark fills, so their text has to be
  // light. inkMuted on the navy card was unreadable.
  avatarText: { color: colors.white, fontFamily: typography.display, fontSize: 23, fontWeight: '800' },
  identityCopy: { flex: 1, gap: 3 },
  identityName: { color: colors.white, fontFamily: typography.bodyMedium, fontSize: 16, fontWeight: '800' },
  identityEmail: { color: colors.onPlum, fontFamily: typography.body, fontSize: 13 },

  rewardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rewardCopy: { flex: 1, gap: 2 },
  rewardTitle: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '700' },
  rewardText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 18 },
  rewardCost: { ...engraved, color: colors.primaryText, marginTop: 4 },

  contactNotice: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: -spacing.md,
    padding: spacing.md,
  },
  contactNoticeText: { color: colors.secondary, flex: 1, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },

  groupFootnote: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 19, marginTop: -spacing.md, paddingHorizontal: spacing.xs },
  about: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 20, paddingHorizontal: spacing.xs },
  error: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 13 },
});
