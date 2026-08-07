import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Tap } from '@/components/motion';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { featureFlags, publicAppOrigin } from '@/config/feature-flags';
import type { Guest, Invitation, RsvpStatus } from '@/domain/models';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { sendInvite, shareInviteList } from '@/features/guests/guest-invite-actions';
import { bulkImportGuests, listGuests, manageGuest } from '@/features/guests/guest-service';
import { getInvitationForOwner } from '@/features/invitations/invitation-service';
import { parseCsv, shareCsv } from '@/lib/csv';
import { formatEventDate } from '@/lib/format';
import { inviteLinkList, inviteMessage, rsvpLink } from '@/lib/guest-invite';
import { useRemoteData } from '@/lib/remote-data';
import { useRefreshOnFocus } from '@/lib/use-refresh-on-focus';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

const STATUS_LABELS: Record<RsvpStatus, string> = {
  attending: 'Katılıyor',
  declined: 'Katılamıyor',
  pending: 'Bekleniyor',
};

const STATUS_TONES: Record<RsvpStatus, { background: string; text: string }> = {
  attending: { background: colors.successSoft, text: colors.success },
  declined: { background: colors.dangerSoft, text: colors.primaryText },
  pending: { background: colors.surfaceWarm, text: colors.inkMuted },
};

type Filter = 'all' | RsvpStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'pending', label: 'Bekleyen' },
  { key: 'attending', label: 'Katılıyor' },
  { key: 'declined', label: 'Katılamıyor' },
];

type GuestsData = { guests: Guest[]; invitation: Invitation | null };

export default function GuestsScreen() {
  const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  /*
   * The invitation is loaded alongside the guests because the message a host
   * sends has to name the occasion — "Ayşe & Mehmet · 12 Eylül" rather than a
   * bare link. Its failure is swallowed on purpose: the guest list is the point
   * of the screen, and losing the title should cost the host a nicer message,
   * not the page.
   */
  const userId = user?.id;
  const load = useCallback(async (): Promise<GuestsData> => {
    const guests = await listGuests(invitationId);
    let invitation: Invitation | null = null;
    try {
      invitation = userId ? await getInvitationForOwner(invitationId, userId) : null;
    } catch {
      invitation = null;
    }
    return { guests, invitation };
  }, [invitationId, userId]);

  const { data, error, loading, refresh, refreshing, reload } = useRemoteData(load, Boolean(invitationId));
  useRefreshOnFocus(refresh);

  const guests = useMemo(() => data?.guests ?? [], [data]);
  const invitation = data?.invitation ?? null;

  const [editing, setEditing] = useState<Guest | null>(null);
  const [composing, setComposing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stats = useMemo(() => ({
    attending: guests.filter((guest) => guest.rsvpStatus === 'attending').length,
    declined: guests.filter((guest) => guest.rsvpStatus === 'declined').length,
    pending: guests.filter((guest) => guest.rsvpStatus === 'pending').length,
  }), [guests]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR');
    return guests.filter((guest) => (filter === 'all' || guest.rsvpStatus === filter) && (
      !needle
      || guest.fullName.toLocaleLowerCase('tr-TR').includes(needle)
      || guest.email?.toLocaleLowerCase('tr-TR').includes(needle)
      || guest.phone?.includes(needle)
    ));
  }, [filter, guests, query]);

  const eventDate = formatEventDate(invitation?.eventDate ?? null);
  const title = invitation?.title?.trim() || 'Davetiye';

  function messageFor(guest: Guest) {
    return inviteMessage({
      eventDate,
      guestName: guest.fullName,
      link: rsvpLink(guest.guestToken, publicAppOrigin),
      title,
    });
  }

  function openCompose(guest: Guest | null) {
    setEditing(guest);
    setFullName(guest?.fullName ?? '');
    setEmail(guest?.email ?? '');
    setPhone(guest?.phone ?? '');
    setActionError(null);
    setComposing(true);
  }

  async function saveGuest() {
    if (fullName.trim().length < 2) {
      setActionError('Davetli adını girin.');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await manageGuest({
        action: editing ? 'update' : 'create',
        email,
        fullName,
        guestId: editing?.id,
        invitationId,
        phone,
      });
      trackEvent(ANALYTICS_EVENTS.guestAdded, {
        has_contact: Boolean(email.trim() || phone.trim()),
        mode: editing ? 'update' : 'create',
      });
      setComposing(false);
      setNotice(editing ? 'Davetli güncellendi.' : `${fullName.trim()} listeye eklendi.`);
      reload();
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(guest: Guest) {
    Alert.alert('Davetliyi sil', `${guest.fullName} davetli listesinden silinsin mi?`, [
      { style: 'cancel', text: 'Vazgeç' },
      { style: 'destructive', text: 'Sil', onPress: () => void removeGuest(guest.id) },
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

  async function invite(guest: Guest) {
    setBusy(true);
    setNotice(null);
    try {
      const outcome = await sendInvite({ message: messageFor(guest), phone: guest.phone });
      trackEvent(ANALYTICS_EVENTS.guestInviteSent, {
        channel: outcome.kind === 'copied' ? 'clipboard' : outcome.channel,
        has_phone: Boolean(guest.phone),
      });
      if (outcome.kind === 'copied') setNotice('Davet metni panoya kopyalandı.');
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(guest: Guest) {
    await Clipboard.setStringAsync(rsvpLink(guest.guestToken, publicAppOrigin));
    trackEvent(ANALYTICS_EVENTS.rsvpLinkCopied);
    setNotice(`${guest.fullName} için bağlantı kopyalandı.`);
  }

  async function shareAllLinks() {
    const pending = guests.filter((guest) => guest.rsvpStatus === 'pending');
    const target = pending.length > 0 ? pending : guests;
    if (target.length === 0) return;
    const outcome = await shareInviteList(
      `${title}${eventDate ? ` · ${eventDate}` : ''}\n\n${inviteLinkList(target, publicAppOrigin)}`,
    );
    trackEvent(ANALYTICS_EVENTS.guestInvitesShared, { guest_count: target.length });
    if (outcome.kind === 'copied') setNotice('Bağlantı listesi panoya kopyalandı.');
  }

  async function exportGuests() {
    try {
      trackEvent(ANALYTICS_EVENTS.guestsExported, { guest_count: guests.length });
      await shareCsv('davetliler.csv', [
        ['Ad Soyad', 'E-posta', 'Telefon', 'RSVP', 'Yanındaki Kişi', 'Beslenme Notu', 'Not', 'Davet Bağlantısı'],
        // The personal link is part of the export so a host with a mail-merge or
        // a bulk SMS service can send from there. Without it the export was a
        // read-only snapshot and every send still had to happen one at a time.
        ...guests.map((guest) => [
          guest.fullName,
          guest.email ?? '',
          guest.phone ?? '',
          STATUS_LABELS[guest.rsvpStatus],
          String(guest.companionCount),
          guest.dietaryRestrictions ?? '',
          guest.notes ?? '',
          rsvpLink(guest.guestToken, publicAppOrigin),
        ]),
      ]);
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    }
  }

  async function importGuests() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
      });
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
      const imported = rows.slice(1, 501).map((row) => ({
        email: emailIndex >= 0 ? row[emailIndex]?.trim() || null : null,
        fullName: row[nameIndex]?.trim() ?? '',
        phone: phoneIndex >= 0 ? row[phoneIndex]?.trim() || null : null,
      })).filter((guest) => guest.fullName.length >= 2);
      await bulkImportGuests(invitationId, imported);
      trackEvent(ANALYTICS_EVENTS.guestsImported, { guest_count: imported.length });
      setNotice(`${imported.length} davetli içe aktarıldı.`);
      reload();
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    }
  }

  const pendingCount = stats.pending;

  return (
    /*
     * The sheet is a sibling of the screen, not a child of it. `Screen` puts its
     * children inside a ScrollView, and an absolutely positioned overlay in
     * there anchors to the scroll *content* rather than to the viewport — a
     * bottom-anchored panel would sit below the fold, scrolling with the list
     * instead of over it.
     */
    <View style={styles.root}>
      <Screen
        action={(
          <Pressable accessibilityLabel="Davet ayrıntısına dön" accessibilityRole="button" hitSlop={8} onPress={() => router.back()}>
            <Ionicons color={colors.ink} name="close" size={26} />
          </Pressable>
        )}
        eyebrow="DAVETLİ YÖNETİMİ"
        onRefresh={refresh}
        refreshing={refreshing}
        title={title}>

        <View style={styles.stats}>
          <Stat label="Bekleyen" tone={colors.warning} value={stats.pending} />
          <Stat label="Katılıyor" tone={colors.success} value={stats.attending} />
          <Stat label="Katılamıyor" tone={colors.primaryText} value={stats.declined} />
          <Stat label="Toplam" tone={colors.secondary} value={guests.length} />
        </View>

        {/* The two things a host does here, given the weight they deserve: add
            somebody, and get the invitation to the people who have not answered. */}
        <View style={styles.actions}>
          <PrimaryButton
            accessibilityLabel="Davetli ekle"
            disabled={!featureFlags.backendWrites}
            icon="person-add-outline"
            onPress={() => openCompose(null)}>
            Davetli ekle
          </PrimaryButton>
          {pendingCount > 0 ? (
            <PrimaryButton
              accessibilityLabel={`${pendingCount} bekleyen davetliye bağlantı gönder`}
              icon="paper-plane-outline"
              onPress={() => void shareAllLinks()}
              variant="secondary">
              {`${pendingCount} kişiye gönder`}
            </PrimaryButton>
          ) : null}
        </View>

        <View style={styles.secondaryActions}>
          <SecondaryAction
            disabled={!featureFlags.backendWrites}
            icon="cloud-upload-outline"
            label="CSV içe aktar"
            onPress={() => void importGuests()}
          />
          <SecondaryAction
            disabled={guests.length === 0}
            icon="download-outline"
            label="CSV dışa aktar"
            onPress={() => void exportGuests()}
          />
        </View>

        {!featureFlags.backendWrites ? (
          <Text style={styles.lockText}>Ekleme ve silme, RLS kontrolleri tamamlanana kadar kilitli.</Text>
        ) : null}

        {notice ? (
          <View style={styles.notice}>
            <Ionicons color={colors.success} name="checkmark-circle-outline" size={17} />
            <Text accessibilityLiveRegion="polite" style={styles.noticeText}>{notice}</Text>
            <Pressable accessibilityLabel="Bildirimi kapat" hitSlop={8} onPress={() => setNotice(null)}>
              <Ionicons color={colors.inkMuted} name="close" size={15} />
            </Pressable>
          </View>
        ) : null}

        {actionError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{actionError}</Text> : null}

        {loading ? <ActivityIndicator color={colors.secondary} size="large" /> : null}
        {error ? (
          <Pressable onPress={() => void reload()} style={styles.state}>
            <Text style={styles.error}>{error}</Text>
            <Text style={styles.helper}>Tekrar denemek için dokunun.</Text>
          </Pressable>
        ) : null}

        {!loading && !error && guests.length === 0 ? (
          <View style={styles.state}>
            <Ionicons color={colors.inkMuted} name="people-outline" size={34} />
            <Text style={styles.stateTitle}>Henüz davetli yok</Text>
            <Text style={styles.helper}>
              Davetli ekledikçe herkes için kişisel bir davet bağlantısı oluşur. Yanıtları buradan takip edersin.
            </Text>
          </View>
        ) : null}

        {guests.length > 0 ? (
          <>
            <View style={styles.searchWrap}>
              <Ionicons color={colors.inkMuted} name="search-outline" size={19} />
              <TextInput
                accessibilityLabel="Davetli ara"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Ad, e-posta veya telefon"
                placeholderTextColor={colors.inkMuted}
                style={styles.searchInput}
                value={query}
              />
              {query ? (
                <Pressable accessibilityLabel="Aramayı temizle" hitSlop={8} onPress={() => setQuery('')}>
                  <Ionicons color={colors.inkMuted} name="close-circle" size={17} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.filters}>
              {FILTERS.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === item.key }}
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[styles.filter, filter === item.key && styles.filterActive]}>
                  <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {guests.length > 0 && visible.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.helper}>Bu filtreye uyan davetli yok.</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {visible.map((guest) => (
            <GuestRow
              busy={busy}
              guest={guest}
              key={guest.id}
              onCopy={() => void copyLink(guest)}
              onDelete={() => confirmDelete(guest)}
              onEdit={() => openCompose(guest)}
              onInvite={() => void invite(guest)}
            />
          ))}
        </View>

      </Screen>

      {composing ? (
        <BottomSheet
          heightRatio={0.62}
          onClose={() => setComposing(false)}
          subtitle={editing ? 'Bilgileri güncelle' : 'Kişisel davet bağlantısı otomatik oluşur'}
          title={editing ? 'Davetliyi düzenle' : 'Davetli ekle'}>
          <SheetField
            autoFocus
            icon="person-outline"
            label="Ad soyad"
            onChangeText={setFullName}
            placeholder="Ayşe Yılmaz"
            value={fullName}
          />
          <SheetField
            icon="call-outline"
            keyboardType="phone-pad"
            label="Telefon"
            onChangeText={setPhone}
            placeholder="0532 123 45 67"
            value={phone}
          />
          <SheetField
            icon="mail-outline"
            keyboardType="email-address"
            label="E-posta"
            onChangeText={setEmail}
            placeholder="ayse@ornek.com"
            value={email}
          />
          <Text style={styles.sheetHint}>
            Telefon eklersen daveti tek dokunuşla WhatsApp üzerinden gönderebilirsin. İkisi de isteğe bağlı.
          </Text>

          {actionError ? <Text accessibilityLiveRegion="polite" style={styles.error}>{actionError}</Text> : null}

          <PrimaryButton
            accessibilityLabel={editing ? 'Davetli değişikliklerini kaydet' : 'Davetliyi listeye ekle'}
            disabled={!featureFlags.backendWrites}
            icon={editing ? 'save-outline' : 'person-add-outline'}
            loading={saving}
            onPress={() => void saveGuest()}>
            {editing ? 'Değişiklikleri kaydet' : 'Listeye ekle'}
          </PrimaryButton>
        </BottomSheet>
      ) : null}
    </View>
  );
}

function Stat({ label, tone, value }: { label: string; tone: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      <Text numberOfLines={1} style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SecondaryAction({
  disabled,
  icon,
  label,
  onPress,
}: {
  disabled?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Tap
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.96}
      style={[styles.secondaryAction, disabled && styles.disabled]}>
      <Ionicons color={colors.secondary} name={icon} size={17} />
      <Text style={styles.secondaryActionText}>{label}</Text>
    </Tap>
  );
}

/**
 * One guest. Sending is the primary action and it is a labelled button rather
 * than another icon in a row of icons — it is the thing the list exists to make
 * possible, and it was previously the least discoverable control on the screen.
 */
function GuestRow({
  busy,
  guest,
  onCopy,
  onDelete,
  onEdit,
  onInvite,
}: {
  busy: boolean;
  guest: Guest;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onInvite: () => void;
}) {
  const tone = STATUS_TONES[guest.rsvpStatus];
  const contact = [guest.phone, guest.email].filter(Boolean).join(' · ');

  return (
    <View style={styles.guest}>
      <View style={styles.guestHead}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{guest.fullName.slice(0, 1).toLocaleUpperCase('tr-TR')}</Text>
        </View>
        <View style={styles.guestCopy}>
          <Text numberOfLines={1} style={styles.guestName}>{guest.fullName}</Text>
          <Text numberOfLines={1} style={styles.helper}>
            {contact || 'İletişim bilgisi yok'}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: tone.background }]}>
          <Text style={[styles.chipText, { color: tone.text }]}>
            {STATUS_LABELS[guest.rsvpStatus]}{guest.companionCount ? ` +${guest.companionCount}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.guestActions}>
        <Tap
          accessibilityLabel={`${guest.fullName} kişisine daveti gönder`}
          accessibilityRole="button"
          accessibilityState={{ busy }}
          disabled={busy}
          onPress={onInvite}
          scaleTo={0.96}
          style={[styles.sendButton, busy && styles.disabled]}>
          <Ionicons color={colors.white} name={guest.phone ? 'logo-whatsapp' : 'share-outline'} size={16} />
          <Text style={styles.sendLabel}>{guest.phone ? 'WhatsApp' : 'Gönder'}</Text>
        </Tap>
        <RowIcon accessibilityLabel={`${guest.fullName} bağlantısını kopyala`} icon="link-outline" onPress={onCopy} />
        <RowIcon
          accessibilityLabel={`${guest.fullName} davetlisini düzenle`}
          disabled={!featureFlags.backendWrites}
          icon="create-outline"
          onPress={onEdit}
        />
        <RowIcon
          accessibilityLabel={`${guest.fullName} davetlisini sil`}
          disabled={!featureFlags.backendWrites}
          icon="trash-outline"
          onPress={onDelete}
          tone={colors.primaryText}
        />
      </View>
    </View>
  );
}

function RowIcon({
  accessibilityLabel,
  disabled,
  icon,
  onPress,
  tone = colors.secondary,
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  tone?: string;
}) {
  return (
    <Tap
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.iconButton, disabled && styles.disabled]}>
      <Ionicons color={tone} name={icon} size={19} />
    </Tap>
  );
}

function SheetField({
  autoFocus,
  icon,
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  autoFocus?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons color={colors.inkMuted} name={icon} size={18} />
        <TextInput
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          value={value}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: spacing.md,
  },
  statValue: { fontFamily: typography.display, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 10, textAlign: 'center' },

  actions: { gap: spacing.sm },
  secondaryActions: { flexDirection: 'row', gap: spacing.sm },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.sm,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  secondaryActionText: { color: colors.secondary, fontFamily: typography.bodyMedium, fontSize: 12, fontWeight: '700' },

  lockText: { color: colors.warning, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  notice: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  noticeText: { color: colors.success, flex: 1, fontFamily: typography.bodyMedium, fontSize: 12 },

  searchWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: { color: colors.ink, flex: 1, fontFamily: typography.body, minHeight: 46 },

  filters: { flexDirection: 'row', gap: spacing.sm },
  filter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  filterActive: { backgroundColor: colors.plum, borderColor: colors.plum },
  filterText: { color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 11, textAlign: 'center' },
  filterTextActive: { color: colors.white, fontWeight: '700' },

  list: { gap: spacing.sm },
  guest: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  guestHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: { color: colors.primaryText, fontFamily: typography.display, fontSize: 18, fontWeight: '800' },
  guestCopy: { flex: 1, gap: 2 },
  guestName: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '700' },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontFamily: typography.bodyMedium, fontSize: 10, fontWeight: '700' },

  guestActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  sendButton: {
    ...shadow,
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 42,
  },
  sendLabel: { color: colors.white, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '700' },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  disabled: { opacity: 0.4 },

  field: { gap: 6 },
  label: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 12, fontWeight: '700' },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  input: { color: colors.ink, flex: 1, fontFamily: typography.body, fontSize: 15, minHeight: 48 },
  sheetHint: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },

  state: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  stateTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 18, fontWeight: '700' },
  helper: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  error: { color: colors.primaryText, fontFamily: typography.body, fontSize: 13, textAlign: 'center' },
});
