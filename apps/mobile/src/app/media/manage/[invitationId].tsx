import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { featureFlags, publicAppOrigin } from '@/config/feature-flags';
import type { GuestMediaUpload } from '@/domain/models';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { pickMediaFile } from '@/features/media/media-picker';
import { deleteGuestMedia, formatFileSize, getOwnerMediaContext, setGuestUploadsAllowed, uploadOwnerMedia, validateLocalMedia } from '@/features/media/media-service';
import { useRemoteData } from '@/lib/remote-data';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ManageMediaScreen() {
  const { invitationId } = useLocalSearchParams<{ invitationId: string }>();
  const router = useRouter();
  const qrRef = useRef<View>(null);
  const load = useCallback(() => getOwnerMediaContext(invitationId), [invitationId]);
  const { data: context, error, loading, refresh, refreshing, reload } = useRemoteData(load, Boolean(invitationId));
  const [title, setTitle] = useState('Etkinlik galerisi');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const mediaUrl = context?.media.qrCode
    ? publicAppOrigin
      ? `${publicAppOrigin}/media/${encodeURIComponent(context.media.qrCode)}`
      : `davetim://media/${encodeURIComponent(context.media.qrCode)}`
    : null;

  async function chooseAndUpload() {
    setNotice(null);
    try {
      const file = await pickMediaFile();
      if (!file) return;
      const kind = validateLocalMedia(file);
      setBusy(true);
      await uploadOwnerMedia({ ...file, invitationId, title });
      trackEvent(ANALYTICS_EVENTS.mediaGalleryCreated, { kind });
      setNotice('Ana medya güvenli biçimde yüklendi.');
      reload();
    } catch (nextError) {
      setNotice(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function toggleGuestUploads(nextValue: boolean) {
    if (!context) return;
    setBusy(true);
    setNotice(null);
    try {
      await setGuestUploadsAllowed(context.media.id, nextValue);
      reload();
    } catch (nextError) {
      setNotice(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function shareGallery() {
    if (!mediaUrl) return;
    trackEvent(ANALYTICS_EVENTS.mediaGalleryShared);
    await Share.share({ message: `Etkinlik galerisi\n${mediaUrl}`, url: mediaUrl });
  }

  async function copyGallery() {
    if (!mediaUrl) return;
    await Clipboard.setStringAsync(mediaUrl);
    setNotice('Galeri bağlantısı kopyalandı.');
  }

  async function shareQrImage() {
    if (!qrRef.current) return;
    try {
      const uri = await captureRef(qrRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Bu cihazda dosya paylaşımı kullanılamıyor.');
      await Sharing.shareAsync(uri, { dialogTitle: 'QR kodunu paylaş', mimeType: 'image/png', UTI: 'public.png' });
    } catch (nextError) {
      setNotice(getErrorMessage(nextError));
    }
  }

  function confirmDelete(upload: GuestMediaUpload) {
    Alert.alert('Medyayı sil', `${upload.fileName} kalıcı olarak silinsin mi?`, [
      { style: 'cancel', text: 'Vazgeç' },
      { style: 'destructive', text: 'Sil', onPress: () => void removeUpload(upload.id) },
    ]);
  }

  async function removeUpload(uploadId: string) {
    try {
      setBusy(true);
      await deleteGuestMedia(uploadId);
      reload();
    } catch (nextError) {
      setNotice(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen action={<Pressable accessibilityLabel="Geri dön" onPress={() => router.back()}><Ionicons color={colors.ink} name="close" size={26} /></Pressable>} eyebrow="QR MEDYA" onRefresh={refresh} refreshing={refreshing} title="Etkinlik galerisi">
      {!featureFlags.backendWrites ? <View style={styles.lock}><Ionicons color={colors.warning} name="shield-checkmark-outline" size={20} /><Text style={styles.lockText}>Yükleme ve silme, sunucu politikaları doğrulanana kadar kapalı. Mevcut galeri güvenle görüntülenebilir.</Text></View> : null}
      {loading ? <View style={styles.state}><Text style={styles.helper}>Galeri yükleniyor…</Text></View> : null}
      {error ? <Pressable onPress={() => void reload()} style={styles.state}><Text style={styles.error}>{error}</Text><Text style={styles.helper}>Tekrar denemek için dokunun.</Text></Pressable> : null}

      {!loading && !error && !context ? (
        <View style={styles.card}>
          <Ionicons color={colors.secondary} name="images-outline" size={36} />
          <Text style={styles.cardTitle}>İlk medyanı yükle</Text>
          <Text style={styles.helper}>Yayınlanmış davetin için özel bir QR galeri oluşturulur.</Text>
          <TextInput onChangeText={setTitle} placeholder="Galeri başlığı" placeholderTextColor={colors.inkMuted} style={styles.input} value={title} />
          <PrimaryButton accessibilityLabel="Galeri için medya seç" disabled={!featureFlags.backendWrites} icon="cloud-upload-outline" loading={busy} onPress={() => void chooseAndUpload()}>Medya seç ve yükle</PrimaryButton>
        </View>
      ) : null}

      {context && mediaUrl ? (
        <>
          <View style={styles.stats}>
            <Stat label="Tarama" value={context.media.scanCount} />
            <Stat label="Görüntüleme" value={context.media.viewCount} />
            <Stat label="Davetli medya" value={context.media.guestUploadsCount} />
          </View>
          <View style={styles.card}>
            <View ref={qrRef} collapsable={false} style={styles.qrCard}><QRCode backgroundColor={colors.white} color={colors.ink} size={190} value={mediaUrl} /></View>
            <Text style={styles.code}>{context.media.qrCode}</Text>
            <View style={styles.row}>
              <PrimaryButton accessibilityLabel="QR galerisini paylaş" icon="share-outline" onPress={() => void shareGallery()}>Galeriyi paylaş</PrimaryButton>
              <PrimaryButton accessibilityLabel="Galeri bağlantısını kopyala" icon="copy-outline" onPress={() => void copyGallery()} variant="secondary">Bağlantıyı kopyala</PrimaryButton>
              <PrimaryButton accessibilityLabel="QR görselini paylaş" icon="qr-code-outline" onPress={() => void shareQrImage()} variant="secondary">QR görseli</PrimaryButton>
            </View>
          </View>

          <MediaPreview fileName={context.media.fileName} kind={context.media.type} title={context.media.title ?? 'Ana medya'} url={context.media.signedUrl} />
          <View style={styles.card}>
            <View style={styles.settingRow}><View style={styles.settingCopy}><Text style={styles.cardTitle}>Davetli yüklemeleri</Text><Text style={styles.helper}>{context.media.guestUploadsCount}/{context.media.guestUploadsLimit || '∞'} medya</Text></View><Switch disabled={!featureFlags.backendWrites || busy} onValueChange={(value) => void toggleGuestUploads(value)} value={context.media.allowGuestUpload} /></View>
            <TextInput onChangeText={setTitle} placeholder="Ana medya başlığı" placeholderTextColor={colors.inkMuted} style={styles.input} value={title} />
            <PrimaryButton accessibilityLabel="Ana medyayı değiştir" disabled={!featureFlags.backendWrites} icon="swap-horizontal-outline" loading={busy} onPress={() => void chooseAndUpload()} variant="secondary">Ana medyayı değiştir</PrimaryButton>
          </View>

          <View style={styles.list}>
            <Text style={styles.sectionTitle}>Davetli paylaşımları</Text>
            {context.uploads.length === 0 ? <Text style={styles.helper}>Henüz davetli medyası yok.</Text> : context.uploads.map((upload) => (
              <View key={upload.id} style={styles.uploadRow}>
                <Pressable disabled={!upload.signedUrl} onPress={() => upload.signedUrl && void Linking.openURL(upload.signedUrl)} style={styles.uploadIcon}><Ionicons color={colors.secondary} name={upload.type === 'video' ? 'videocam-outline' : 'image-outline'} size={22} /></Pressable>
                <View style={styles.settingCopy}><Text numberOfLines={1} style={styles.uploadName}>{upload.guestName ?? 'Davetli'} · {upload.fileName}</Text><Text style={styles.helper}>{formatFileSize(upload.fileSize)}{upload.note ? ` · ${upload.note}` : ''}</Text></View>
                <Pressable accessibilityLabel="Davetli medyasını sil" disabled={!featureFlags.backendWrites || busy} onPress={() => confirmDelete(upload)} style={styles.deleteButton}><Ionicons color={colors.primaryText} name="trash-outline" size={20} /></Pressable>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.helper}>{label}</Text></View>;
}

function MediaPreview({ fileName, kind, title, url }: { fileName: string; kind: 'image' | 'video'; title: string; url: string | null }) {
  if (kind === 'image' && url) return <View style={styles.previewCard}><Image contentFit="cover" source={url} style={styles.previewImage} /><Text style={styles.previewTitle}>{title}</Text><Text style={styles.helper}>{fileName}</Text></View>;
  return <Pressable disabled={!url} onPress={() => url && void Linking.openURL(url)} style={styles.previewCard}><Ionicons color={colors.secondary} name="play-circle-outline" size={48} /><Text style={styles.previewTitle}>{title}</Text><Text style={styles.helper}>{url ? 'Videoyu aç' : 'Önizleme hazırlanıyor'}</Text></Pressable>;
}

const styles = StyleSheet.create({
  lock: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  lockText: { color: colors.warning, flex: 1, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  state: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.sm, padding: spacing.xl },
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  cardTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 21, fontWeight: '700' },
  helper: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  error: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 13, textAlign: 'center' },
  input: { alignSelf: 'stretch', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, fontFamily: typography.body, minHeight: 46, paddingHorizontal: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flex: 1, gap: 2, padding: spacing.md },
  statValue: { color: colors.plum, fontFamily: typography.display, fontSize: 24, fontWeight: '800' },
  qrCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg },
  code: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, letterSpacing: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  settingRow: { alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', gap: spacing.md },
  settingCopy: { flex: 1, gap: 2 },
  previewCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, overflow: 'hidden', paddingBottom: spacing.lg },
  previewImage: { aspectRatio: 1.35, width: '100%' },
  previewTitle: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '700' },
  list: { gap: spacing.sm },
  sectionTitle: { color: colors.plum, fontFamily: typography.display, fontSize: 23, fontWeight: '700' },
  uploadRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  uploadIcon: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 },
  uploadName: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '700' },
  deleteButton: { alignItems: 'center', borderRadius: radius.sm, height: 38, justifyContent: 'center', width: 38 },
  notice: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 13, textAlign: 'center' },
});
