import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { Engraved, GoldRule, PaperCard, paperText } from '@/components/paper-card';
import { PrimaryButton } from '@/components/primary-button';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { featureFlags } from '@/config/feature-flags';
import type { PublicRsvpContext, RsvpStatus } from '@/domain/models';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { getPublicRsvpContext, submitRsvp } from '@/features/guests/guest-service';
import { formatEventDate } from '@/lib/format';
import { useRemoteData } from '@/lib/remote-data';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function RsvpScreen() {
  const { guestToken } = useLocalSearchParams<{ guestToken: string }>();
  const load = useCallback(() => getPublicRsvpContext(guestToken), [guestToken]);
  const { data, error, loading, reload } = useRemoteData(load, Boolean(guestToken));

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.secondary} size="large" /></View>;
  if (error || !data) return <View style={styles.center}><Ionicons color={colors.primaryText} name="alert-circle-outline" size={42} /><Text style={styles.error}>{error ?? 'RSVP bağlantısı açılamadı.'}</Text><PrimaryButton accessibilityLabel="RSVP bağlantısını yeniden yükle" icon="refresh-outline" onPress={() => void reload()}>Tekrar dene</PrimaryButton></View>;
  return <RsvpForm context={data} guestToken={guestToken} />;
}

function RsvpForm({ context: initialContext, guestToken }: { context: PublicRsvpContext; guestToken: string }) {
  const [context, setContext] = useState(initialContext);
  const [status, setStatus] = useState<Exclude<RsvpStatus, 'pending'>>(context.guest.rsvpStatus === 'declined' ? 'declined' : 'attending');
  const [companionCount, setCompanionCount] = useState(context.guest.companionCount);
  const [dietaryRestrictions, setDietaryRestrictions] = useState(context.guest.dietaryRestrictions ?? '');
  const [notes, setNotes] = useState(context.guest.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(context.guest.rsvpStatus !== 'pending');

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const updated = await submitRsvp({ companionCount, dietaryRestrictions, guestToken, notes, status });
      trackEvent(ANALYTICS_EVENTS.rsvpSubmitted, { companion_count: companionCount, status });
      setContext(updated);
      setSuccess(true);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  /*
   * A guest opens this from a link, on whatever phone they own, and answers two
   * free-text fields. As a fixed `View` the form ran past the bottom of the
   * screen before the keyboard was even up, so the note field and the submit
   * button were unreachable on anything smaller than a Pro Max — the one action
   * the whole page exists for.
   */
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <BrandMark />
      <PaperCard>
        <Engraved>Yanıtınızı bekliyoruz</Engraved>
        <Text accessibilityRole="header" style={paperText.display}>Merhaba {context.guest.fullName}</Text>
        <GoldRule />
        <Text style={styles.subtitle}>{context.invitation.title}</Text>
        <Text style={paperText.body}>{formatEventDate(context.invitation.eventDate)}{context.invitation.eventTime ? ` · ${context.invitation.eventTime}` : ''}</Text>
      </PaperCard>

      <View style={styles.card}>
        {success ? <View style={styles.successBox}><Ionicons color={colors.success} name="checkmark-circle-outline" size={24} /><Text style={styles.successText}>Yanıtınız kaydedildi. Dilediğiniz zaman bu bağlantıdan güncelleyebilirsiniz.</Text></View> : null}
        {!featureFlags.backendWrites ? <View style={styles.lockBox}><Ionicons color={colors.warning} name="shield-outline" size={21} /><Text style={styles.lockText}>Yanıt gönderimi staging güvenlik kontrolü tamamlanana kadar kilitli.</Text></View> : null}
        <Text style={styles.label}>Katılabilecek misiniz?</Text>
        <View style={styles.statusRow}>
          <Choice active={status === 'attending'} icon="checkmark-circle-outline" label="Katılıyorum" onPress={() => setStatus('attending')} />
          <Choice active={status === 'declined'} icon="close-circle-outline" label="Katılamıyorum" onPress={() => setStatus('declined')} />
        </View>
        {status === 'attending' ? (
          <View style={styles.field}>
            <Text style={styles.label}>Yanınızdaki kişi sayısı</Text>
            <View style={styles.counter}><Pressable accessibilityLabel="Kişi sayısını azalt" onPress={() => setCompanionCount((value) => Math.max(0, value - 1))} style={styles.counterButton}><Ionicons name="remove" size={20} /></Pressable><Text style={styles.counterValue}>{companionCount}</Text><Pressable accessibilityLabel="Kişi sayısını artır" onPress={() => setCompanionCount((value) => Math.min(20, value + 1))} style={styles.counterButton}><Ionicons name="add" size={20} /></Pressable></View>
          </View>
        ) : null}
        <Field label="Beslenme notu" onChangeText={setDietaryRestrictions} placeholder="Alerji veya tercih (isteğe bağlı)" value={dietaryRestrictions} />
        <Field label="Notunuz" multiline onChangeText={setNotes} placeholder="Davet sahibine iletmek istediğiniz not" value={notes} />
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        <PrimaryButton accessibilityLabel="RSVP yanıtını kaydet" disabled={!featureFlags.backendWrites} icon="send-outline" loading={saving} onPress={() => void submit()}>Yanıtı kaydet</PrimaryButton>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Choice({ active, icon, label, onPress }: { active: boolean; icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Ionicons color={active ? colors.white : colors.secondary} name={icon} size={22} /><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>;
}

function Field({ label, multiline, onChangeText, placeholder, value }: { label: string; multiline?: boolean; onChangeText: (value: string) => void; placeholder: string; value: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput multiline={multiline} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.inkMuted} style={[styles.input, multiline && styles.multiline]} value={value} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  flex: { flex: 1 },
  page: { gap: spacing.xl, padding: spacing.xl, paddingBottom: spacing.xxxl },
  center: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  subtitle: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.lg, padding: spacing.xl },
  successBox: { alignItems: 'flex-start', backgroundColor: colors.successSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  successText: { color: colors.success, flex: 1, fontFamily: typography.body, fontSize: 13, lineHeight: 19 },
  lockBox: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  lockText: { color: colors.warning, flex: 1, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  label: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  choice: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderColor: colors.secondarySoft, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: 5, padding: spacing.md },
  choiceActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  choiceText: { color: colors.secondary, fontFamily: typography.bodyMedium, fontSize: 12, fontWeight: '800' },
  choiceTextActive: { color: colors.white },
  field: { gap: spacing.sm },
  input: { backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, fontFamily: typography.body, fontSize: 14, minHeight: 46, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  counter: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  counterButton: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderRadius: radius.sm, height: 40, justifyContent: 'center', width: 40 },
  counterValue: { color: colors.ink, fontFamily: typography.display, fontSize: 22, minWidth: 38, textAlign: 'center' },
  error: { color: colors.primaryText, fontFamily: typography.body, fontSize: 13 },
});
