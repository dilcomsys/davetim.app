import { supabase } from '../services/supabase';

/**
 * Template görsellerini Supabase Storage'dan getirmek için helper
 * 
 * DB'de kaydedilen path: "wedding/classic.jpg"
 * Dönen URL: "https://your-project.supabase.co/storage/v1/object/public/templates/wedding/classic.jpg"
 */

const STORAGE_BUCKET = 'templates';

/**
 * Template image path'ini tam URL'e çevirir
 */
export const getTemplateImageUrl = (path: string | null | undefined): string => {
  if (!path) {
    // Fallback: default placeholder
    return '/placeholder-template.jpg';
  }

  // Eğer zaten tam URL ise (http/https ile başlıyorsa), direkt dön
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Supabase Storage public URL oluştur
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Template için thumbnail URL (küçük boyut)
 */
export const getTemplateThumbnailUrl = (path: string | null | undefined): string => {
  const baseUrl = getTemplateImageUrl(path);
  
  // Eğer placeholder ise, olduğu gibi dön
  if (baseUrl.includes('placeholder')) {
    return baseUrl;
  }

  // Supabase Storage transformation ile küçük boyut
  // ?width=400&height=300&resize=cover
  return `${baseUrl}?width=400&height=300&resize=cover`;
};

/**
 * Template için tam boyut URL
 */
export const getTemplateFullUrl = (path: string | null | undefined): string => {
  const baseUrl = getTemplateImageUrl(path);
  
  // Eğer placeholder ise, olduğu gibi dön
  if (baseUrl.includes('placeholder')) {
    return baseUrl;
  }

  // Tam boyut için transformation
  return `${baseUrl}?width=800&height=600&resize=cover`;
};

