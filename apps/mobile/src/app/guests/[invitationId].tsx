import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { featureFlags, publicAppOrigin } from '@/config/feature-flags';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { bulkImportGuests, listGuests, manageGuest } from '@/features/guests/guest-service';
import { parseCsv, shareCsv } from '@/lib/csv';
import { useRemoteData } from '@/lib/remote-data';
import { useRefreshOnFocus } from '@/lib/use-refresh-on-focus';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const labels = { attending: 'Katılıyor', declined: 'Katılamıyor', pending: 'Bekleniyor' } as const;

export default function GuestsScreen() {
  const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
  const router = useRouter();
  const load = useCallback(() => listGuests(invitationId), [invitationId]);
  const { data = [], error, loading, refresh, refreshing, reload } = useRemoteData(load, Boolean(invitationId));
  useRefreshOnFocus(refresh);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | keyof typeof labels>('all');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const stats = useMemo(() => ({
    attending: (data ?? []).filter((guest) => guest.rsvpStatus === 'attending').length,
    declined: (data ?? []).filter((guest) => guest.rsvpStatus === 'declined').length,
    pending: (data ?? []).filter((guest) => guest.rsvpStatus === 'pending').length,
  }), [data]);
  const visibleGuests = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    return (data ?? []).filter((guest) => (statusFilter === 'all' || guest.rsvpStatus === statusFilter)
      && (!normalized || guest.fullName.toLocaleLowerCase('tr-TR').includes(normalized) || guest.email?.toLocaleLowerCase('tr-TR').includes(normalized)));
  }, [data, query, statusFilter]);

  async function addGuest() {
    if (fullName.trim().length < 2) {
      setActionError('Davetli adını girin.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await manageGuest({ action: editingGuestId ? 'update' : 'create', email, fullName, guestId: editingGuestId ?? undefined, invitationId, phone });
      trackEvent(ANALYTICS_EVENTS.guestAdded, { has_contact: Boolean(email.trim() || phone.trim()), mode: editingGuestId ? 'update' : 'create' });
      setFullName(''); setEmail(''); setPhone(''); setEditingGuestId(null); reload();
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  function editGuest(guestId: string) {
    const guest = (data ?? []).find((item) => item.id === guestId);
    if (!guest) return;
    setEditingGuestId(guest.id); setFullName(guest.fullName); setEmail(guest.email ?? ''); setPhone(guest.phone ?? ''); setActionError(null);
  }

  function cancelEdit() {
    setEditingGuestId(null); setFullName(''); setEmail(''); setPhone('');
  }

  function confirmDelete(guestId: string, name: string) {
    Alert.alert('Davetliyi sil', `${name} davetli listesinden silinsin mi?`, [
      { style: 'cancel', text: 'Vazgeç' },
      { style: 'destructive', text: 'Sil', onPress: () => void removeGuest(guestId) },
    ]);
  }

  async function removeGuest(guestId: string) {
    try {
      await manageGuest({ action: 'delete', guestId, invitationId });
      reload();
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    }
  }

  async function copyRsvp(token: string) {
    const path = `/rsvp/${encodeURIComponent(token)}`;
    await Clipboard.setStringAsync(publicAppOrigin ? `${publicAppOrigin}${path}` : `davetim://${path.replace(/^\//, '')}`);
    trackEvent(ANALYTICS_EVENTS.rsvpLinkCopied);
  }

  async function exportGuests() {
    try {
      trackEvent(ANALYTICS_EVENTS.guestsExported, { guest_count: (data ?? []).length });
      await shareCsv('davetliler.csv', [
        ['Ad Soyad', 'E-posta', 'Telefon', 'RSVP', 'Yanındaki Kişi', 'Beslenme Notu', 'Not'],
        ...(data ?? []).map((guest) => [guest.fullName, guest.email ?? '', guest.phone ?? '', labels[guest.rsvpStatus], String(guest.companionCount), guest.dietaryRestrictions ?? '', guest.notes ?? '']),
      ]);
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    }
  }

  async function importGuests() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'] });
      if (result.canceled) return;
      const file = new File(result.assets[0].uri);
      if (file.size && file.size > 1024 * 1024) throw new Error('CSV dosyası en fazla 1 MB olabilir.');
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error('CSV dosyasında başlık ve en az bir davetli olmalıdır.');
      const headers = rows[0].map((value) => value.toLocaleLowerCase('tr-TR'));
      const nameIndex = headers.findIndex((value) => value.includes('ad') || value.includes('name'));
      const emailIndex = headers.findIndex((value) => value.includes('posta') || value.includes('email'));
      const phoneIndex = headers.findIndex((value) => value.includes('telefon') || value.includes('phone'));
      if (nameIndex < 0) throw new Error('CSV dosyasında Ad Soyad sütunu bulunamadı.');
      const guests = rows.slice(1, 501).map((row) => ({
        email: emailIndex >= 0 ? row[emailIndex]?.trim() || null : null,
        fullName: row[nameIndex]?.trim() ?? '',
        phone: phoneIndex >= 0 ? row[phoneIndex]?.trim() || null : null,
      })).filter((guest) => guest.fullName.length >= 2);
      await bulkImportGuests(invitationId, guests);
      trackEvent(ANALYTICS_EVENTS.guestsImported, { guest_count: guests.length });
      reload();
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    }
  }

  return (
    <Screen action={<Pressable accessibilityLabel="Davet ayrıntısına dön" onPress={() => router.back()}><Ionicons color={colors.ink} name="close" size={26} /></Pressable>} eyebrow="DAVETLİ YÖNETİMİ" onRefresh={refresh} refreshing={refreshing} title="Yanıtları takip et">
      <View style={styles.stats}>
        <Stat color={colors.warning} label="Bekliyor" value={stats.pending} />
        <Stat color={colors.success} label="Katılıyor" value={stats.attending} />
        <Stat color={colors.primaryText} label="Katılamıyor" value={stats.declined} />
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>{editingGuestId ? 'Davetliyi düzenle' : 'Davetli ekle'}</Text>
        {!featureFlags.backendWrites ? <Text style={styles.lockText}>Ekleme ve silme, RLS kontrolleri tamamlanana kadar kilitli.</Text> : null}
        <Field label="Ad soyad" onChangeText={setFullName} value={fullName} />
        <View style={styles.row}><Field label="E-posta" onChangeText={setEmail} value={email} /><Field label="Telefon" onChangeText={setPhone} value={phone} /></View>
        {actionError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{actionError}</Text> : null}
        <PrimaryButton accessibilityLabel={editingGuestId ? 'Davetli değişikliklerini kaydet' : 'Davetli ekle'} disabled={!featureFlags.backendWrites} icon={editingGuestId ? 'save-outline' : 'person-add-outline'} loading={saving} onPress={() => void addGuest()}>{editingGuestId ? 'Değişiklikleri kaydet' : 'Davetli ekle'}</PrimaryButton>
        {editingGuestId ? <PrimaryButton accessibilityLabel="Davetli düzenlemeyi iptal et" icon="close-outline" onPress={cancelEdit} variant="secondary">Vazgeç</PrimaryButton> : null}
        <View style={styles.row}>
          <PrimaryButton accessibilityLabel="Davetlileri CSV dosyasından içe aktar" disabled={!featureFlags.backendWrites} icon="cloud-upload-outline" onPress={() => void importGuests()} variant="secondary">CSV içe aktar</PrimaryButton>
          <PrimaryButton accessibilityLabel="Davetlileri CSV olarak dışa aktar" disabled={(data ?? []).length === 0} icon="download-outline" onPress={() => void exportGuests()} variant="secondary">CSV dışa aktar</PrimaryButton>
        </View>
      </View>

      {loading ? <ActivityIndicator color={colors.secondary} size="large" /> : null}
      {error ? <Pressable onPress={() => void reload()} style={styles.state}><Text style={styles.error}>{error}</Text><Text style={styles.helper}>Tekrar denemek için dokunun.</Text></Pressable> : null}
      {!loading && !error && data?.length === 0 ? <View style={styles.state}><Ionicons color={colors.inkMuted} name="people-outline" size={34} /><Text style={styles.helper}>Henüz davetli eklenmedi.</Text></View> : null}
      {(data ?? []).length > 0 ? <><View style={styles.searchWrap}><Ionicons color={colors.inkMuted} name="search-outline" size={19} /><TextInput accessibilityLabel="Davetli ara" onChangeText={setQuery} placeholder="Ad veya e-posta ara" placeholderTextColor={colors.inkMuted} style={styles.searchInput} value={query} /></View><View style={styles.filters}>{(['all', 'pending', 'attending', 'declined'] as const).map((filter) => <Pressable accessibilityState={{ selected: statusFilter === filter }} key={filter} onPress={() => setStatusFilter(filter)} style={[styles.filter, statusFilter === filter && styles.filterActive]}><Text style={[styles.filterText, statusFilter === filter && styles.filterTextActive]}>{filter === 'all' ? 'Tümü' : labels[filter]}</Text></Pressable>)}</View></> : null}
      <View style={styles.list}>
        {visibleGuests.map((guest) => (
          <View key={guest.id} style={styles.guest}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{guest.fullName.slice(0, 1).toLocaleUpperCase('tr-TR')}</Text></View>
            <View style={styles.guestCopy}><Text style={styles.guestName}>{guest.fullName}</Text><Text style={styles.helper}>{labels[guest.rsvpStatus]}{guest.companionCount ? ` · +${guest.companionCount}` : ''}</Text></View>
            <Pressable accessibilityLabel={`${guest.fullName} davetlisini düzenle`} disabled={!featureFlags.backendWrites} onPress={() => editGuest(guest.id)} style={[styles.iconButton, !featureFlags.backendWrites && styles.disabled]}><Ionicons color={colors.secondary} name="create-outline" size={20} /></Pressable>
            <Pressable accessibilityLabel={`${guest.fullName} RSVP bağlantısını kopyala`} onPress={() => void copyRsvp(guest.guestToken)} style={styles.iconButton}><Ionicons color={colors.secondary} name="link-outline" size={20} /></Pressable>
            <Pressable accessibilityLabel={`${guest.fullName} davetlisini sil`} disabled={!featureFlags.backendWrites} onPress={() => confirmDelete(guest.id, guest.fullName)} style={[styles.iconButton, !featureFlags.backendWrites && styles.disabled]}><Ionicons color={colors.primaryText} name="trash-outline" size={20} /></Pressable>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function Stat({ color, label, value }: { color: string; label: string; value: number }) {
  return <View style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Field({ label, onChangeText, value }: { label: string; onChangeText: (value: string) => void; value: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput onChangeText={onChangeText} placeholderTextColor={colors.inkMuted} style={styles.input} value={value} /></View>;
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: 2, padding: spacing.md },
  statValue: { fontFamily: typography.display, fontSize: 25, fontWeight: '800' },
  statLabel: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 10, textAlign: 'center' },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  sectionTitle: { color: colors.plum, fontFamily: typography.display, fontSize: 22, fontWeight: '700' },
  lockText: { color: colors.warning, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  field: { flex: 1, gap: 6, minWidth: 130 },
  label: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 12, fontWeight: '700' },
  input: { backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, fontFamily: typography.body, minHeight: 44, paddingHorizontal: spacing.md },
  searchWrap: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.md },
  searchInput: { color: colors.ink, flex: 1, fontFamily: typography.body, minHeight: 46, paddingHorizontal: spacing.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterActive: { backgroundColor: colors.plum, borderColor: colors.plum },
  filterText: { color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 11 },
  filterTextActive: { color: colors.white, fontWeight: '700' },
  list: { gap: spacing.sm },
  guest: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  avatar: { alignItems: 'center', backgroundColor: colors.surfaceWarm, borderRadius: radius.pill, height: 40, justifyContent: 'center', width: 40 },
  avatarText: { color: colors.primaryText, fontFamily: typography.display, fontSize: 18, fontWeight: '800' },
  guestCopy: { flex: 1, gap: 2 },
  guestName: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '700' },
  helper: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12 },
  iconButton: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderRadius: radius.sm, height: 38, justifyContent: 'center', width: 38 },
  disabled: { opacity: 0.4 },
  state: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.sm, padding: spacing.xl },
  error: { color: colors.primaryText, fontFamily: typography.body, fontSize: 13, textAlign: 'center' },
});
