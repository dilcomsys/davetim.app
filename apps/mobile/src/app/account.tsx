import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Enter, Fade } from '@/components/motion';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SettingsFact, SettingsGroup, SettingsPanel, SettingsRow } from '@/components/settings-list';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { featureFlags } from '@/config/feature-flags';
import { exportAccountData, requestAccountDeletion, updateProfile } from '@/features/account/account-service';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { colors, engraved, radius, spacing, typography } from '@/theme/tokens';

const DELETE_PHRASE = 'HESABIMI SİL';

export default function AccountScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const currentName = typeof user?.user_metadata.full_name === 'string' ? user.user_metadata.full_name : '';
  const [fullName, setFullName] = useState(currentName);
  const [confirmation, setConfirmation] = useState('');
  // Deletion stays folded away until asked for. A permanent action does not
  // belong open on screen next to a name field you might have come here to fix.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState<'profile' | 'export' | 'delete' | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(null);
  const nameChanged = fullName.trim() !== currentName.trim();

  async function run(action: 'profile' | 'export' | 'delete') {
    setBusy(action);
    setNotice(null);
    try {
      if (action === 'profile') {
        await updateProfile(fullName);
        setNotice({ text: 'Profil güncellendi.', tone: 'info' });
      } else if (action === 'export') {
        await exportAccountData();
        trackEvent(ANALYTICS_EVENTS.accountDataExported);
        setNotice({ text: 'Verilerin JSON dosyası olarak hazırlandı.', tone: 'info' });
      } else {
        if (confirmation.trim() !== DELETE_PHRASE) throw new Error(`Devam etmek için ${DELETE_PHRASE} yazın.`);
        await requestAccountDeletion();
        trackEvent(ANALYTICS_EVENTS.accountDeletionRequested);
        await signOut();
      }
    } catch (error) {
      setNotice({ text: getErrorMessage(error), tone: 'error' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen
      action={(
        <Pressable accessibilityLabel="Geri dön" accessibilityRole="button" hitSlop={8} onPress={() => router.back()}>
          <Ionicons color={colors.ink} name="close" size={26} />
        </Pressable>
      )}
      eyebrow="HESAP VE VERİLER"
      title="Hesap ayarları">
      {!featureFlags.backendWrites ? (
        <View style={styles.lock}>
          <Ionicons color={colors.warning} name="lock-closed-outline" size={19} />
          <Text style={styles.lockText}>Profil güncelleme ve hesap silme, sunucu güvenliği doğrulanana kadar kapalı.</Text>
        </View>
      ) : null}

      <Enter>
        <SettingsGroup label="Profil">
          <SettingsFact icon="mail-outline" label="E-posta" value={user?.email ?? '—'} />
          <SettingsPanel>
            <Text style={styles.fieldLabel}>Ad soyad</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setFullName}
              placeholder="Ad soyad"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              value={fullName}
            />
            <PrimaryButton
              accessibilityLabel="Profil adını kaydet"
              disabled={!featureFlags.backendWrites || !nameChanged}
              icon="checkmark"
              loading={busy === 'profile'}
              onPress={() => void run('profile')}>
              Kaydet
            </PrimaryButton>
          </SettingsPanel>
        </SettingsGroup>
      </Enter>

      <Enter index={1}>
        <SettingsGroup label="Verilerin">
          <SettingsRow
            detail="Davetlerin, davetlilerin ve medya kayıtların JSON dosyası olarak gelir."
            icon="download-outline"
            label={busy === 'export' ? 'Hazırlanıyor…' : 'Verilerimi indir'}
            onPress={() => void run('export')}
            trailingIcon="open-outline"
          />
        </SettingsGroup>
      </Enter>

      <Enter index={2}>
        <SettingsGroup label="Tehlikeli alan">
          <SettingsRow
            danger
            detail="Davetlerini, davetlilerini ve medya kayıtlarını silme sürecine alır. Geri alınamaz."
            icon="trash-outline"
            label="Hesabımı sil"
            onPress={() => setDeleteOpen(!deleteOpen)}
            trailingIcon={deleteOpen ? 'chevron-up' : 'chevron-down'}
          />
          {deleteOpen ? (
            <SettingsPanel>
              <Text style={styles.fieldLabel}>Onaylamak için {DELETE_PHRASE} yazın</Text>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                onChangeText={setConfirmation}
                placeholder={DELETE_PHRASE}
                placeholderTextColor={colors.inkMuted}
                style={styles.input}
                value={confirmation}
              />
              <PrimaryButton
                accessibilityLabel="Hesabı kalıcı olarak silme talebi gönder"
                disabled={!featureFlags.backendWrites || confirmation.trim() !== DELETE_PHRASE}
                icon="trash-outline"
                loading={busy === 'delete'}
                onPress={() => void run('delete')}
                variant="destructive">
                Hesabımı kalıcı olarak sil
              </PrimaryButton>
            </SettingsPanel>
          ) : null}
        </SettingsGroup>
      </Enter>

      {notice ? (
        <Fade key={notice.text}>
          <View style={[styles.notice, notice.tone === 'error' ? styles.noticeError : styles.noticeInfo]}>
            <Ionicons
              color={notice.tone === 'error' ? colors.primaryText : colors.success}
              name={notice.tone === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              size={19}
            />
            <Text accessibilityLiveRegion="polite" style={[styles.noticeText, notice.tone === 'error' ? styles.noticeTextError : styles.noticeTextInfo]}>
              {notice.text}
            </Text>
          </View>
        </Fade>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lock: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  lockText: { color: colors.warning, flex: 1, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  fieldLabel: { ...engraved, color: colors.inkMuted },
  input: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: typography.body,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  notice: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  noticeError: { backgroundColor: colors.dangerSoft },
  noticeInfo: { backgroundColor: colors.successSoft },
  noticeText: { flex: 1, fontFamily: typography.bodyMedium, fontSize: 13, lineHeight: 19 },
  noticeTextError: { color: colors.primaryText },
  noticeTextInfo: { color: colors.success },
});
