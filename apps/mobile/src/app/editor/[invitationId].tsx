import Ionicons from '@expo/vector-icons/Ionicons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { BottomSheet } from '@/components/bottom-sheet';
import { Enter, Fade, Tap } from '@/components/motion';
import { PrimaryButton } from '@/components/primary-button';
import { featureFlags } from '@/config/feature-flags';
// Expo resolves the .native/.web implementation at bundle time; ESLint's resolver does not.
// eslint-disable-next-line import/no-unresolved
import { rewardedAdGateway } from '@/features/ads/rewarded-ad-gateway';
import { consumeRewardReceipt, type RewardedFeatureKey } from '@/features/ads/rewarded-feature';
import type { Invitation, InvitationTemplate } from '@/domain/models';
import { useAuth } from '@/features/auth/auth-provider';
import { EditorCanvas } from '@/features/editor/editor-canvas';
import {
  ActionTile,
  Field,
  FieldLabel,
  FieldRow,
  PanelNote,
  PanelRow,
  SegmentedControl,
  Stepper,
  SwatchPicker,
  TileGrid,
} from '@/features/editor/editor-controls';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { DecorationPicker } from '@/features/editor/decoration-picker';
import { uploadInvitationImage } from '@/features/editor/editor-asset-service';
import {
  alignElements,
  CANVAS_ASPECT,
  createDecorationElement,
  createDividerElement,
  createEditorDocument,
  createTextElement,
  distributeElements,
  type AlignEdge,
  type DistributeAxis,
  type EditorDocument,
  type EditorElement,
  type TextAlignment,
} from '@/features/editor/editor-model';
import { useEditorHistory } from '@/features/editor/use-editor-history';
import { usePrompts } from '@/features/prompts/prompt-provider';
import {
  createInvitationDraft,
  getInvitationForOwner,
  saveInvitationDocument,
  setInvitationPublished,
} from '@/features/invitations/invitation-service';
import { getTemplateById } from '@/features/templates/template-service';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { pickImageFile } from '@/features/media/media-picker';
import { useRemoteData } from '@/lib/remote-data';
import { colors, engraved, radius, shadow, spacing, typography } from '@/theme/tokens';

type EditorLoadResult = { invitation: Invitation | null; template: InvitationTemplate | null };
type Panel = 'details' | 'insert' | 'decorations' | 'design' | 'layers' | 'share' | 'element';
type ExportVariant = 'standard' | 'watermarkFree' | 'hd';

// Offered alongside whatever the template already uses, so a design can be
// pulled back to the brand without typing hex codes from memory.
const BRAND_SWATCHES = [
  colors.canvas,
  colors.surface,
  colors.surfaceWarm,
  colors.ink,
  colors.plum,
  colors.secondary,
  colors.primary,
  colors.accent,
  colors.gold,
];

/*
 * What to call an element in the layer list and selection bar. A text box is
 * recognised by what it says, not by the name it was created with — a canvas of
 * five boxes all labelled "Yeni metin" is a list you have to guess your way
 * through. Falls back to the stored name for everything else.
 */
function elementLabel(element: EditorElement) {
  if (element.type === 'text') {
    const content = element.content?.trim();
    if (content) return content;
  }
  return element.name;
}

/**
 * Nudges a new element off any existing one so it lands somewhere visible.
 * Gives up after a few steps rather than wandering off the canvas — by then the
 * design is busy enough that one more overlap is not the problem.
 */
function freePosition(start: { x: number; y: number }, existing: EditorElement[]) {
  const STEP = 4;
  let position = start;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const occupied = existing.some(
      (item) => Math.abs(item.position.x - position.x) < STEP && Math.abs(item.position.y - position.y) < STEP,
    );
    if (!occupied) break;
    position = { x: Math.min(94, position.x + STEP), y: Math.min(94, position.y + STEP) };
  }
  return position;
}

export default function EditorScreen() {
  const { invitationId, rewardReceiptId, templateId } = useLocalSearchParams<{ invitationId: string; rewardReceiptId?: string; templateId?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const isNew = invitationId === 'new';
  const load = useCallback(async (): Promise<EditorLoadResult> => {
    if (isNew) {
      return { invitation: null, template: templateId ? await getTemplateById(templateId) : null };
    }

    const invitation = await getInvitationForOwner(invitationId, user?.id ?? '');
    let template: InvitationTemplate | null = null;
    if (invitation.templateId) {
      try {
        template = await getTemplateById(invitation.templateId);
      } catch {
        template = null;
      }
    }
    return { invitation, template };
  }, [invitationId, isNew, templateId, user?.id]);
  const { data, error, loading, reload } = useRemoteData(load, Boolean(user && invitationId));

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.onWorkspace} size="large" /></View>;
  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>{error ?? 'Editör verileri yüklenemedi.'}</Text>
        <PrimaryButton accessibilityLabel="Editörü yeniden yükle" icon="refresh-outline" onPress={() => void reload()}>Tekrar dene</PrimaryButton>
      </View>
    );
  }

  return (
    <EditorWorkspace
      initialDocument={createEditorDocument(data.invitation, data.template)}
      invitation={data.invitation}
      key={`${data.invitation?.id ?? 'new'}-${data.invitation?.updatedAt ?? data.template?.updatedAt ?? 'blank'}`}
      onClose={() => router.back()}
      onCreated={(id) => router.replace(`/editor/${id}` as Href)}
      rewardReceiptId={rewardReceiptId}
      template={data.template}
    />
  );
}

function EditorWorkspace({
  initialDocument,
  invitation: initialInvitation,
  onClose,
  onCreated,
  rewardReceiptId,
  template,
}: {
  initialDocument: EditorDocument;
  invitation: Invitation | null;
  onClose: () => void;
  onCreated: (id: string) => void;
  rewardReceiptId?: string;
  template: InvitationTemplate | null;
}) {
  const { canRedo, canUndo, document, redo, setDocument, undo } = useEditorHistory(initialDocument);
  const { celebrate } = usePrompts();
  const [invitation, setInvitation] = useState(initialInvitation);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [exportVariant, setExportVariant] = useState<ExportVariant | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The mat measures itself so the canvas can be sized to fit the available
  // height. Letting the canvas claim 100% width instead pushed it off-screen on
  // short devices, which is what made the old editor scroll.
  const [matSize, setMatSize] = useState({ height: 0, width: 0 });
  const canvasRef = useRef<View>(null);
  const selected = useMemo(
    () => document.elements.find((item) => item.id === selectedId) ?? null,
    [document.elements, selectedId],
  );
  const exporting = exportVariant !== null;
  const published = invitation?.status === 'published';
  // `onLayout` reports the padded box, so the padding comes off before the
  // canvas is fitted to whichever axis runs out first.
  const canvasWidth = Math.max(0, Math.min(
    matSize.width - spacing.lg * 2,
    (matSize.height - spacing.lg * 2) * CANVAS_ASPECT,
  ));

  function change(mutator: (current: EditorDocument) => EditorDocument) {
    setDocument(mutator(document));
    setDirty(true);
    setMessage(null);
  }

  function patchDocument(updates: Partial<EditorDocument>) {
    change((current) => ({ ...current, ...updates }));
  }

  function patchColors(updates: Partial<EditorDocument['colors']>) {
    change((current) => ({ ...current, colors: { ...current.colors, ...updates } }));
  }

  function patchSelected(updates: Partial<EditorElement>) {
    if (!selected || selected.locked) return;
    change((current) => ({
      ...current,
      elements: current.elements.map((item) => item.id === selected.id ? { ...item, ...updates } : item),
    }));
  }

  function patchSelectedStyle(updates: Partial<EditorElement['style']>) {
    if (!selected || selected.locked) return;
    patchSelected({ style: { ...selected.style, ...updates } });
  }

  function moveElement(id: string, position: { x: number; y: number }) {
    const target = document.elements.find((item) => item.id === id);
    if (!target || target.locked) return;
    change((current) => ({
      ...current,
      elements: current.elements.map((item) => item.id === id ? { ...item, position } : item),
    }));
  }

  function addElement(element: EditorElement) {
    // Everything is created dead centre, so a second text box landed exactly on
    // the first and looked like nothing had happened. Step new arrivals down and
    // across until the spot is clear, the way a stack of cards fans out.
    const placed = { ...element, position: freePosition(element.position, document.elements) };
    trackEvent(
      placed.type === 'decoration' ? ANALYTICS_EVENTS.editorDecorationAdded : ANALYTICS_EVENTS.editorElementAdded,
      { element_type: placed.type, shape_id: placed.shapeId },
    );
    change((current) => ({ ...current, elements: [...current.elements, placed] }));
    setSelectedId(placed.id);
    // Drop straight into the element's own controls: adding a text box and then
    // hunting for where to type it was the sharpest edge in the old flow.
    setPanel('element');
  }

  function nextZIndex() {
    return Math.max(0, ...document.elements.map((item) => item.zIndex)) + 1;
  }

  function duplicateSelected() {
    if (!selected) return;
    const duplicate: EditorElement = {
      ...selected,
      id: `${selected.type}-${Date.now()}`,
      name: `${selected.name} kopyası`,
      locked: false,
      position: { x: Math.min(100, selected.position.x + 3), y: Math.min(100, selected.position.y + 3) },
      zIndex: nextZIndex(),
    };
    addElement(duplicate);
  }

  function removeSelected() {
    if (!selected || selected.locked) return;
    change((current) => ({ ...current, elements: current.elements.filter((item) => item.id !== selected.id) }));
    setSelectedId(null);
    setPanel(null);
  }

  function toggleSelectedLock() {
    if (!selected) return;
    change((current) => ({
      ...current,
      elements: current.elements.map((item) => item.id === selected.id ? { ...item, locked: !item.locked } : item),
    }));
  }

  function toggleElementVisible(id: string) {
    change((current) => ({
      ...current,
      elements: current.elements.map((item) => item.id === id ? { ...item, visible: !item.visible } : item),
    }));
  }

  /*
   * Canvas-wide tidying. Doing this by hand meant walking every element's two
   * steppers until the columns looked right, which is how a five-line
   * invitation ends up with five slightly different left edges.
   */
  function alignAll(edge: AlignEdge) {
    trackEvent(ANALYTICS_EVENTS.editorAlignUsed, { edge, scope: 'all' });
    change((current) => ({ ...current, elements: alignElements(current.elements, edge) }));
  }

  function distributeAll(axis: DistributeAxis) {
    change((current) => ({ ...current, elements: distributeElements(current.elements, axis) }));
  }

  /** Same operation aimed at one element, reachable from its own panel. */
  function alignSelected(edge: AlignEdge) {
    if (!selected || selected.locked) return;
    change((current) => ({
      ...current,
      elements: current.elements.map((item) => item.id === selected.id ? alignElements([item], edge)[0] : item),
    }));
  }

  function moveSelected(direction: 'backward' | 'forward') {
    if (!selected || selected.locked) return;
    const ordered = [...document.elements].sort((left, right) => left.zIndex - right.zIndex);
    const currentIndex = ordered.findIndex((item) => item.id === selected.id);
    const target = ordered[direction === 'forward' ? currentIndex + 1 : currentIndex - 1];
    if (!target) return;
    change((current) => ({
      ...current,
      elements: current.elements.map((item) => {
        if (item.id === selected.id) return { ...item, zIndex: target.zIndex };
        if (item.id === target.id) return { ...item, zIndex: selected.zIndex };
        return item;
      }),
    }));
  }

  async function waitForCanvas(variant: ExportVariant) {
    setExportVariant(variant);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }

  async function exportImage() {
    if (!canvasRef.current) return;
    setError(null);
    setMessage(null);
    try {
      await waitForCanvas('standard');
      const uri = await captureRef(canvasRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Bu cihazda dosya paylaşımı kullanılamıyor.');
      await Sharing.shareAsync(uri, { dialogTitle: 'Daveti görsel olarak paylaş', mimeType: 'image/png', UTI: 'public.png' });
      trackEvent(ANALYTICS_EVENTS.invitationExported, { format: 'png', variant: 'standard' });
      setMessage('PNG görseli hazırlandı.');
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setExportVariant(null);
    }
  }

  async function exportPdf() {
    if (!canvasRef.current) return;
    setError(null);
    setMessage(null);
    try {
      await waitForCanvas('standard');
      const dataUri = await captureRef(canvasRef, { format: 'png', quality: 1, result: 'data-uri' });
      const result = await Print.printToFileAsync({
        html: `<html><head><meta name="viewport" content="width=device-width"><style>@page{margin:0}html,body{margin:0;padding:0;background:#fff}img{display:block;width:100%;height:100%;object-fit:contain}</style></head><body><img alt="Davet tasarımı" src="${dataUri}"></body></html>`,
      });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Bu cihazda dosya paylaşımı kullanılamıyor.');
      await Sharing.shareAsync(result.uri, { dialogTitle: 'Daveti PDF olarak paylaş', mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      trackEvent(ANALYTICS_EVENTS.invitationExported, { format: 'pdf', variant: 'standard' });
      setMessage('PDF dosyası hazırlandı.');
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setExportVariant(null);
    }
  }

  async function exportWithReward(feature: RewardedFeatureKey, variant: 'watermarkFree' | 'hd') {
    if (!canvasRef.current || !invitation) return;
    setError(null);
    setMessage(null);
    try {
      trackEvent(ANALYTICS_EVENTS.rewardedAdRequested, { feature });
      const reward = await rewardedAdGateway.requestReward(feature, { invitationId: invitation.id });
      if (!reward.granted || !reward.receiptId) throw new Error('Ödül doğrulanamadı.');
      await consumeRewardReceipt(reward.receiptId, feature, invitation.id);
      trackEvent(ANALYTICS_EVENTS.rewardedAdGranted, { feature });
      await waitForCanvas(variant);
      const uri = await captureRef(canvasRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        ...(variant === 'hd' ? { height: 2000, width: 1440 } : {}),
      });
      if (!(await Sharing.isAvailableAsync())) throw new Error('Bu cihazda dosya paylaşımı kullanılamıyor.');
      await Sharing.shareAsync(uri, { dialogTitle: variant === 'hd' ? 'HD daveti paylaş' : 'Filigransız daveti paylaş', mimeType: 'image/png', UTI: 'public.png' });
      trackEvent(ANALYTICS_EVENTS.invitationExported, { format: 'png', variant });
      setMessage(variant === 'hd' ? 'HD PNG hazırlandı.' : 'Filigransız PNG hazırlandı.');
    } catch (nextError) {
      trackEvent(ANALYTICS_EVENTS.rewardedAdFailed, { feature });
      setError(getErrorMessage(nextError));
    } finally {
      setExportVariant(null);
    }
  }

  async function persist() {
    if (invitation) {
      const saved = await saveInvitationDocument(invitation.id, document);
      setInvitation(saved);
      return saved;
    }

    const created = await createInvitationDraft({ document, rewardReceiptId, templateId: template?.id ?? null });
    setInvitation(created);
    onCreated(created.id);
    return created;
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await persist();
      setDirty(false);
      trackEvent(ANALYTICS_EVENTS.invitationSaved, { element_count: document.elements.length, has_background: Boolean(document.imageUrl) });
      setMessage('Değişiklikler kaydedildi.');
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await persist();
      const updated = await setInvitationPublished(saved.id, saved.status !== 'published');
      setInvitation(updated);
      setDirty(false);
      trackEvent(
        updated.status === 'published' ? ANALYTICS_EVENTS.invitationPublished : ANALYTICS_EVENTS.invitationUnpublished,
        { element_count: document.elements.length },
      );
      // Publishing is the moment the product delivered what it promised, which
      // is the only honest time to ask for a rating. Counted here, asked for on
      // a later launch — never in the same breath as the success toast.
      if (updated.status === 'published') celebrate();
      setMessage(updated.status === 'published' ? 'Davet yayınlandı.' : 'Davet taslağa alındı.');
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setPublishing(false);
    }
  }

  async function chooseBackgroundImage() {
    setError(null);
    setMessage(null);
    try {
      const file = await pickImageFile();
      if (!file) return;
      setUploadingImage(true);
      const imageUrl = await uploadInvitationImage(file, invitation?.id);
      trackEvent(ANALYTICS_EVENTS.editorBackgroundUploaded);
      patchDocument({ imageUrl });
      setMessage('Arka plan görseli yüklendi. Kaydetmeyi unutmayın.');
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setUploadingImage(false);
    }
  }

  function selectFromCanvas(id: string | null) {
    setSelectedId(id);
    // Tapping the canvas background is how you dismiss the element controls.
    if (!id && panel === 'element') setPanel(null);
  }

  const statusLabel = dirty ? 'Kaydedilmedi' : published ? 'Yayında' : 'Taslak';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.workspace}>
      <View style={styles.topBar}>
        <Tap accessibilityLabel="Editörü kapat" accessibilityRole="button" onPress={onClose} style={styles.chromeButton}>
          <Ionicons color={colors.onWorkspace} name="close" size={23} />
        </Tap>

        <Pressable
          accessibilityHint="Etkinlik bilgilerini açar"
          accessibilityLabel={`Davet: ${document.title || 'Yeni davet'}`}
          accessibilityRole="button"
          onPress={() => setPanel('details')}
          style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>{document.title || 'Yeni davet'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, dirty && styles.statusDotDirty, published && !dirty && styles.statusDotLive]} />
            <Text style={styles.status}>{statusLabel}</Text>
          </View>
        </Pressable>

        <Tap
          accessibilityLabel="Geri al"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canUndo }}
          disabled={!canUndo}
          onPress={undo}
          style={[styles.chromeButton, !canUndo && styles.chromeDisabled]}>
          <Ionicons color={colors.onWorkspace} name="arrow-undo-outline" size={20} />
        </Tap>
        <Tap
          accessibilityLabel="Yinele"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canRedo }}
          disabled={!canRedo}
          onPress={redo}
          style={[styles.chromeButton, !canRedo && styles.chromeDisabled]}>
          <Ionicons color={colors.onWorkspace} name="arrow-redo-outline" size={20} />
        </Tap>
        <Tap
          accessibilityLabel="Daveti kaydet"
          accessibilityRole="button"
          accessibilityState={{ busy: saving, disabled: !featureFlags.backendWrites }}
          disabled={!featureFlags.backendWrites || saving}
          onPress={() => void save()}
          style={[styles.saveButton, !featureFlags.backendWrites && styles.chromeDisabled]}>
          {saving
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Ionicons color={colors.white} name="checkmark" size={21} />}
        </Tap>
      </View>

      <View onLayout={(event) => setMatSize(event.nativeEvent.layout)} style={styles.mat}>
        {canvasWidth > 0 ? (
          <View collapsable={false} ref={canvasRef} style={{ width: canvasWidth }}>
            <EditorCanvas
              document={document}
              interactive={!exporting}
              onMoveEnd={moveElement}
              onSelect={selectFromCanvas}
              selectedId={exporting ? null : selectedId}
              watermark={exportVariant === 'standard' || exportVariant === 'hd'}
            />
          </View>
        ) : null}

        {/* A blank invitation is otherwise a white rectangle with nothing to
            suggest what to do with it. Sits outside `canvasRef` so it can never
            end up in an exported PNG. */}
        {document.elements.length === 0 && !exporting ? (
          <View pointerEvents="none" style={styles.emptyHint}>
            <Ionicons color={colors.inkMuted} name="add-circle-outline" size={26} />
            <Text style={styles.emptyHintText}>Ekle ile metin veya çizgi koy</Text>
          </View>
        ) : null}
      </View>

      {error || message ? (
        <Fade key={error ?? message}>
          <View style={[styles.toast, error ? styles.toastError : styles.toastSuccess]}>
            <Ionicons
              color={error ? colors.primaryText : colors.success}
              name={error ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              size={18}
            />
            <Text accessibilityLiveRegion="polite" style={[styles.toastText, error ? styles.toastTextError : styles.toastTextSuccess]}>
              {error ?? message}
            </Text>
            <Pressable accessibilityLabel="Bildirimi kapat" hitSlop={8} onPress={() => { setError(null); setMessage(null); }}>
              <Ionicons color={colors.inkMuted} name="close" size={16} />
            </Pressable>
          </View>
        </Fade>
      ) : null}

      {selected ? (
        <SelectionBar
          element={selected}
          onDeselect={() => { setSelectedId(null); setPanel(null); }}
          onEdit={() => setPanel('element')}
          onToggleLock={toggleSelectedLock}
          onToggleVisible={() => patchSelected({ visible: !selected.visible })}
        />
      ) : (
        <View style={styles.dock}>
          <DockButton active={panel === 'details'} icon="create-outline" label="Detay" onPress={() => setPanel('details')} />
          <DockButton active={panel === 'insert'} icon="add-circle-outline" label="Ekle" onPress={() => setPanel('insert')} />
          <DockButton active={panel === 'design'} icon="color-palette-outline" label="Tasarım" onPress={() => setPanel('design')} />
          <DockButton active={panel === 'layers'} badge={document.elements.length} icon="layers-outline" label="Katman" onPress={() => setPanel('layers')} />
          <DockButton active={panel === 'share'} icon="share-outline" label="Paylaş" onPress={() => setPanel('share')} />
        </View>
      )}

      {panel === 'details' ? (
        <BottomSheet onClose={() => setPanel(null)} subtitle="Davetiyede görünen bilgiler" title="Etkinlik">
          <Field label="Davet başlığı" onChangeText={(title) => patchDocument({ title })} placeholder="Ayşe & Mehmet" value={document.title} />
          <FieldRow>
            <View style={styles.flex}><Field label="Tarih" onChangeText={(eventDate) => patchDocument({ eventDate })} placeholder="2026-09-12" value={document.eventDate} /></View>
            <View style={styles.flex}><Field label="Saat" onChangeText={(eventTime) => patchDocument({ eventTime })} placeholder="19:30" value={document.eventTime} /></View>
          </FieldRow>
          <Field label="Mekân" onChangeText={(locationName) => patchDocument({ locationName })} placeholder="Deniz Kızı Balo Salonu" value={document.locationName} />
          <Field label="Adres" onChangeText={(locationAddress) => patchDocument({ locationAddress })} placeholder="Bağdat Cad. No 12, Kadıköy" value={document.locationAddress} />
          <Field label="Mesaj" multiline onChangeText={(customMessage) => patchDocument({ customMessage })} placeholder="Bu güzel günde bizimle olmanızı dileriz." value={document.customMessage} />
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.switchLabel}>QR kodu tasarımda göster</Text>
              <Text style={styles.switchHelp}>QR medya açıldığında davetlilerin fotoğraf yükleyeceği kare burada durur.</Text>
            </View>
            <Switch
              onValueChange={(showQrOnDesign) => patchDocument({ showQrOnDesign })}
              thumbColor={colors.white}
              trackColor={{ false: colors.border, true: colors.secondary }}
              value={document.showQrOnDesign}
            />
          </View>
        </BottomSheet>
      ) : null}

      {panel === 'insert' ? (
        <BottomSheet heightRatio={0.42} onClose={() => setPanel(null)} subtitle="Tasarıma yeni öğe koy" title="Ekle">
          <TileGrid>
            <ActionTile icon="text-outline" label="Metin" onPress={() => addElement(createTextElement(nextZIndex()))} tone="accent" />
            <ActionTile icon="remove-outline" label="Çizgi" onPress={() => addElement(createDividerElement(nextZIndex()))} />
            <ActionTile icon="sparkles-outline" label="Süsleme" onPress={() => setPanel('decorations')} />
            <ActionTile
              disabled={!featureFlags.backendWrites || uploadingImage}
              icon={uploadingImage ? 'cloud-upload-outline' : 'image-outline'}
              label={uploadingImage ? 'Yükleniyor' : 'Arka plan'}
              onPress={() => void chooseBackgroundImage()}
            />
          </TileGrid>
          {document.imageUrl ? (
            <PanelRow danger icon="trash-outline" label="Arka plan görselini kaldır" onPress={() => patchDocument({ imageUrl: null })} />
          ) : null}
          {featureFlags.backendWrites ? null : (
            <PanelNote tone="warning">Görsel yükleme, staging RLS kontrolleri tamamlanana kadar kapalı.</PanelNote>
          )}
        </BottomSheet>
      ) : null}

      {panel === 'decorations' ? (
        <BottomSheet
          heightRatio={0.62}
          onClose={() => setPanel('insert')}
          subtitle="Dokunduğun süsleme tasarıma eklenir"
          title="Süslemeler">
          <DecorationPicker onPick={(shapeId) => addElement(createDecorationElement(shapeId, nextZIndex()))} />
        </BottomSheet>
      ) : null}

      {panel === 'design' ? (
        <BottomSheet onClose={() => setPanel(null)} subtitle="Davetiyenin renkleri" title="Tasarım">
          <SwatchPicker
            label="Arka plan"
            onChange={(background) => patchColors({ background })}
            swatches={[document.colors.background, ...BRAND_SWATCHES]}
            value={document.colors.background}
          />
          <SwatchPicker
            label="Metin"
            onChange={(value) => patchColors({ text: value })}
            swatches={[document.colors.text, ...BRAND_SWATCHES]}
            value={document.colors.text}
          />
          <SwatchPicker
            label="Vurgu"
            onChange={(accent) => patchColors({ accent })}
            swatches={[document.colors.accent, ...BRAND_SWATCHES]}
            value={document.colors.accent}
          />
          {/* Only meaningful with a photograph behind the design; without one the
              veil has nothing to soften and the row would be dead furniture. */}
          {document.imageUrl ? (
            <FieldRow>
              <Stepper
                label="Arka plan perdesi"
                max={100}
                min={0}
                onChange={(value) => patchDocument({ backgroundVeil: value / 100 })}
                step={10}
                suffix="%"
                value={document.backgroundVeil * 100}
              />
            </FieldRow>
          ) : null}
          <PanelNote>
            Vurgu rengi çizgilerde ve QR çerçevesinde kullanılır.
            {document.imageUrl ? ' Perde, arka plan fotoğrafını arka plan rengiyle örterek metni okunur tutar.' : ''}
          </PanelNote>
        </BottomSheet>
      ) : null}

      {panel === 'layers' ? (
        <BottomSheet onClose={() => setPanel(null)} subtitle={`${document.elements.length} öğe`} title="Katmanlar">
          {document.elements.length === 0 ? (
            <PanelNote>Henüz öğe yok. Ekle sekmesinden metin, çizgi veya süsleme koyabilirsin.</PanelNote>
          ) : null}

          {/* Whole-canvas tidying, kept with the layer list because that is where
              you look when the design as a whole is what needs fixing. */}
          {document.elements.length > 1 ? (
            <>
              <FieldLabel>Tüm öğeleri hizala</FieldLabel>
              <TileGrid>
                <ActionTile icon="chevron-back-outline" label="Sola" onPress={() => alignAll('left')} />
                <ActionTile icon="code-outline" label="Yatay orta" onPress={() => alignAll('center')} />
                <ActionTile icon="chevron-forward-outline" label="Sağa" onPress={() => alignAll('right')} />
              </TileGrid>
              <TileGrid>
                <ActionTile icon="chevron-up-outline" label="Üste" onPress={() => alignAll('top')} />
                <ActionTile icon="menu-outline" label="Dikey orta" onPress={() => alignAll('middle')} />
                <ActionTile icon="chevron-down-outline" label="Alta" onPress={() => alignAll('bottom')} />
              </TileGrid>
              {document.elements.filter((item) => !item.locked).length > 2 ? (
                <TileGrid>
                  <ActionTile icon="swap-vertical-outline" label="Dikey eşit dağıt" onPress={() => distributeAll('vertical')} />
                  <ActionTile icon="swap-horizontal-outline" label="Yatay eşit dağıt" onPress={() => distributeAll('horizontal')} />
                </TileGrid>
              ) : null}
              <PanelNote>Kilitli öğeler yerinde kalır; bir parçayı sabitlemek için kilitle.</PanelNote>
              <View style={styles.divider} />
            </>
          ) : null}
          {/* No staggered entrance here. The rows are inside a panel that is
              itself already animating in, and re-running the stagger on every
              open turns a list you consult constantly into a performance. */}
          {[...document.elements].sort((left, right) => right.zIndex - left.zIndex).map((item) => (
            <View key={item.id}>
              <View style={[styles.layer, selectedId === item.id && styles.layerSelected]}>
                <Pressable
                  accessibilityLabel={`${elementLabel(item)} öğesini seç`}
                  accessibilityRole="button"
                  onPress={() => { setSelectedId(item.id); setPanel('element'); }}
                  style={styles.layerMain}>
                  <Ionicons
                    color={item.visible ? colors.secondary : colors.inkMuted}
                    name={item.type === 'text' ? 'text-outline' : item.type === 'divider' ? 'remove-outline' : item.type === 'decoration' ? 'sparkles-outline' : 'image-outline'}
                    size={20}
                  />
                  <Text numberOfLines={1} style={styles.layerName}>{elementLabel(item)}</Text>
                </Pressable>
                {item.locked ? <Ionicons color={colors.inkMuted} name="lock-closed-outline" size={17} /> : null}
                <Pressable
                  accessibilityLabel={item.visible ? `${elementLabel(item)} öğesini gizle` : `${elementLabel(item)} öğesini göster`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => toggleElementVisible(item.id)}>
                  <Ionicons color={colors.inkMuted} name={item.visible ? 'eye-outline' : 'eye-off-outline'} size={19} />
                </Pressable>
              </View>
            </View>
          ))}
        </BottomSheet>
      ) : null}

      {panel === 'share' ? (
        <BottomSheet onClose={() => setPanel(null)} subtitle="Dışa aktar ve yayınla" title="Paylaş">
          <PanelRow
            disabled={!featureFlags.backendWrites || publishing}
            icon={published ? 'eye-off-outline' : 'paper-plane-outline'}
            label={published ? 'Taslağa al' : 'Yayınla ve bağlantı oluştur'}
            onPress={() => void togglePublish()}
            value={published ? 'Yayında' : undefined}
          />
          <View style={styles.divider} />
          <FieldLabel>Dışa aktar</FieldLabel>
          <TileGrid>
            <ActionTile disabled={exporting} icon="image-outline" label="PNG" onPress={() => void exportImage()} />
            <ActionTile disabled={exporting} icon="document-outline" label="PDF" onPress={() => void exportPdf()} />
            <ActionTile
              disabled={exporting || !featureFlags.rewardedAds || !invitation}
              icon="sparkles-outline"
              label="Filigransız"
              onPress={() => void exportWithReward('single_watermark_free_export', 'watermarkFree')}
            />
            <ActionTile
              disabled={exporting || !featureFlags.rewardedAds || !invitation}
              icon="expand-outline"
              label="HD PNG"
              onPress={() => void exportWithReward('single_hd_export', 'hd')}
            />
          </TileGrid>
          {/* One note, not two. With both flags off the panel used to end in a
              stack of near-identical lock warnings. */}
          {featureFlags.rewardedAds && featureFlags.backendWrites ? (
            <PanelNote>Filigransız ve HD dışa aktarma, izlenen tek bir ödüllü reklamla açılır.</PanelNote>
          ) : (
            <PanelNote tone="warning">
              {!featureFlags.rewardedAds && !featureFlags.backendWrites
                ? 'Yayınlama ve ödüllü dışa aktarma bu sürümde kapalı. PNG ve PDF paylaşımı çalışıyor.'
                : !featureFlags.rewardedAds
                  ? 'Ödüllü reklamlar bu sürümde kapalı, filigransız ve HD dışa aktarma kullanılamıyor.'
                  : 'Yayınlama, staging RLS kontrolleri tamamlanana kadar kapalı.'}
            </PanelNote>
          )}
        </BottomSheet>
      ) : null}

      {panel === 'element' && selected ? (
        <BottomSheet
          heightRatio={0.62}
          onClose={() => setPanel(null)}
          subtitle={selected.locked ? 'Kilitli · düzenlemek için kilidi aç' : selected.type === 'text' ? 'Metin' : selected.type === 'divider' ? 'Çizgi' : selected.type === 'decoration' ? 'Süsleme' : 'Görsel'}
          title={elementLabel(selected)}>
          {selected.type === 'text' ? (
            <Field
              label="Metin"
              multiline
              onChangeText={(content) => patchSelected({ content })}
              placeholder="Metni yaz"
              value={selected.content ?? ''}
            />
          ) : null}

          <FieldRow>
            <Stepper
              label="Yatay"
              max={100}
              min={0}
              onChange={(x) => patchSelected({ position: { ...selected.position, x } })}
              suffix="%"
              value={selected.position.x}
            />
            <Stepper
              label="Dikey"
              max={100}
              min={0}
              onChange={(y) => patchSelected({ position: { ...selected.position, y } })}
              suffix="%"
              value={selected.position.y}
            />
          </FieldRow>

          <FieldRow>
            <Stepper
              label="Genişlik"
              max={100}
              min={5}
              onChange={(width) => patchSelected({ size: { ...selected.size, width } })}
              suffix="%"
              value={selected.size.width}
            />
            {/* Height had no control at all, so a decoration could only ever be
                resized along one axis and came out squashed. Text keeps its
                automatic band — the point size already governs how tall it is. */}
            {selected.type === 'text' ? (
              <Stepper
                label="Döndür"
                max={180}
                min={-180}
                onChange={(rotation) => patchSelected({ rotation })}
                step={5}
                suffix="°"
                value={selected.rotation}
              />
            ) : (
              <Stepper
                label="Yükseklik"
                max={100}
                min={2}
                onChange={(height) => patchSelected({ size: { ...selected.size, height } })}
                suffix="%"
                value={selected.size.height}
              />
            )}
          </FieldRow>


          {/* Opacity was in the document model but had no control anywhere in the
              app. Pairing it with the point size also stops a lone full-width
              stepper sitting under two neat rows of two. */}
          <FieldRow>
            {selected.type === 'text' ? (
              <Stepper
                label="Punto"
                max={96}
                min={8}
                onChange={(fontSize) => patchSelectedStyle({ fontSize })}
                value={selected.style.fontSize ?? 24}
              />
            ) : (
              <Stepper
                label="Döndür"
                max={180}
                min={-180}
                onChange={(rotation) => patchSelected({ rotation })}
                step={5}
                suffix="°"
                value={selected.rotation}
              />
            )}
            <Stepper
              label="Opaklık"
              max={100}
              min={10}
              onChange={(opacity) => patchSelected({ opacity: opacity / 100 })}
              step={10}
              suffix="%"
              value={selected.opacity * 100}
            />
          </FieldRow>

          {/* Snapping one element to the page. The steppers can get there, but
              "put this in the middle" should not be twenty-five taps. */}
          <FieldLabel>Sayfaya yasla</FieldLabel>
          <TileGrid>
            <ActionTile disabled={selected.locked} icon="chevron-back-outline" label="Sol" onPress={() => alignSelected('left')} />
            <ActionTile disabled={selected.locked} icon="code-outline" label="Orta" onPress={() => alignSelected('center')} />
            <ActionTile disabled={selected.locked} icon="chevron-forward-outline" label="Sağ" onPress={() => alignSelected('right')} />
            <ActionTile disabled={selected.locked} icon="menu-outline" label="Dikey orta" onPress={() => alignSelected('middle')} />
          </TileGrid>

          {selected.type === 'text' ? (
            <>
              <SegmentedControl<TextAlignment>
                label="Hizalama"
                onChange={(textAlign) => patchSelectedStyle({ textAlign })}
                options={[
                  { label: 'Sol', value: 'left' },
                  { label: 'Orta', value: 'center' },
                  { label: 'Sağ', value: 'right' },
                ]}
                value={selected.style.textAlign ?? 'center'}
              />
              <SwatchPicker
                label="Metin rengi"
                onChange={(color) => patchSelectedStyle({ color })}
                swatches={[document.colors.text, document.colors.accent, ...BRAND_SWATCHES]}
                value={selected.style.color ?? document.colors.text}
              />
            </>
          ) : null}

          {selected.type === 'divider' || selected.type === 'decoration' ? (
            <SwatchPicker
              label={selected.type === 'divider' ? 'Çizgi rengi' : 'Süsleme rengi'}
              onChange={(color) => patchSelectedStyle({ color })}
              swatches={[document.colors.accent, document.colors.primary, ...BRAND_SWATCHES]}
              value={selected.style.color ?? document.colors.accent}
            />
          ) : null}

          <View style={styles.divider} />
          <TileGrid>
            <ActionTile disabled={selected.locked} icon="arrow-up-outline" label="Öne al" onPress={() => moveSelected('forward')} />
            <ActionTile disabled={selected.locked} icon="arrow-down-outline" label="Arkaya al" onPress={() => moveSelected('backward')} />
            <ActionTile icon="copy-outline" label="Çoğalt" onPress={duplicateSelected} />
          </TileGrid>
          <PanelRow danger disabled={selected.locked} icon="trash-outline" label="Öğeyi sil" onPress={removeSelected} />
        </BottomSheet>
      ) : null}
    </SafeAreaView>
  );
}

/** Bottom dock entry. Same shape as a tab bar item, so it needs no explanation. */
function DockButton({
  active,
  badge,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  badge?: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Tap
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      scaleTo={0.92}
      style={[styles.dockButton, active && styles.dockButtonActive]}>
      <Ionicons color={active ? colors.white : colors.onWorkspaceMuted} name={icon} size={22} />
      <Text style={[styles.dockLabel, active && styles.dockLabelActive]}>{label}</Text>
      {badge ? <Text style={styles.dockBadge}>{badge}</Text> : null}
    </Tap>
  );
}

/**
 * Replaces the dock while an element is selected. Selection used to push a whole
 * section into the page and leave the tools where they were; swapping the bar
 * keeps the controls that apply right now under your thumb.
 */
function SelectionBar({
  element,
  onDeselect,
  onEdit,
  onToggleLock,
  onToggleVisible,
}: {
  element: EditorElement;
  onDeselect: () => void;
  onEdit: () => void;
  onToggleLock: () => void;
  onToggleVisible: () => void;
}) {
  return (
    <Enter style={styles.selectionBar}>
      <Tap accessibilityLabel="Seçimi bırak" accessibilityRole="button" onPress={onDeselect} style={styles.chromeButton}>
        <Ionicons color={colors.onWorkspace} name="close" size={20} />
      </Tap>
      <Text numberOfLines={1} style={styles.selectionName}>{elementLabel(element)}</Text>
      <Tap
        accessibilityLabel={element.visible ? 'Öğeyi gizle' : 'Öğeyi göster'}
        accessibilityRole="button"
        onPress={onToggleVisible}
        style={styles.chromeButton}>
        <Ionicons color={colors.onWorkspace} name={element.visible ? 'eye-outline' : 'eye-off-outline'} size={20} />
      </Tap>
      <Tap
        accessibilityLabel={element.locked ? 'Kilidi aç' : 'Öğeyi kilitle'}
        accessibilityRole="button"
        onPress={onToggleLock}
        style={styles.chromeButton}>
        <Ionicons color={element.locked ? colors.gold : colors.onWorkspace} name={element.locked ? 'lock-closed' : 'lock-open-outline'} size={20} />
      </Tap>
      <Tap accessibilityLabel="Öğeyi düzenle" accessibilityRole="button" onPress={onEdit} style={styles.selectionEdit}>
        <Ionicons color={colors.white} name="options-outline" size={18} />
        <Text style={styles.selectionEditLabel}>Düzenle</Text>
      </Tap>
    </Enter>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', backgroundColor: colors.workspace, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  centerText: { color: colors.onWorkspace, fontFamily: typography.body, fontSize: 15, textAlign: 'center' },
  workspace: { backgroundColor: colors.workspace, flex: 1 },
  flex: { flex: 1 },

  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chromeButton: { alignItems: 'center', borderRadius: radius.pill, height: 40, justifyContent: 'center', width: 40 },
  chromeDisabled: { opacity: 0.35 },
  titleBlock: { flex: 1, gap: 2, paddingHorizontal: spacing.xs },
  title: { color: colors.onWorkspace, fontFamily: typography.display, fontSize: 18, fontWeight: '600' },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  statusDot: { backgroundColor: colors.onWorkspaceMuted, borderRadius: 3, height: 6, width: 6 },
  statusDotDirty: { backgroundColor: colors.gold },
  statusDotLive: { backgroundColor: colors.accent },
  status: { ...engraved, color: colors.onWorkspaceMuted, fontSize: 10 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },

  // The canvas is centred in whatever height is left over, the way a print sits
  // on a mat rather than filling the frame.
  mat: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.lg },
  emptyHint: { alignItems: 'center', gap: spacing.sm, position: 'absolute' },
  emptyHintText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 14 },

  toast: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
  },
  toastError: { backgroundColor: colors.dangerSoft },
  toastSuccess: { backgroundColor: colors.successSoft },
  toastText: { flex: 1, fontFamily: typography.bodyMedium, fontSize: 13 },
  toastTextError: { color: colors.primaryText },
  toastTextSuccess: { color: colors.success },

  dock: {
    backgroundColor: colors.workspaceRaised,
    borderColor: colors.workspaceBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.xs,
  },
  dockButton: { alignItems: 'center', borderRadius: radius.md, flex: 1, gap: 5, paddingVertical: spacing.md },
  dockButtonActive: { backgroundColor: colors.secondary },
  dockLabel: { color: colors.onWorkspaceMuted, fontFamily: typography.bodyMedium, fontSize: 11, fontWeight: '700' },
  dockLabelActive: { color: colors.white },
  dockBadge: {
    ...engraved,
    backgroundColor: colors.workspace,
    borderRadius: radius.pill,
    color: colors.onWorkspaceMuted,
    fontSize: 9,
    minWidth: 18,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: 'absolute',
    right: 8,
    textAlign: 'center',
    top: 6,
  },

  selectionBar: {
    alignItems: 'center',
    backgroundColor: colors.workspaceRaised,
    borderColor: colors.workspaceBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.xs,
  },
  selectionName: { color: colors.onWorkspace, flex: 1, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '700' },
  selectionEdit: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 6,
    height: 40,
    paddingHorizontal: spacing.md,
  },
  selectionEditLabel: { color: colors.white, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '700' },

  switchRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  switchLabel: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '700' },
  switchHelp: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 17, marginTop: 2 },

  divider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth },

  layer: {
    ...shadow,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowOpacity: 0.04,
  },
  layerSelected: { borderColor: colors.secondary },
  layerMain: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.md, minHeight: 54 },
  layerName: { color: colors.ink, flex: 1, fontFamily: typography.bodyMedium, fontSize: 14 },
});
