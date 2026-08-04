import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { featureFlags } from '@/config/feature-flags';
import type { GuestMediaUpload } from '@/domain/models';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { pickMediaFile } from '@/features/media/media-picker';
import { formatFileSize, getPublicMediaContext, uploadGuestMedia, validateLocalMedia, type LocalMediaFile } from '@/features/media/media-service';
import { useRemoteData } from '@/lib/remote-data';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function PublicMediaScreen() {
  const { qrCode } = useLocalSearchParams<{ qrCode: string }>();
  const load = useCallback(() => getPublicMediaContext(qrCode), [qrCode]);
  const { data: context, error, loading, reload } = useRemoteData(load, Boolean(qrCode));
  const [file, setFile] = useState<LocalMediaFile | null>(null);
  const [guestName, setGuestName] = useState('');
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function chooseMedia() {
    try {
      const nextFile = await pickMediaFile();
      if (!nextFile) return;
      validateLocalMedia(nextFile);
      setFile(nextFile);
      setNotice(null);
    } catch (nextError) {
      setNotice(getErrorMessage(nextError));
    }
  }

  async function submitUpload() {
    if (!file) {
      setNotice('Önce bir fotoğraf veya video seçin.');
      return;
    }
    try {
      setBusy(true);
      setNotice(null);
      await uploadGuestMedia({ ...file, consent, guestName, note, qrCode });
      trackEvent(ANALYTICS_EVENTS.guestMediaUploaded, { mime_type: file.mimeType, named: Boolean(guestName.trim()) });
      setFile(null); setGuestName(''); setNote(''); setConsent(false);
      setNotice('Medyanız galeriye güvenli biçimde eklendi.');
      reload();
    } catch (nextError) {
      setNotice(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <View style={styles.center}><Text style={styles.helper}>Galeri açılıyor…</Text></View>;
  if (error || !context) return <View style={styles.center}><Ionicons color={colors.primaryText} name="qr-code-outline" size={46} /><Text style={styles.error}>{error ?? 'Galeri bulunamadı.'}</Text><PrimaryButton accessibilityLabel="Galeriyi yeniden yükle" icon="refresh-outline" onPress={() => void reload()}>Tekrar dene</PrimaryButton></View>;

  return (
    <Screen eyebrow="ETKİNLİK GALERİSİ" title={context.media.title ?? 'Anıları paylaş'}>
      <MediaTile fileName={context.media.fileName} kind={context.media.type} name="Davet sahibinden" url={context.media.signedUrl} />
      <View style={styles.meta}><Ionicons color={colors.primaryText} name="images-outline" size={20} /><Text style={styles.metaText}>{context.uploads.length} paylaşım · {context.media.viewCount} görüntüleme</Text></View>

      {context.media.allowGuestUpload ? (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Sen de bir anı ekle</Text>
          <Text style={styles.helper}>Fotoğraf en fazla 10 MB, video en fazla 100 MB olabilir. Dosyalar özel depoda tutulur.</Text>
          {!featureFlags.backendWrites ? <Text style={styles.lockText}>Yükleme, güvenlik politikaları doğrulanana kadar geçici olarak kapalı.</Text> : null}
          <TextInput autoCapitalize="words" onChangeText={setGuestName} placeholder="Adın (isteğe bağlı)" placeholderTextColor={colors.inkMuted} style={styles.input} value={guestName} />
          <TextInput multiline onChangeText={setNote} placeholder="Kısa not (isteğe bağlı)" placeholderTextColor={colors.inkMuted} style={[styles.input, styles.note]} value={note} />
          <PrimaryButton accessibilityLabel="Fotoğraf veya video seç" disabled={!featureFlags.backendWrites} icon="image-outline" onPress={() => void chooseMedia()} variant="secondary">{file ? file.fileName : 'Fotoğraf veya video seç'}</PrimaryButton>
          {file ? <Text style={styles.selected}>{formatFileSize(file.fileSize)} · {file.mimeType}</Text> : null}
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent((value) => !value)} style={styles.consent}><Ionicons color={consent ? colors.success : colors.inkMuted} name={consent ? 'checkbox' : 'square-outline'} size={24} /><Text style={styles.consentText}>Bu içeriği paylaşma hakkına sahibim ve etkinlik galerisinde gösterilmesini onaylıyorum.</Text></Pressable>
          <PrimaryButton accessibilityLabel="Seçili medyayı yükle" disabled={!featureFlags.backendWrites || !file || !consent} icon="cloud-upload-outline" loading={busy} onPress={() => void submitUpload()}>Galeriye yükle</PrimaryButton>
        </View>
      ) : null}

      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
      <View style={styles.gallery}>
        <Text style={styles.sectionTitle}>Paylaşılan anılar</Text>
        {context.uploads.length === 0 ? <Text style={styles.helper}>Henüz paylaşım yok.</Text> : context.uploads.map((upload) => <UploadTile key={upload.id} upload={upload} />)}
      </View>
      <Text style={styles.footer}>Davetim ile güvenle paylaşılıyor</Text>
    </Screen>
  );
}

function MediaTile({ fileName, kind, name, url }: { fileName: string; kind: 'image' | 'video'; name: string; url: string | null }) {
  if (kind === 'image' && url) return <View style={styles.tile}><Image contentFit="cover" source={url} style={styles.image} /><View style={styles.tileCopy}><Text style={styles.tileTitle}>{name}</Text><Text style={styles.helper}>{fileName}</Text></View></View>;
  return <Pressable disabled={!url} onPress={() => url && void Linking.openURL(url)} style={styles.video}><Ionicons color={colors.secondary} name="play-circle" size={58} /><Text style={styles.tileTitle}>{name}</Text><Text style={styles.helper}>{url ? 'Videoyu aç' : 'Medya hazırlanıyor'}</Text></Pressable>;
}

function UploadTile({ upload }: { upload: GuestMediaUpload }) {
  return <MediaTile fileName={`${upload.fileName} · ${formatFileSize(upload.fileSize)}`} kind={upload.type} name={upload.guestName ?? 'Davetli'} url={upload.signedUrl} />;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  error: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 15, textAlign: 'center' },
  helper: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  meta: { alignItems: 'center', backgroundColor: colors.surfaceWarm, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  metaText: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 13 },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  sectionTitle: { color: colors.plum, fontFamily: typography.display, fontSize: 23, fontWeight: '700' },
  lockText: { color: colors.warning, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  input: { backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, color: colors.ink, fontFamily: typography.body, minHeight: 46, paddingHorizontal: spacing.md },
  note: { minHeight: 82, paddingTop: spacing.md, textAlignVertical: 'top' },
  selected: { color: colors.success, fontFamily: typography.bodyMedium, fontSize: 12 },
  consent: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  consentText: { color: colors.ink, flex: 1, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  notice: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 13, textAlign: 'center' },
  gallery: { gap: spacing.md },
  tile: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  image: { aspectRatio: 1.25, width: '100%' },
  tileCopy: { gap: 2, padding: spacing.md },
  tileTitle: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '700' },
  video: { alignItems: 'center', backgroundColor: colors.plum, borderRadius: radius.md, gap: spacing.sm, justifyContent: 'center', minHeight: 210, padding: spacing.xl },
  footer: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 11, textAlign: 'center' },
});
