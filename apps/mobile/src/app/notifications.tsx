import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Enter, Fade } from '@/components/motion';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SettingsGroup, SettingsPanel } from '@/components/settings-list';
import { featureFlags } from '@/config/feature-flags';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { useNotifications } from '@/features/notifications/notification-provider';
import {
  getNotificationPreferences,
  setNotificationPreferences,
  type NotificationPreferences,
} from '@/features/notifications/notification-service';
import { useRemoteData } from '@/lib/remote-data';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/*
 * The one place notifications are asked for.
 *
 * The permission prompt is spent here rather than on first launch, because iOS
 * only ever shows it once — asking before the user has any guests means most
 * installs deny it forever and the RSVP notification, the reason the feature
 * exists, never works for them.
 *
 * The per-category switches stay visible and usable even when the OS permission
 * is off, because they also govern the local event reminders and because a
 * settings screen that hides its own contents behind a permission reads as
 * broken.
 */
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { enable, permission, refreshPermission } = useNotifications();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(null);
  // Local echo of the saved value so a switch moves the instant it is tapped.
  const [override, setOverride] = useState<NotificationPreferences | null>(null);

  const load = useCallback(() => getNotificationPreferences(), []);
  const { data, loading } = useRemoteData(load);
  const preferences = override ?? data ?? { mediaEnabled: true, rsvpEnabled: true };

  // The permission can change while the app is backgrounded — the user may have
  // just come back from the Settings app — so it is re-read on every focus
  // rather than only on mount.
  useFocusEffect(
    useCallback(() => {
      void refreshPermission();
    }, [refreshPermission]),
  );

  async function toggle(key: keyof NotificationPreferences, value: boolean) {
    const previous = preferences;
    const next = { ...preferences, [key]: value };
    // Optimistic: a switch that waits for a round trip before moving feels
    // broken, and the failure path below puts it back.
    setOverride(next);
    setNotice(null);
    try {
      setOverride(await setNotificationPreferences(next));
    } catch (error) {
      setOverride(previous);
      setNotice({ text: getErrorMessage(error), tone: 'error' });
    }
  }

  async function requestPermission() {
    setBusy(true);
    setNotice(null);
    try {
      const outcome = await enable();
      if (outcome === 'granted') setNotice({ text: 'Bildirimler açıldı.', tone: 'info' });
      else if (outcome === 'blocked') {
        setNotice({ text: 'Bildirimler cihaz ayarlarından kapatılmış. Ayarlar uygulamasından açabilirsin.', tone: 'error' });
      } else if (outcome === 'unsupported') {
        setNotice({ text: 'Bu cihazda anlık bildirim kullanılamıyor. Etkinlik hatırlatmaları yine de çalışır.', tone: 'info' });
      } else {
        setNotice({ text: 'Bildirim izni verilmedi.', tone: 'error' });
      }
    } finally {
      setBusy(false);
    }
  }

  const granted = permission === 'granted';

  return (
    <Screen
      action={(
        <Pressable accessibilityLabel="Geri dön" accessibilityRole="button" hitSlop={8} onPress={() => router.back()}>
          <Ionicons color={colors.ink} name="close" size={26} />
        </Pressable>
      )}
      eyebrow="BİLDİRİMLER"
      title="Neyden haberdar olacaksın">

      {!granted ? (
        <Enter>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIcon}>
              <Ionicons color={colors.secondary} name="notifications-outline" size={26} />
            </View>
            <Text style={styles.permissionTitle}>Anlık bildirimler kapalı</Text>
            <Text style={styles.permissionText}>
              {permission === 'blocked'
                ? 'Bildirim izni cihaz ayarlarından kapatılmış. Davetlin yanıt verdiğinde haber almak için Ayarlar uygulamasından tekrar aç.'
                : 'Davetlin katılıp katılmayacağını yazdığında ya da galeriye fotoğraf eklendiğinde anında haber alırsın.'}
            </Text>
            {permission === 'blocked' ? (
              <PrimaryButton accessibilityLabel="Cihaz ayarlarını aç" icon="open-outline" onPress={() => void Linking.openSettings()}>
                Ayarları aç
              </PrimaryButton>
            ) : (
              <PrimaryButton
                accessibilityLabel="Bildirimleri aç"
                disabled={!featureFlags.backendWrites || permission === 'unsupported'}
                icon="notifications-outline"
                loading={busy}
                onPress={() => void requestPermission()}>
                Bildirimleri aç
              </PrimaryButton>
            )}
          </View>
        </Enter>
      ) : null}

      <Enter index={1}>
        <SettingsGroup label="Bildirim türleri">
          <SettingsPanel>
            <ToggleRow
              description="Bir davetli katılacağını ya da katılamayacağını bildirdiğinde."
              disabled={loading || !featureFlags.backendWrites}
              icon="people-outline"
              label="Davetli yanıtları"
              onChange={(value) => void toggle('rsvpEnabled', value)}
              value={preferences.rsvpEnabled}
            />
            <View style={styles.rule} />
            <ToggleRow
              description="Davetlilerin QR galerine fotoğraf veya video eklediğinde."
              disabled={loading || !featureFlags.backendWrites}
              icon="images-outline"
              label="Galeri paylaşımları"
              onChange={(value) => void toggle('mediaEnabled', value)}
              value={preferences.mediaEnabled}
            />
          </SettingsPanel>
        </SettingsGroup>
      </Enter>

      <Enter index={2}>
        <SettingsGroup label="Cihazında">
          <SettingsPanel>
            <View style={styles.localRow}>
              <Ionicons color={colors.secondary} name="calendar-outline" size={21} />
              <View style={styles.localCopy}>
                <Text style={styles.localTitle}>Etkinlik hatırlatmaları</Text>
                <Text style={styles.localText}>
                  Yayındaki her davet için etkinlikten bir gün önce akşam ve etkinlik sabahı hatırlatma kurulur.
                  Bu hatırlatmalar cihazında zamanlanır; internet gerektirmez.
                </Text>
              </View>
            </View>
          </SettingsPanel>
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

function ToggleRow({
  description,
  disabled,
  icon,
  label,
  onChange,
  value,
}: {
  description: string;
  disabled: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <Ionicons color={colors.secondary} name={icon} size={21} />
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        onValueChange={onChange}
        thumbColor={colors.white}
        trackColor={{ false: colors.border, true: colors.secondary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  permissionCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  permissionIcon: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 50,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 50,
  },
  permissionTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 21, fontWeight: '700' },
  permissionText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 14, lineHeight: 21, marginBottom: spacing.xs },

  toggleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  toggleCopy: { flex: 1, gap: 2 },
  toggleLabel: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '700' },
  toggleDescription: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  rule: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginVertical: spacing.md },

  localRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  localCopy: { flex: 1, gap: 3 },
  localTitle: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '700' },
  localText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },

  notice: { alignItems: 'center', borderRadius: radius.sm, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  noticeError: { backgroundColor: colors.dangerSoft },
  noticeInfo: { backgroundColor: colors.successSoft },
  noticeText: { flex: 1, fontFamily: typography.bodyMedium, fontSize: 13, lineHeight: 19 },
  noticeTextError: { color: colors.primaryText },
  noticeTextInfo: { color: colors.success },
});
