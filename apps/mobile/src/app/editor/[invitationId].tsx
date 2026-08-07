import Ionicons from '@expo/vector-icons/Ionicons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { BottomSheet } from '@/components/bottom-sheet';
import { Fade, Tap } from '@/components/motion';
import { PrimaryButton } from '@/components/primary-button';
import { featureFlags } from '@/config/feature-flags';
// Expo resolves the .native/.web implementation at bundle time; ESLint's resolver does not.
// eslint-disable-next-line import/no-unresolved
import { rewardedAdGateway } from '@/features/ads/rewarded-ad-gateway';
import { consumeRewardReceipt, type RewardedFeatureKey } from '@/features/ads/rewarded-feature';
import type { Invitation, InvitationTemplate } from '@/domain/models';
import { useAuth } from '@/features/auth/auth-provider';
import { EditorCanvas, type ElementTransform } from '@/features/editor/editor-canvas';
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
  ToolButton,
  ToolStrip,
  Tray,
} from '@/features/editor/editor-controls';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { fitCanvas } from '@/features/editor/canvas-fit';
import { DecorationPicker } from '@/features/editor/decoration-picker';
import { uploadInvitationImage } from '@/features/editor/editor-asset-service';
import {
  alignElements,
  BINDING_LABELS,
  boundValue,
  CANVAS_ASPECT,
  createBoundTextElement,
  createDecorationElement,
  createDividerElement,
  createEditorDocument,
  createTextElement,
  distributeElements,
  duplicateElement,
  type AlignEdge,
  type DistributeAxis,
  type EditorDocument,
  type EditorElement,
  type TextAlignment,
  type TextBinding,
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
type ExportVariant = 'standard' | 'watermarkFree' | 'hd';

/*
 * The editor's chrome splits by whether you need to see the invitation while you
 * work, which turns out to be the only distinction that matters.
 *
 * Filling in the event details, reordering layers or exporting are jobs you do
 * *to* the design and then look at the result; a modal sheet is right for those,
 * and the canvas can give up its room for the duration.
 *
 * Choosing a colour, a size or an angle is judged by watching the invitation as
 * it changes. Those get a tray: short, non-modal, and in the layout rather than
 * over it, so the canvas keeps nearly all its height and stays live.
 */
type Sheet = 'details' | 'layers' | 'share';
type Tool =
  | 'arrange'
  | 'color'
  | 'content'
  | 'decorations'
  | 'insert'
  | 'palette'
  | 'position'
  | 'size'
  | 'transform'
  | 'type';

/** Tools that describe the selected element and mean nothing without one. */
const ELEMENT_TOOLS = new Set<Tool>(['arrange', 'color', 'content', 'position', 'size', 'transform', 'type']);

const TRAY_TITLES: Record<Tool, string> = {
  arrange: 'Düzen',
  color: 'Renk',
  content: 'Metin',
  decorations: 'Süslemeler',
  insert: 'Ekle',
  palette: 'Tasarım',
  position: 'Konum',
  size: 'Boyut',
  transform: 'Çevir',
  type: 'Yazı',
};

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
  // A bound box is named by the detail it carries. Naming it by its current text
  // would relabel it every time the host edits the venue, and two boxes showing
  // the same detail would be indistinguishable in the layer list.
  if (element.bind) return BINDING_LABELS[element.bind];
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
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [tool, setTool] = useState<Tool | null>(null);
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
  //
  // `top` is in window coordinates because the panel it has to avoid is
  // positioned against the window, not against this view.
  const [matRect, setMatRect] = useState({ height: 0, top: 0, width: 0 });
  // Where the open panel's top edge sits, in window coordinates, reported by the
  // sheet itself. `null` when no panel is open.
  const [sheetTop, setSheetTop] = useState<number | null>(null);
  const matRef = useRef<View>(null);
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
    matRect.width - spacing.lg * 2,
    (matRect.height - spacing.lg * 2) * CANVAS_ASPECT,
  ));

  /*
   * Panels used to slide over the invitation, so every change had to be made
   * blind and confirmed by closing the panel — the loop the whole editor is
   * built around, run with the subject hidden. The canvas now shrinks into
   * whatever strip of the mat the panel leaves and stays fully visible.
   *
   * A transform rather than a smaller layout: scaling is a UI-thread property,
   * so it can track the sheet's 200ms slide without re-measuring the mat or
   * re-laying out every element on the canvas each frame. The elements keep
   * their real sizes, which also keeps `captureRef` exporting at full
   * resolution regardless of what the screen is currently showing.
   */
  const fit = fitCanvas({
    canvasHeight: canvasWidth / CANVAS_ASPECT,
    matHeight: matRect.height,
    matTop: matRect.top,
    padding: spacing.lg,
    panelGap: spacing.md,
    sheetTop,
  });

  const canvasScale = useSharedValue(1);
  const canvasOffset = useSharedValue(0);
  useEffect(() => {
    // Export snaps rather than animates: `waitForCanvas` only waits two frames
    // before capturing, so an in-flight transition would be photographed
    // half-way through. Restoring 1:1 first also keeps the capture independent
    // of whichever panel happened to be open.
    const duration = exporting ? 0 : 200;
    canvasScale.set(withTiming(exporting ? 1 : fit.scale, { duration }));
    canvasOffset.set(withTiming(exporting ? 0 : fit.offset, { duration }));
  }, [canvasOffset, canvasScale, exporting, fit.offset, fit.scale]);

  const canvasFitStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: canvasOffset.get() }, { scale: canvasScale.get() }],
  }));

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

  /** Writes one event detail. Separate only because a computed key needs the cast. */
  function patchBound(bind: TextBinding, value: string) {
    patchDocument({ [bind]: value } as Partial<EditorDocument>);
  }

  function patchSelectedStyle(updates: Partial<EditorElement['style']>) {
    if (!selected || selected.locked) return;
    patchSelected({ style: { ...selected.style, ...updates } });
  }

  /*
   * Lands a finished canvas gesture — a drag, a corner resize or a rotation.
   * Called once on release rather than per frame, so the whole gesture is a
   * single history entry and one undo puts the element back where it started.
   */
  function transformElement(id: string, transform: ElementTransform) {
    const target = document.elements.find((item) => item.id === id);
    if (!target || target.locked) return;
    change((current) => ({
      ...current,
      elements: current.elements.map((item) => item.id === id ? { ...item, ...transform } : item),
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
    // Straight into the tool the new element most likely needs — typing for a
    // text box, colour for anything else. Adding a text box and then hunting for
    // where to type it was the sharpest edge in the old flow.
    openTool(placed.type === 'text' ? 'content' : 'color');
  }

  function nextZIndex() {
    return Math.max(0, ...document.elements.map((item) => item.zIndex)) + 1;
  }

  function duplicateSelected() {
    if (!selected) return;
    addElement(duplicateElement(selected, nextZIndex()));
  }

  function removeSelected() {
    if (!selected || selected.locked) return;
    change((current) => ({ ...current, elements: current.elements.filter((item) => item.id !== selected.id) }));
    setSelectedId(null);
    setTool(null);
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

  /*
   * A tray and a sheet never share the screen. They occupy the same region and
   * answer the same question — what am I working on — so showing both would put
   * two answers on top of each other.
   */
  function openSheet(next: Sheet | null) {
    setTool(null);
    setSheet(next);
  }

  function openTool(next: Tool | null) {
    setSheet(null);
    setTool(next);
  }

  function selectFromCanvas(id: string | null) {
    setSelectedId(id);
    // Tapping the canvas background dismisses the element's tools; the ones that
    // describe the document as a whole have nothing to do with the selection and
    // stay where they are.
    if (!id && tool && ELEMENT_TOOLS.has(tool)) setTool(null);
  }

  /*
   * Which tools the strip offers for what is selected. A text box has words, a
   * point size and an alignment; an ornament has none of those. Listing only
   * what applies is what lets the strip stay one row without scrolling past
   * controls that would do nothing.
   */
  const elementTools: { danger?: boolean; icon: React.ComponentProps<typeof Ionicons>['name']; tool: Tool }[] = selected
    ? [
      ...(selected.type === 'text'
        ? [
          { icon: 'text-outline' as const, tool: 'content' as Tool },
          { icon: 'options-outline' as const, tool: 'type' as Tool },
        ]
        : []),
      { icon: 'color-palette-outline' as const, tool: 'color' as Tool },
      { icon: 'move-outline' as const, tool: 'position' as Tool },
      { icon: 'resize-outline' as const, tool: 'size' as Tool },
      { icon: 'sync-outline' as const, tool: 'transform' as Tool },
      { icon: 'layers-outline' as const, tool: 'arrange' as Tool },
    ]
    : [];

  /*
   * One tray, one job. The controls are the same ones the old element sheet
   * carried; what changed is that you are shown the handful that belong to the
   * tool you asked for instead of all of them stacked in a half-screen modal.
   */
  function renderTray() {
    if (tool === 'insert') {
      return (
        <>
          <TileGrid>
            <ActionTile icon="text-outline" label="Metin" onPress={() => addElement(createTextElement(nextZIndex()))} tone="accent" />
            <ActionTile icon="remove-outline" label="Çizgi" onPress={() => addElement(createDividerElement(nextZIndex()))} />
            <ActionTile icon="sparkles-outline" label="Süsleme" onPress={() => openTool('decorations')} />
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
          {/* Boxes that follow Detay rather than holding their own copy of the
              same words. A template brings these already wired; an invitation
              started from blank has to be able to add them. */}
          <FieldLabel>Etkinlik bilgisi</FieldLabel>
          <TileGrid>
            {(['title', 'eventDate', 'eventTime', 'locationName'] as TextBinding[]).map((bind) => (
              <ActionTile
                icon="pricetag-outline"
                key={bind}
                label={BINDING_LABELS[bind]}
                onPress={() => addElement(createBoundTextElement(bind, nextZIndex()))}
              />
            ))}
          </TileGrid>
          {featureFlags.backendWrites ? null : (
            <PanelNote tone="warning">Görsel yükleme, staging RLS kontrolleri tamamlanana kadar kapalı.</PanelNote>
          )}
        </>
      );
    }

    if (tool === 'decorations') {
      return <DecorationPicker onPick={(shapeId) => addElement(createDecorationElement(shapeId, nextZIndex()))} />;
    }

    if (tool === 'palette') {
      return (
        <>
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
        </>
      );
    }

    if (!selected) return null;

    if (tool === 'content') {
      /*
       * A bound box has no text of its own to edit — it shows an event detail.
       * Editing the detail here rather than the box is what keeps Detay and the
       * design as one thing; the alternative is the bug this binding exists to
       * fix, where the two drift apart and the host maintains both.
       */
      if (selected.bind) {
        const bind = selected.bind;
        return (
          <>
            <Field
              label={BINDING_LABELS[bind]}
              multiline={bind === 'customMessage'}
              onChangeText={(value) => patchBound(bind, value)}
              placeholder={bind === 'eventDate' ? '2026-09-12' : BINDING_LABELS[bind]}
              value={boundValue(document, bind)}
            />
            <PanelNote>
              Bu kutu Detay bilgilerinden besleniyor. Burada veya Detay panelinde değiştirmen aynı kapıya çıkar.
            </PanelNote>
          </>
        );
      }

      return (
        <Field
          label="Metin"
          multiline
          onChangeText={(content) => patchSelected({ content })}
          placeholder="Metni yaz"
          value={selected.content ?? ''}
        />
      );
    }

    if (tool === 'type') {
      return (
        <>
          <FieldRow>
            <Stepper
              label="Punto"
              max={96}
              min={8}
              onChange={(fontSize) => patchSelectedStyle({ fontSize })}
              value={selected.style.fontSize ?? 24}
            />
          </FieldRow>
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
        </>
      );
    }

    if (tool === 'color') {
      return selected.type === 'text' ? (
        <SwatchPicker
          label="Metin rengi"
          onChange={(color) => patchSelectedStyle({ color })}
          swatches={[document.colors.text, document.colors.accent, ...BRAND_SWATCHES]}
          value={selected.style.color ?? document.colors.text}
        />
      ) : (
        <SwatchPicker
          label={selected.type === 'divider' ? 'Çizgi rengi' : 'Süsleme rengi'}
          onChange={(color) => patchSelectedStyle({ color })}
          swatches={[document.colors.accent, document.colors.primary, ...BRAND_SWATCHES]}
          value={selected.style.color ?? document.colors.accent}
        />
      );
    }

    if (tool === 'position') {
      return (
        <>
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
          {/* "Put this in the middle" should not be twenty-five taps. */}
          <TileGrid>
            <ActionTile disabled={selected.locked} icon="chevron-back-outline" label="Sol" onPress={() => alignSelected('left')} />
            <ActionTile disabled={selected.locked} icon="code-outline" label="Orta" onPress={() => alignSelected('center')} />
            <ActionTile disabled={selected.locked} icon="chevron-forward-outline" label="Sağ" onPress={() => alignSelected('right')} />
            <ActionTile disabled={selected.locked} icon="menu-outline" label="Dikey orta" onPress={() => alignSelected('middle')} />
          </TileGrid>
        </>
      );
    }

    if (tool === 'size') {
      return (
        <FieldRow>
          <Stepper
            label="Genişlik"
            max={100}
            min={5}
            onChange={(width) => patchSelected({ size: { ...selected.size, width } })}
            suffix="%"
            value={selected.size.width}
          />
          <Stepper
            label="Yükseklik"
            max={100}
            min={2}
            onChange={(height) => patchSelected({ size: { ...selected.size, height } })}
            suffix="%"
            value={selected.size.height}
          />
        </FieldRow>
      );
    }

    if (tool === 'transform') {
      return (
        <FieldRow>
          <Stepper
            label="Döndür"
            max={180}
            min={-180}
            onChange={(rotation) => patchSelected({ rotation })}
            step={5}
            suffix="°"
            value={selected.rotation}
          />
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
      );
    }

    if (tool === 'arrange') {
      return (
        <TileGrid>
          <ActionTile disabled={selected.locked} icon="arrow-up-outline" label="Öne al" onPress={() => moveSelected('forward')} />
          <ActionTile disabled={selected.locked} icon="arrow-down-outline" label="Arkaya al" onPress={() => moveSelected('backward')} />
          <ActionTile icon="copy-outline" label="Çoğalt" onPress={duplicateSelected} />
        </TileGrid>
      );
    }

    return null;
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
          onPress={() => openSheet('details')}
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

      <View
        onLayout={() => matRef.current?.measureInWindow((_x, top, width, height) => setMatRect({ height, top, width }))}
        ref={matRef}
        style={styles.mat}>
        {canvasWidth > 0 ? (
          <Animated.View style={canvasFitStyle}>
            <View collapsable={false} ref={canvasRef} style={{ width: canvasWidth }}>
              <EditorCanvas
                document={document}
                interactive={!exporting}
                onTransformEnd={transformElement}
                onSelect={selectFromCanvas}
                selectedId={exporting ? null : selectedId}
                watermark={exportVariant === 'standard' || exportVariant === 'hd'}
              />
            </View>

            {/* A blank invitation is otherwise a white rectangle with nothing to
                suggest what to do with it. Inside the scaled wrapper so it
                tracks the canvas, outside `canvasRef` so it can never end up in
                an exported PNG. */}
            {document.elements.length === 0 && !exporting ? (
              <View pointerEvents="none" style={styles.emptyHint}>
                <Ionicons color={colors.inkMuted} name="add-circle-outline" size={26} />
                <Text style={styles.emptyHintText}>Ekle ile metin veya çizgi koy</Text>
              </View>
            ) : null}
          </Animated.View>
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

      {tool ? (
        <Tray
          // Decorations are reached from Ekle, so closing them returns there
          // rather than dropping the user out of the flow they were in.
          onClose={() => setTool(tool === 'decorations' ? 'insert' : null)}
          tall={tool === 'decorations' || tool === 'palette'}
          title={TRAY_TITLES[tool]}>
          {renderTray()}
        </Tray>
      ) : null}

      {selected ? (
        <ToolStrip>
          <ToolButton
            icon="checkmark-done-outline"
            label="Bitir"
            onPress={() => { setSelectedId(null); setTool(null); }}
          />
          {elementTools.map(({ icon, tool: name }) => (
            <ToolButton
              active={tool === name}
              disabled={selected.locked}
              icon={icon}
              key={name}
              label={TRAY_TITLES[name]}
              onPress={() => openTool(tool === name ? null : name)}
            />
          ))}
          <ToolButton
            icon={selected.visible ? 'eye-outline' : 'eye-off-outline'}
            label={selected.visible ? 'Gizle' : 'Göster'}
            onPress={() => patchSelected({ visible: !selected.visible })}
          />
          {/* Not disabled by the lock — it is the way out of one. */}
          <ToolButton
            active={selected.locked}
            icon={selected.locked ? 'lock-closed' : 'lock-open-outline'}
            label={selected.locked ? 'Kilitli' : 'Kilitle'}
            onPress={toggleSelectedLock}
          />
          <ToolButton danger disabled={selected.locked} icon="trash-outline" label="Sil" onPress={removeSelected} />
        </ToolStrip>
      ) : (
        <View style={styles.dock}>
          <DockButton active={sheet === 'details'} icon="create-outline" label="Detay" onPress={() => openSheet('details')} />
          <DockButton active={tool === 'insert'} icon="add-circle-outline" label="Ekle" onPress={() => openTool(tool === 'insert' ? null : 'insert')} />
          <DockButton active={tool === 'palette'} icon="color-palette-outline" label="Tasarım" onPress={() => openTool(tool === 'palette' ? null : 'palette')} />
          <DockButton active={sheet === 'layers'} badge={document.elements.length} icon="layers-outline" label="Katman" onPress={() => openSheet('layers')} />
          <DockButton active={sheet === 'share'} icon="share-outline" label="Paylaş" onPress={() => openSheet('share')} />
        </View>
      )}

      {sheet === 'details' ? (
        <BottomSheet onClose={() => setSheet(null)} onSheetTop={setSheetTop} subtitle="Davetiyede görünen bilgiler" title="Etkinlik">
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

      {sheet === 'layers' ? (
        <BottomSheet onClose={() => setSheet(null)} onSheetTop={setSheetTop} subtitle={`${document.elements.length} öğe`} title="Katmanlar">
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
                  onPress={() => { setSelectedId(item.id); openSheet(null); }}
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

      {sheet === 'share' ? (
        <BottomSheet onClose={() => setSheet(null)} onSheetTop={setSheetTop} subtitle="Dışa aktar ve yayınla" title="Paylaş">
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
  emptyHint: {
    alignItems: 'center',
    bottom: 0,
    gap: spacing.sm,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
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
