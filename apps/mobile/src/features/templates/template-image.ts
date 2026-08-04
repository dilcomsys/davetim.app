/*
 * Template artwork lives in the public `templates` storage bucket, but the rows
 * only store the bucket-relative key the web seeder wrote ("wedding/classic.jpg").
 * Handing that straight to `expo-image` gives it a path with no host, so every
 * card in the gallery and every template background in the editor came up blank.
 * The web client resolved the same paths through `supabase.storage.getPublicUrl`;
 * this is the mobile equivalent, kept free of the client so it stays testable.
 */

const TEMPLATE_BUCKET = 'templates';

/** Anything already addressable is passed through untouched. */
function isAbsolute(path: string) {
  return /^(https?|data|file|blob):/i.test(path);
}

export function buildPublicStorageUrl(baseUrl: string, bucket: string, path: string) {
  const origin = baseUrl.replace(/\/+$/, '');
  const key = path
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');
  return `${origin}/storage/v1/object/public/${bucket}/${key}`;
}

export function resolveTemplateAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (isAbsolute(path)) return path;

  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  // Without a project URL there is nothing to resolve against. Returning null
  // rather than the bare path lets the gallery fall back to its initial tile
  // instead of showing a broken image frame.
  if (!baseUrl) return null;

  return buildPublicStorageUrl(baseUrl, TEMPLATE_BUCKET, path.replace(/^\/+/, ''));
}
