import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { PrimaryButton } from '@/components/primary-button';
import { featureFlags } from '@/config/feature-flags';
// Expo resolves the .native/.web implementation at bundle time; ESLint's resolver does not.
// eslint-disable-next-line import/no-unresolved
import { rewardedAdGateway } from '@/features/ads/rewarded-ad-gateway';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage } from '@/features/auth/auth-utils';
import { useRemoteData } from '@/lib/remote-data';
import { useRefreshOnFocus } from '@/lib/use-refresh-on-focus';
import { trackEvent } from '@/features/analytics/analytics';
import { ANALYTICS_EVENTS } from '@/features/analytics/events';
import { templateCategoryLabel } from '@/features/templates/template-categories';
import { listFavoriteTemplateIds, listTemplates, setTemplateFavorite } from '@/features/templates/template-service';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

export default function TemplatesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  // `null` rather than the string "Tümü": the sentinel used to be a value a
  // real category could collide with.
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [openingTemplateId, setOpeningTemplateId] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [templates, favoriteIds] = await Promise.all([listTemplates(), listFavoriteTemplateIds(user?.id ?? '')]);
    return { favoriteIds, templates };
  }, [user?.id]);
  const { data, error, loading, refresh, refreshing, reload } = useRemoteData(load, Boolean(user));
  useRefreshOnFocus(refresh);
  const templates = useMemo(() => data?.templates ?? [], [data?.templates]);
  const favorites = useMemo(() => new Set(data?.favoriteIds ?? []), [data?.favoriteIds]);

  /*
   * Everything the search box and the favourites toggle allow, before the
   * category is applied. The chip counts come from this, so "Düğün 0" answers
   * why the grid is empty instead of leaving the category looking broken.
   */
  const candidates = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    return templates.filter((template) => (!favoritesOnly || favorites.has(template.id))
      && (!normalized
        || template.name.toLocaleLowerCase('tr-TR').includes(normalized)
        || template.description?.toLocaleLowerCase('tr-TR').includes(normalized)));
  }, [favorites, favoritesOnly, query, templates]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const template of candidates) counts.set(template.category, (counts.get(template.category) ?? 0) + 1);
    // Sorted by the label, not the stored slug, so the rail reads alphabetically
    // in the language it is shown in.
    return [...counts.entries()]
      .map(([value, count]) => ({ count, label: templateCategoryLabel(value), value }))
      .sort((left, right) => left.label.localeCompare(right.label, 'tr-TR'));
  }, [candidates]);

  const visibleTemplates = useMemo(
    () => candidates.filter((template) => category === null || template.category === category),
    [candidates, category],
  );

  async function toggleFavorite(templateId: string) {
    setActionError(null);
    const nextFavorite = !favorites.has(templateId);
    try {
      await setTemplateFavorite(templateId, nextFavorite);
      trackEvent(ANALYTICS_EVENTS.templateFavorited, { favorited: nextFavorite, template_id: templateId });
      reload();
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    }
  }

  async function openTemplate(template: (typeof templates)[number]) {
    setActionError(null);
    if (template.tier === 'free') {
      trackEvent(ANALYTICS_EVENTS.templateOpened, { category: template.category, template_id: template.id, tier: template.tier });
      router.push(`/editor/new?templateId=${encodeURIComponent(template.id)}` as Href);
      return;
    }
    if (!featureFlags.rewardedAds) {
      setActionError('Bu şablon ödüllü reklamla açılacak; reklam servisi şu anda kapalı.');
      return;
    }
    setOpeningTemplateId(template.id);
    try {
      trackEvent(ANALYTICS_EVENTS.rewardedAdRequested, { feature: 'single_premium_template' });
      const reward = await rewardedAdGateway.requestReward('single_premium_template', { templateId: template.id });
      if (!reward.granted || !reward.receiptId) throw new Error('Ödül doğrulanamadı.');
      trackEvent(ANALYTICS_EVENTS.rewardedAdGranted, { feature: 'single_premium_template' });
      trackEvent(ANALYTICS_EVENTS.templateOpened, { category: template.category, template_id: template.id, tier: template.tier });
      router.push(`/editor/new?templateId=${encodeURIComponent(template.id)}&rewardReceiptId=${encodeURIComponent(reward.receiptId)}` as Href);
    } catch (nextError) {
      trackEvent(ANALYTICS_EVENTS.rewardedAdFailed, { feature: 'single_premium_template' });
      setActionError(getErrorMessage(nextError));
    } finally {
      setOpeningTemplateId(null);
    }
  }

  return (
    <Screen eyebrow="Koleksiyon" onRefresh={refresh} refreshing={refreshing} title="Hikâyene uyan tasarımı bul">
      <PrimaryButton accessibilityLabel="Boş bir davet tasarımı oluştur" icon="add-outline" onPress={() => { trackEvent(ANALYTICS_EVENTS.blankDesignStarted); router.push('/editor/new'); }}>Boş tasarımla başla</PrimaryButton>
      <View style={styles.searchWrap}>
        <Ionicons color={colors.inkMuted} name="search-outline" size={20} />
        <TextInput
          accessibilityLabel="Şablon ara"
          onChangeText={setQuery}
          placeholder="Şablon veya tema ara"
          placeholderTextColor={colors.inkMuted}
          style={styles.search}
          value={query}
        />
      </View>

      {/*
        One scrolling rail instead of a wrapping block. Favourites is a toggle
        that combines with the category, but as an identical pill beside "Tümü"
        it read as a fourth mutually exclusive option — and the categories
        printed their raw English slugs. It is now an icon pill, set apart by a
        rule from the single-choice category segment, and the categories carry
        their Turkish names and a count.
      */}
      <View style={styles.filterBar}>
        <Pressable
          accessibilityLabel={favoritesOnly ? 'Favori filtresini kaldır' : `Yalnızca favorileri göster, ${favorites.size} şablon`}
          accessibilityRole="button"
          accessibilityState={{ selected: favoritesOnly }}
          onPress={() => setFavoritesOnly((value) => !value)}
          style={[styles.favoriteFilter, favoritesOnly && styles.favoriteFilterActive]}>
          <Ionicons
            color={favoritesOnly ? colors.white : colors.primaryText}
            name={favoritesOnly ? 'heart' : 'heart-outline'}
            size={17}
          />
          <Text style={[styles.favoriteFilterText, favoritesOnly && styles.filterTextActive]}>{favorites.size}</Text>
        </Pressable>

        <View style={styles.filterDivider} />

        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}>
          <Pressable
            accessibilityLabel={`Tüm kategoriler, ${candidates.length} şablon`}
            accessibilityRole="button"
            accessibilityState={{ selected: category === null }}
            onPress={() => setCategory(null)}
            style={[styles.filter, category === null && styles.filterActive]}>
            <Text style={[styles.filterText, category === null && styles.filterTextActive]}>Tümü</Text>
            <Text style={[styles.filterCount, category === null && styles.filterCountActive]}>{candidates.length}</Text>
          </Pressable>
          {categories.map((filter) => (
            <Pressable
              accessibilityLabel={`${filter.label}, ${filter.count} şablon`}
              accessibilityRole="button"
              accessibilityState={{ selected: category === filter.value }}
              key={filter.value}
              onPress={() => setCategory(category === filter.value ? null : filter.value)}
              style={[styles.filter, category === filter.value && styles.filterActive]}>
              <Text style={[styles.filterText, category === filter.value && styles.filterTextActive]}>{filter.label}</Text>
              <Text style={[styles.filterCount, category === filter.value && styles.filterCountActive]}>{filter.count}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {actionError ? <Text accessibilityLiveRegion="polite" style={styles.actionError}>{actionError}</Text> : null}

      {loading ? <ActivityIndicator color={colors.secondary} size="large" /> : null}
      {error ? (
        <Pressable accessibilityRole="button" onPress={() => void reload()} style={styles.stateCard}>
          <Ionicons color={colors.primaryText} name="refresh-outline" size={28} />
          <Text style={styles.stateTitle}>{error}</Text>
          <Text style={styles.stateText}>Tekrar denemek için dokunun.</Text>
        </Pressable>
      ) : null}
      {!loading && !error && visibleTemplates.length === 0 ? (
        <View style={styles.stateCard}>
          <Ionicons color={colors.inkMuted} name="color-palette-outline" size={30} />
          <Text style={styles.stateTitle}>Bu filtrede şablon bulunamadı</Text>
          <Text style={styles.stateText}>Aramanızı veya kategori seçiminizi değiştirin.</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {visibleTemplates.map((template) => (
          <Pressable
            accessibilityLabel={`${template.name} şablonunu aç`}
            accessibilityRole="button"
            key={template.id}
            disabled={openingTemplateId !== null}
            onPress={() => void openTemplate(template)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={styles.preview}>
              {template.thumbnailUrl || template.defaultImageUrl ? (
                <Image contentFit="cover" source={template.thumbnailUrl ?? template.defaultImageUrl} style={styles.image} transition={180} />
              ) : (
                <Text style={styles.previewInitial}>{template.name.slice(0, 1)}</Text>
              )}
              {template.tier !== 'free' ? (
                <View style={styles.rewardBadge}>
                  <Ionicons color={colors.primaryText} name="play-circle" size={14} />
                  <Text style={styles.rewardBadgeText}>Reklamla tek kullanım</Text>
                </View>
              ) : null}
              {openingTemplateId === template.id ? <ActivityIndicator color={colors.white} size="small" style={styles.opening} /> : null}
              <Pressable accessibilityLabel={favorites.has(template.id) ? `${template.name} favorilerden çıkar` : `${template.name} favorilere ekle`} disabled={!featureFlags.backendWrites} hitSlop={8} onPress={(event) => { event.stopPropagation(); void toggleFavorite(template.id); }} style={[styles.favorite, !featureFlags.backendWrites && styles.favoriteDisabled]}><Ionicons color={favorites.has(template.id) ? colors.primaryText : colors.inkMuted} name={favorites.has(template.id) ? 'heart' : 'heart-outline'} size={20} /></Pressable>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.category}>{templateCategoryLabel(template.category)}</Text>
              <Text numberOfLines={2} style={styles.cardTitle}>{template.name}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.lg },
  search: { color: colors.ink, flex: 1, fontFamily: typography.body, fontSize: 15, minHeight: 50, paddingHorizontal: spacing.sm },
  filterBar: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  // Icon and count, not the word "Favoriler": at full width the pill pushed the
  // categories onto a second row, and a heart needs no label.
  favoriteFilter: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 13,
  },
  favoriteFilterActive: { backgroundColor: colors.primaryText, borderColor: colors.primaryText },
  favoriteFilterText: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 13, fontWeight: '700' },
  // Reads as "this toggle is a separate thing from the choice on the right".
  filterDivider: { backgroundColor: colors.border, height: 22, width: StyleSheet.hairlineWidth },
  filterScroll: { flex: 1, marginHorizontal: -spacing.xs },
  filterRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs },
  filter: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
  },
  filterActive: { backgroundColor: colors.plum, borderColor: colors.plum },
  filterText: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 13 },
  filterTextActive: { color: colors.white, fontWeight: '700' },
  filterCount: { color: colors.inkMuted, fontFamily: typography.bodyMedium, fontSize: 11, fontWeight: '700' },
  filterCountActive: { color: colors.onPlum },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { ...shadow, backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', width: '47.8%' },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  preview: { alignItems: 'center', aspectRatio: 0.78, backgroundColor: colors.plum, justifyContent: 'center', position: 'relative' },
  image: { height: '100%', width: '100%' },
  previewInitial: { color: colors.white, fontFamily: typography.display, fontSize: 58, fontStyle: 'italic' },
  rewardBadge: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, bottom: spacing.sm, flexDirection: 'row', gap: 4, left: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 6, position: 'absolute' },
  rewardBadgeText: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 9, fontWeight: '800' },
  favorite: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, height: 36, justifyContent: 'center', position: 'absolute', right: spacing.sm, top: spacing.sm, width: 36 },
  favoriteDisabled: { opacity: 0.7 },
  opening: { position: 'absolute' },
  cardBody: { gap: 3, padding: spacing.md },
  category: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 10, fontWeight: '700' },
  cardTitle: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 14, fontWeight: '700' },
  stateCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.xl },
  stateTitle: { color: colors.ink, fontFamily: typography.bodyMedium, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  stateText: { color: colors.inkMuted, fontFamily: typography.body, fontSize: 13, textAlign: 'center' },
  actionError: { color: colors.primaryText, fontFamily: typography.bodyMedium, fontSize: 12, textAlign: 'center' },
});
