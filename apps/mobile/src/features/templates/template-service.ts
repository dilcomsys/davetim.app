import { decodeTemplate } from '@/domain/decoders';
import type { InvitationTemplate } from '@/domain/models';
import { assertBackendWritesEnabled } from '@/config/feature-flags';
import { RemoteDataError } from '@/lib/remote-data';
import { resolveTemplateAssetUrl } from '@/features/templates/template-image';
import { requireSupabaseClient } from '@/lib/supabase';

const TEMPLATE_COLUMNS = [
  'id',
  'name',
  'description',
  'category',
  'subcategory',
  'tier',
  'thumbnail_url',
  'default_image_url',
  'color_palette',
  'text_fields',
  'decorative_elements',
  'available_fonts',
  'is_featured',
  'sort_order',
  'updated_at',
].join(',');

/*
 * The single place a template crosses from storage keys into something the UI
 * can render. Doing it here rather than at each `<Image>` means the gallery,
 * the editor background and anything added later all get a usable URL without
 * having to remember the bucket.
 */
function withResolvedAssets(template: InvitationTemplate): InvitationTemplate {
  return {
    ...template,
    thumbnailUrl: resolveTemplateAssetUrl(template.thumbnailUrl),
    defaultImageUrl: resolveTemplateAssetUrl(template.defaultImageUrl),
  };
}

export async function listTemplates(): Promise<InvitationTemplate[]> {
  const { data, error } = await requireSupabaseClient()
    .from('templates')
    .select(TEMPLATE_COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(200);

  if (error) throw new RemoteDataError('Şablonlar yüklenemedi. Lütfen tekrar deneyin.', error);
  return (data ?? [])
    .map(decodeTemplate)
    .filter((item): item is InvitationTemplate => item !== null)
    .map(withResolvedAssets);
}

export async function getTemplateById(templateId: string): Promise<InvitationTemplate> {
  const { data, error } = await requireSupabaseClient()
    .from('templates')
    .select(TEMPLATE_COLUMNS)
    .eq('id', templateId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new RemoteDataError('Şablon yüklenemedi. Lütfen tekrar deneyin.', error);
  const template = decodeTemplate(data);
  if (!template) throw new RemoteDataError('Şablon bulunamadı.');
  return withResolvedAssets(template);
}

export async function listFavoriteTemplateIds(userId: string): Promise<string[]> {
  const { data, error } = await requireSupabaseClient()
    .from('user_templates')
    .select('template_id')
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .limit(200);
  if (error) throw new RemoteDataError('Favori şablonlar yüklenemedi.', error);
  return (data ?? []).map((item) => item.template_id).filter((id): id is string => typeof id === 'string');
}

export async function setTemplateFavorite(templateId: string, favorite: boolean): Promise<void> {
  assertBackendWritesEnabled();
  const { error } = await requireSupabaseClient().rpc('set_template_favorite', {
    p_favorite: favorite,
    p_template_id: templateId,
  });
  if (error) throw new RemoteDataError('Favori tercihi kaydedilemedi.', error);
}
